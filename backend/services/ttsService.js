const { createClient } = require('@deepgram/sdk');
const fs = require('fs');
const path = require('path');

/**
 * All Deepgram Aura-2 English voices (41 total)
 * Updated with correct Aura-2 format and verified genders from official Deepgram docs
 */
const VOICE_MODEL_MAP = {
  // Female voices (26)
  1: { model: "aura-2-thalia-en", description: "Thalia - Default female", gender: "female" },
  2: { model: "aura-2-andromeda-en", description: "Andromeda - Female", gender: "female" },
  3: { model: "aura-2-helena-en", description: "Helena - Female", gender: "female" },
  4: { model: "aura-2-amalthea-en", description: "Amalthea - Female", gender: "female" },
  5: { model: "aura-2-asteria-en", description: "Asteria - Warm friendly female", gender: "female" },
  6: { model: "aura-2-athena-en", description: "Athena - Clear precise female", gender: "female" },
  7: { model: "aura-2-aurora-en", description: "Aurora - Female", gender: "female" },
  8: { model: "aura-2-callista-en", description: "Callista - Female", gender: "female" },
  9: { model: "aura-2-cora-en", description: "Cora - Female", gender: "female" },
  10: { model: "aura-2-cordelia-en", description: "Cordelia - Female", gender: "female" },
  11: { model: "aura-2-delia-en", description: "Delia - Female", gender: "female" },
  12: { model: "aura-2-electra-en", description: "Electra - Female", gender: "female" },
  13: { model: "aura-2-harmonia-en", description: "Harmonia - Female", gender: "female" },
  14: { model: "aura-2-hera-en", description: "Hera - Professional female", gender: "female" },
  15: { model: "aura-2-iris-en", description: "Iris - Female", gender: "female" },
  16: { model: "aura-2-janus-en", description: "Janus - Female", gender: "female" },
  17: { model: "aura-2-juno-en", description: "Juno - Female", gender: "female" },
  18: { model: "aura-2-luna-en", description: "Luna - Expressive female", gender: "female" },
  19: { model: "aura-2-minerva-en", description: "Minerva - Female", gender: "female" },
  20: { model: "aura-2-ophelia-en", description: "Ophelia - Female", gender: "female" },
  21: { model: "aura-2-pandora-en", description: "Pandora - Female", gender: "female" },
  22: { model: "aura-2-phoebe-en", description: "Phoebe - Female", gender: "female" },
  23: { model: "aura-2-selene-en", description: "Selene - Female", gender: "female" },
  24: { model: "aura-2-stella-en", description: "Stella - Conversational female", gender: "female" },
  25: { model: "aura-2-theia-en", description: "Theia - Female", gender: "female" },
  26: { model: "aura-2-vesta-en", description: "Vesta - Female", gender: "female" },

  // Male voices (15)
  27: { model: "aura-2-apollo-en", description: "Apollo - Male", gender: "male" },
  28: { model: "aura-2-arcas-en", description: "Arcas - Smooth male", gender: "male" },
  29: { model: "aura-2-aries-en", description: "Aries - Male", gender: "male" },
  30: { model: "aura-2-atlas-en", description: "Atlas - Male", gender: "male" },
  31: { model: "aura-2-draco-en", description: "Draco - Male", gender: "male" },
  32: { model: "aura-2-hermes-en", description: "Hermes - Male", gender: "male" },
  33: { model: "aura-2-hyperion-en", description: "Hyperion - Male", gender: "male" },
  34: { model: "aura-2-jupiter-en", description: "Jupiter - Male", gender: "male" },
  35: { model: "aura-2-mars-en", description: "Mars - Male", gender: "male" },
  36: { model: "aura-2-neptune-en", description: "Neptune - Male", gender: "male" },
  37: { model: "aura-2-odysseus-en", description: "Odysseus - Male", gender: "male" },
  38: { model: "aura-2-orion-en", description: "Orion - Deep male", gender: "male" },
  39: { model: "aura-2-orpheus-en", description: "Orpheus - Narrative male", gender: "male" },
  40: { model: "aura-2-pluto-en", description: "Pluto - Male", gender: "male" },
  41: { model: "aura-2-saturn-en", description: "Saturn - Male", gender: "male" },
  42: { model: "aura-2-zeus-en", description: "Zeus - Powerful male", gender: "male" }
};

// Grouped voices for UI display
const VOICE_GROUPS = {
  'Female': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
  'Male': [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42]
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
    return VOICE_MODEL_MAP[id] || VOICE_MODEL_MAP[38]; // Default to Orion (ID 38)
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
