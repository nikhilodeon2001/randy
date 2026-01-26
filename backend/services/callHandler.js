const OpenAI = require('openai');
const db = require('../db');
const ttsService = require('./ttsService');
const { getVoiceForCall, setVoiceForCall, getDefaultVoice } = require('../routes/voice');
const { loadCallerProfile } = require('./callerProfiles');
const twilio = require('twilio');

class CallHandler {
  constructor(callSid, fromNumber, toNumber, io) {
    this.callSid = callSid;
    this.fromNumber = fromNumber;
    this.toNumber = toNumber;
    this.io = io;
    this.conversationHistory = [];
    this.startTime = new Date();
    this.recordingStarted = false; // Track if recording has been started
    this.callerProfile = null; // Will be loaded in start()

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Initialize Twilio client
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // AI Configuration
    this.personality = process.env.AI_PERSONALITY || 'confused_grandparent';
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'; // Fastest model for minimal latency

    // Set voice for this call to the current default
    setVoiceForCall(this.callSid, getDefaultVoice());
  }

  /**
   * Start the call - save to database and emit to dashboard
   */
  async start() {
    console.log(`Starting call handler for ${this.callSid}`);

    // Load caller profile if it exists
    this.callerProfile = await loadCallerProfile(this.fromNumber);

    if (this.callerProfile) {
      console.log(`📋 Using personalized profile for ${this.fromNumber}`);
    } else {
      console.log(`👤 No profile found for ${this.fromNumber}, using default personality: ${this.personality}`);
    }

    // Save call to database
    await db.createCall({
      callSid: this.callSid,
      fromNumber: this.fromNumber,
      toNumber: this.toNumber,
      startTime: this.startTime,
      status: 'in-progress'
    });

    // Emit to dashboard
    this.io.emit('call:started', {
      callSid: this.callSid,
      from: this.fromNumber,
      startTime: this.startTime
    });
  }

  /**
   * Start recording - called after call is answered
   */
  async startRecording() {
    // Only start recording once
    if (this.recordingStarted) {
      return;
    }

    try {
      const appUrl = process.env.APP_URL || 'https://randy-scam-bait-927182c285b5.herokuapp.com';
      await this.twilioClient.calls(this.callSid)
        .recordings
        .create({
          recordingStatusCallback: `${appUrl}/twilio/recording`,
          recordingStatusCallbackMethod: 'POST'
        });
      this.recordingStarted = true;
      console.log(`✅ Recording started for call ${this.callSid}`);
    } catch (error) {
      console.error(`Error starting recording for call ${this.callSid}:`, error);
    }
  }

  /**
   * Get initial greeting
   */
  async getGreeting() {
    // Always generate LLM greeting (personalized for known callers, generic for unknown)
    const greeting = await this.generateGreeting();

    // Add to conversation history
    this.addMessage('assistant', greeting);

    return greeting;
  }

  /**
   * Generate greeting using LLM (personalized for known callers, varied for unknown)
   */
  async generateGreeting() {
    const startTime = Date.now();
    try {
      console.log(`🎨 Generating greeting for ${this.fromNumber}...`);

      let prompt;

      if (this.callerProfile) {
        // Personalized greeting for known callers
        prompt = `You are Doug, Nikhil's personal AI assistant, answering a phone call. Based on the caller profile below, generate a warm, HIGHLY personalized greeting (2-3 sentences).

CALLER PROFILE:
${this.callerProfile}

INSTRUCTIONS:
- Start by introducing yourself: "Hi, this is Doug, Nikhil's AI assistant"
- Use their first name or nickname (NOT full formal name)
- IMPORTANT: Reference 1-2 specific details from their profile to show you know them:
  * Their current job/role/company
  * Their relationship to Nikhil (wife, father, friend, etc.)
  * A shared connection (like both went to UC Berkeley)
  * Their expertise or field
  * Recent career milestone if mentioned
- Mention that you can take a message for Nikhil or chat with them
- Be warm and natural - this is someone Nikhil knows personally
- Vary the wording each time - don't use the exact same phrases

Example variations:
- "Hi, this is Doug, Nikhil's AI assistant. Amy! How's everything at BillionToOne? Feel free to leave a message for Nikhil, or we can chat - your choice!"
- "Hey, this is Doug, Nikhil's AI. Subhash! Hope the semester is going well at USC. I can take a message for Nikhil or just catch up with you."
- "Hi, Doug here - Nikhil's AI assistant. Jay! How are things in the real estate world? Happy to pass a message to Nikhil or just talk."

Generate ONLY the greeting text you would speak. Make it feel genuinely personal by referencing specific details from the profile.`;
      } else {
        // Generic greeting for unknown callers (varied each time)
        prompt = `You are Doug, Nikhil's personal AI assistant, answering a phone call from an unknown number. Generate a friendly, professional greeting (2-3 sentences).

INSTRUCTIONS:
- Introduce yourself: "Hi, this is Doug, Nikhil's AI assistant"
- Let them know they can leave a message or chat with you
- Be friendly but professional
- IMPORTANT: Vary the wording significantly each time - don't repeat the same phrases
- Keep it natural and conversational

Example variations:
- "Hi, this is Doug, Nikhil's personal AI assistant. What can I help you with today? Feel free to leave a message for Nikhil, or just chat with me!"
- "Hey there! This is Doug, Nikhil's AI. I'm here to help - you can let me know what you need and I'll pass it along to Nikhil, or we can just talk. Your call!"
- "Hi, Doug here - I'm Nikhil's AI assistant. Happy to take a message for him or just have a conversation. What's on your mind?"

Generate ONLY the greeting text. Be creative with the wording.`;
      }

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are Doug, a friendly AI assistant that answers phone calls for Nikhil. Generate varied, natural greetings.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9, // High temperature for variety
        max_tokens: 80
      });

