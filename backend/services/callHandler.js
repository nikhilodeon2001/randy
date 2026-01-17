const OpenAI = require('openai');
const db = require('../db');
const ttsService = require('./ttsService');
const { getVoiceForCall, setVoiceForCall, getDefaultVoice } = require('../routes/voice');
const twilio = require('twilio');

class CallHandler {
  constructor(callSid, fromNumber, toNumber, io) {
    this.callSid = callSid;
    this.fromNumber = fromNumber;
    this.toNumber = toNumber;
    this.io = io;
    this.conversationHistory = [];
    this.startTime = new Date();

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
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';

    // Set voice for this call to the current default
    setVoiceForCall(this.callSid, getDefaultVoice());
  }

  /**
   * Start the call - save to database and emit to dashboard
   */
  async start() {
    console.log(`Starting call handler for ${this.callSid}`);

    // Save call to database
    await db.createCall({
      callSid: this.callSid,
      fromNumber: this.fromNumber,
      toNumber: this.toNumber,
      startTime: this.startTime,
      status: 'in-progress'
    });

    // Start recording the call
    try {
      const appUrl = process.env.APP_URL || 'https://randy-scam-bait-927182c285b5.herokuapp.com';
      await this.twilioClient.calls(this.callSid)
        .recordings
        .create({
          recordingStatusCallback: `${appUrl}/twilio/recording`,
          recordingStatusCallbackMethod: 'POST'
        });
      console.log(`✅ Recording started for call ${this.callSid}`);
    } catch (error) {
      console.error(`Error starting recording for call ${this.callSid}:`, error);
    }

    // Emit to dashboard
    this.io.emit('call:started', {
      callSid: this.callSid,
      from: this.fromNumber,
      startTime: this.startTime
    });
  }

  /**
   * Get initial greeting
   */
  async getGreeting() {
    const greetings = {
      confused_grandparent: "Hello? Who is this? Is this my grandson?",
      tech_support: "Thank you for calling Tech Support. Can I have your case number please?",
      interested_buyer: "Oh hi! Is this about the product I was looking at?",
      conspiracy_theorist: "Hello... how did you get this number? Who sent you?",
      busy_professional: "Yes? Make it quick, I'm in a meeting."
    };

    const greeting = greetings[this.personality] || greetings.confused_grandparent;

    // Add to conversation history
    this.addMessage('assistant', greeting);

    return greeting;
  }

  /**
   * Generate audio file for text using Deepgram TTS
   */
  async generateAudio(text) {
    try {
      const voiceModel = getVoiceForCall(this.callSid);
      const result = await ttsService.generateSpeech(text, voiceModel, this.callSid);

      console.log(`Generated audio: ${result.filename} with voice: ${voiceModel}`);

      return result;
    } catch (error) {
      console.error('Error generating audio:', error);
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

    // Save to database
    await db.updateTranscript(this.callSid, this.conversationHistory);

    // Emit to dashboard
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
    try {
      const systemPrompt = this.getSystemPrompt();

      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.8,
        max_tokens: 100, // Keep responses brief for phone conversation
      });

      return completion.choices[0]?.message?.content || "I didn't catch that. Could you repeat?";
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "Sorry, could you say that again?";
    }
  }

  /**
   * Get system prompt based on personality
   */
  getSystemPrompt() {
    const prompts = {
      confused_grandparent: `You are an elderly grandparent who is confused by technology and modern scams.
You mishear things frequently, go off on tangents about your grandchildren, and need everything explained slowly.
You're friendly but easily distracted. Keep responses very brief (1-2 sentences) for phone conversation.
Ask follow-up questions to keep them engaged.`,

      tech_support: `You are a tech support representative who is overly thorough and asks many clarifying questions.
You follow a strict troubleshooting protocol and need to verify every detail multiple times.
You're patient but bureaucratic. Keep responses brief (1-2 sentences) but ask many questions.`,

      interested_buyer: `You are someone genuinely interested in what the caller is offering, but you have many concerns and questions.
You're enthusiastic but indecisive, always asking for more details and comparing options.
You frequently get sidetracked. Keep responses brief (1-2 sentences) and curious.`,

      conspiracy_theorist: `You are someone who believes the caller is part of a larger conspiracy.
You ask probing questions about who they really work for and what their true motives are.
You're skeptical but weirdly engaged. Keep responses brief (1-2 sentences) and suspicious.`,

      busy_professional: `You are a busy professional taking a call between meetings.
You're distracted, frequently mention you have to go soon, but somehow keep staying on the line.
You ask them to repeat things because you're multitasking. Keep responses very brief (1 sentence).`
    };

    return prompts[this.personality] || prompts.confused_grandparent;
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
