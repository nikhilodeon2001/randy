const OpenAI = require('openai');
const db = require('../db');
const ttsService = require('./ttsService');
const { getVoiceForCall, setVoiceForCall, getDefaultVoice } = require('../routes/voice');
const { loadCallerProfile } = require('./callerProfiles');
const { registerActiveCall, unregisterActiveCall } = require('./websocket');
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
    this.isVoicemailOnly = false; // Will be set in start() based on profile

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
    // If default is a random voice, resolve it once now (per-call randomization)
    const defaultVoice = getDefaultVoice();
    if (defaultVoice.startsWith('random-')) {
      const resolvedVoice = ttsService.selectRandomVoice(defaultVoice);
      setVoiceForCall(this.callSid, resolvedVoice);
      console.log(`🎲 Default random voice resolved for call ${this.callSid}: ${resolvedVoice}`);
    } else {
      setVoiceForCall(this.callSid, defaultVoice);
    }
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
      this.isVoicemailOnly = false;
    } else {
      console.log(`👤 No profile found for ${this.fromNumber} - voicemail-only mode`);
      this.isVoicemailOnly = true;
    }

    // Save call to database
    await db.createCall({
      callSid: this.callSid,
      fromNumber: this.fromNumber,
      toNumber: this.toNumber,
      startTime: this.startTime,
      status: 'in-progress'
    });

    // Register as active call
    const callData = {
      callSid: this.callSid,
      from: this.fromNumber,
      startTime: this.startTime
    };
    registerActiveCall(this.callSid, callData);

    // Emit to dashboard
    this.io.emit('call:started', callData);
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
      const appUrl = process.env.APP_URL || 'https://randy-ai-assistant.herokuapp.com';
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
   * Generate greeting using LLM (personalized for known callers, simple voicemail for unknown)
   */
  async generateGreeting() {
    const startTime = Date.now();

    // For unknown callers, return simple voicemail message (no LLM needed)
    if (!this.callerProfile) {
      console.log(`📞 Unknown caller - using simple voicemail greeting`);
      return "Please leave a message after the beep.";
    }

    // For known callers, generate personalized greeting
    try {
      console.log(`🎨 Generating greeting for ${this.fromNumber}...`);

      const prompt = `You answer phone calls for Nikhil. Based on the caller profile below, generate a warm, HIGHLY personalized greeting (2-3 sentences).

CALLER PROFILE:
${this.callerProfile}

INSTRUCTIONS:
- Start with a friendly greeting and use their first name or nickname (NOT full formal name)
- IMPORTANT: Reference 1-2 specific details from their profile to show you know them:
  * Their current job/role/company
  * Their relationship to Nikhil (wife, father, friend, etc.)
  * A shared connection (like both went to UC Berkeley)
  * Their expertise or field
  * Recent career milestone if mentioned
- Mention that you can take a message for Nikhil or chat with them
- Be warm and natural - this is someone Nikhil knows personally
- Vary the wording each time - don't use the exact same phrases
- Generate ONE complete greeting only - do not number it or provide multiple options

Example styles (pick ONE approach):
- "Hi Amy! How's everything at BillionToOne? Feel free to leave a message for Nikhil, or we can chat - your choice!"
- "Hey Subhash! Hope the semester is going well at USC. I can take a message for Nikhil or just catch up with you."
- "Hi Jay! How are things in the real estate world? Happy to pass a message to Nikhil or just talk."

Generate ONLY ONE greeting - output the text directly without numbering or bullet points. Make it feel genuinely personal by referencing specific details from the profile.`;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You answer phone calls for Nikhil. Generate varied, natural greetings.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 80
      });

      const duration = Date.now() - startTime;
      const greeting = completion.choices[0]?.message?.content?.trim() || "Hi! How can I help you?";
      console.log(`✅ Greeting generated in ${duration}ms: "${greeting}"`);

      return greeting;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Error generating greeting after ${duration}ms:`, error);
      return "Hi! How can I help you today?";
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
      return `You answer phone calls for Nikhil. This is someone he knows. Use the profile information below to have a natural, personalized conversation.

CALLER PROFILE:
${this.callerProfile}

YOUR ROLE:
- Be warm and personable - this is someone Nikhil knows personally
- You can take messages for Nikhil or have a conversation with the caller
- Reference details from their profile naturally when relevant
- Keep responses conversational and brief (2-3 sentences max)
- Be helpful and engaging

If they want to leave a message for Nikhil, let them know you'll pass it along. If they just want to chat, have a friendly conversation using what you know about them from the profile.`;
    }

    // For unknown callers, use friendly prompt
    return `You answer phone calls for Nikhil.

YOUR ROLE:
- Nikhil isn't available, so you're taking messages or chatting with the caller
- IMPORTANT: Always acknowledge and reference what the caller just said - show you're listening
- Be helpful, conversational, and natural in your responses
- Keep responses brief (2-3 sentences max) for natural phone conversation
- If they're leaving a message, acknowledge the content and let them know you'll pass it along
- If they're just chatting, engage naturally based on what they say

Example response styles:
- If they say "Tell him I'll be late": "Got it, I'll let Nikhil know you'll be running late. Anything else you'd like me to pass along?"
- If they ask a question: Respond naturally to their specific question and offer to relay any message
- If they make small talk: Engage with what they said, then ask if there's anything they want you to tell Nikhil

If they seem like a sales call or spam, you can politely engage and waste their time while being friendly.`;
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

    // Unregister active call
    unregisterActiveCall(this.callSid);

    // Emit to dashboard
    this.io.emit('call:ended', {
      callSid: this.callSid,
      duration,
      messageCount: this.conversationHistory.length
    });
  }
}

module.exports = CallHandler;