      const duration = Date.now() - startTime;
      const greeting = completion.choices[0]?.message?.content?.trim() || "Hi, this is Doug, Nikhil's AI assistant. How can I help you?";
      console.log(`✅ Greeting generated in ${duration}ms: "${greeting}"`);

      return greeting;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Error generating greeting after ${duration}ms:`, error);
      // Fallback to generic greeting
      return "Hi, this is Doug, Nikhil's AI assistant. How can I help you today?";
    }
  }

  /**
   * Generate audio file for text using Deepgram TTS
   */
  async generateAudio(text) {
    const startTime = Date.now();
    try {
      const voiceModel = getVoiceForCall(this.callSid);
      console.log(`⏱️ Starting Deepgram TTS for ${this.callSid} with voice: ${voiceModel}`);

      const result = await ttsService.generateSpeech(text, voiceModel, this.callSid);

      const duration = Date.now() - startTime;
      console.log(`✅ Deepgram TTS completed in ${duration}ms: ${result.filename}`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ TTS error after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Process user's speech and generate AI response
   */
  async processUserSpeech(speechText) {
    console.log(`Processing speech for ${this.callSid}: "${speechText}"`);

    // Add user message to history
    this.addMessage('user', speechText);

    // Generate AI response
    const aiResponse = await this.generateResponse();

    // Add AI response to history
    this.addMessage('assistant', aiResponse);

    // Save to database and emit to dashboard in background (non-blocking)
    // Don't await these - they can happen async while we generate TTS
    db.updateTranscript(this.callSid, this.conversationHistory).catch(err => {
      console.error('Error updating transcript:', err);
    });

    this.io.emit('call:transcript', {
      callSid: this.callSid,
      messages: this.conversationHistory
    });

    return aiResponse;
  }

  /**
   * Generate AI response using GPT-4
   */
  async generateResponse() {
    const startTime = Date.now();
    try {
      const systemPrompt = this.getSystemPrompt();

      // Only keep last 6 messages (3 exchanges) to reduce latency
      const recentHistory = this.conversationHistory.slice(-6);

      const messages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      console.log(`⏱️ Starting GPT request (${this.model}) for ${this.callSid}...`);
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.8,
        max_tokens: 60, // Increased for more complete responses (2-3 sentences)
      });

      const duration = Date.now() - startTime;
      const response = completion.choices[0]?.message?.content || "I didn't catch that. Could you repeat?";
      console.log(`✅ GPT completed in ${duration}ms: "${response}"`);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ GPT error after ${duration}ms:`, error);
      return "Sorry, could you say that again?";
    }
  }

  /**
   * Get system prompt based on caller profile
   */
  getSystemPrompt() {
    // If caller has a profile, use personalized system prompt
    if (this.callerProfile) {
      return `You are Doug, Nikhil's personal AI assistant, handling a phone call from someone he knows. Use the profile information below to have a natural, personalized conversation.

CALLER PROFILE:
${this.callerProfile}

YOUR ROLE:
- You are Doug, a friendly AI assistant that answers calls for Nikhil
- This is someone Nikhil knows personally - be warm and personable
- You can take messages for Nikhil or have a conversation with the caller
- Reference details from their profile naturally when relevant
- Keep responses conversational and brief (2-3 sentences max)
- Be helpful and engaging

If they want to leave a message for Nikhil, let them know you'll pass it along. If they just want to chat, have a friendly conversation using what you know about them from the profile.`;
    }

    // For unknown callers, use friendly AI assistant prompt
    return `You are Doug, Nikhil's personal AI assistant, handling a phone call.

YOUR ROLE:
- You are Doug, a friendly AI assistant that answers calls for Nikhil
- You can take messages for Nikhil or have a conversation with the caller
- Be helpful, professional, and conversational
- Keep responses brief (2-3 sentences max) for natural phone conversation
- Ask clarifying questions if needed
- Be warm and engaging

If they want to leave a message for Nikhil, get the details and let them know you'll pass it along. If they seem like a sales call or spam, you can politely engage and waste their time while being friendly.`;
  }

  /**
   * Add message to conversation history
   */
  addMessage(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date()
    });
  }

  /**
   * End the call - save final state
   */
  async end() {
    console.log(`Ending call handler for ${this.callSid}`);

    const endTime = new Date();
    const duration = Math.floor((endTime - this.startTime) / 1000); // duration in seconds

    // Update call in database
    await db.updateCall(this.callSid, {
      endTime,
      duration,
      status: 'completed',
      messageCount: this.conversationHistory.length
    });

    // Emit to dashboard
    this.io.emit('call:ended', {
      callSid: this.callSid,
      duration,
      messageCount: this.conversationHistory.length
    });
  }
}

module.exports = CallHandler;
