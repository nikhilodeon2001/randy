const { createClient } = require('@deepgram/sdk');
const fs = require('fs');
const path = require('path');

/**
 * Valid Deepgram Aura voices - using actual working models
 */
const VOICE_MODEL_MAP = {
  1: { model: "aura-asteria-en", description: "Asteria - Warm friendly female" },
  2: { model: "aura-luna-en", description: "Luna - Expressive female" },
  3: { model: "aura-stella-en", description: "Stella - Conversational female" },
  4: { model: "aura-athena-en", description: "Athena - Clear precise female" },
  5: { model: "aura-hera-en", description: "Hera - Professional female" },
  6: { model: "aura-orion-en", description: "Orion - Deep male" },
  7: { model: "aura-arcas-en", description: "Arcas - Smooth male" },
  8: { model: "aura-perseus-en", description: "Perseus - Authoritative male" },
  9: { model: "aura-angus-en", description: "Angus - Gruff male" },
  10: { model: "aura-orpheus-en", description: "Orpheus - Narrative male" },
  11: { model: "aura-helios-en", description: "Helios - Energetic male" },
  12: { model: "aura-zeus-en", description: "Zeus - Powerful male" }
};

// Grouped voices for UI display
const VOICE_GROUPS = {
  'Female': [1, 2, 3, 4, 5],
  'Male': [6, 7, 8, 9, 10, 11, 12]
};

class TTSService {
  constructor() {
    this.deepgram = createClient(process.env.DEEPGRAM_API_KEY);
    this.audioDir = path.join(__dirname, '../audio');

    // Ensure audio directory exists
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  /**
   * Convert text to speech using Deepgram
   * Based on Discord bot's text_to_speech function
   */
  async generateSpeech(text, model = "aura-2-thalia-en", callSid = null) {
    try {
      // Generate filename
      const timestamp = Date.now();
      const filename = callSid
        ? `${callSid}_${timestamp}.mp3`
        : `audio_${timestamp}.mp3`;
      const filepath = path.join(this.audioDir, filename);

      console.log(`Generating speech with model: ${model}`);

      const response = await this.deepgram.speak.request(
        { text },
        {
          model: model
        }
      );

      // Get audio stream
      const stream = await response.getStream();
      if (!stream) {
        throw new Error('Failed to get audio stream from Deepgram');
      }

      // Write stream to file
      const buffer = await this.getAudioBuffer(stream);
      fs.writeFileSync(filepath, buffer);

      console.log(`Audio saved to: ${filepath} using model: ${model}`);
      return { filepath, filename, model };

    } catch (error) {
      console.error(`Error with model ${model}:`, error);

      // Fallback to default model (Thalia)
      if (model !== "aura-2-thalia-en") {
        console.log('Falling back to default model: aura-2-thalia-en');
        return this.generateSpeech(text, "aura-2-thalia-en", callSid);
      }

      throw error;
    }
  }

  /**
   * Convert stream to buffer
   */
  async getAudioBuffer(stream) {
    const reader = stream.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  }

  /**
   * Get all available voice models
   */
  getVoiceModels() {
    return VOICE_MODEL_MAP;
  }

  /**
   * Get voice models grouped by category
   */
  getGroupedVoices() {
    return VOICE_GROUPS;
  }

  /**
   * Get voice model by ID
   */
  getVoiceById(id) {
    return VOICE_MODEL_MAP[id] || VOICE_MODEL_MAP[1]; // Default to Thalia
  }

  /**
   * Clean up old audio files (older than 1 hour)
   */
  cleanupOldAudio() {
    const files = fs.readdirSync(this.audioDir);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    files.forEach(file => {
      const filepath = path.join(this.audioDir, file);
      const stats = fs.statSync(filepath);
      const age = now - stats.mtimeMs;

      if (age > oneHour) {
        fs.unlinkSync(filepath);
        console.log(`Deleted old audio file: ${file}`);
      }
    });
  }
}

module.exports = new TTSService();
