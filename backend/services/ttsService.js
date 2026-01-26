const { createClient } = require('@deepgram/sdk');
const fs = require('fs');
const path = require('path');

/**
 * All Deepgram Aura English voices (45 total)
 */
const VOICE_MODEL_MAP = {
  // Female voices (25)
  1: { model: "aura-thalia-en", description: "Thalia - Default female", gender: "female" },
  2: { model: "aura-andromeda-en", description: "Andromeda - Female", gender: "female" },
  3: { model: "aura-helena-en", description: "Helena - Female", gender: "female" },
  4: { model: "aura-amalthea-en", description: "Amalthea - Female", gender: "female" },
  5: { model: "aura-asteria-en", description: "Asteria - Warm friendly female", gender: "female" },
  6: { model: "aura-athena-en", description: "Athena - Clear precise female", gender: "female" },
  7: { model: "aura-aurora-en", description: "Aurora - Female", gender: "female" },
  8: { model: "aura-callista-en", description: "Callista - Female", gender: "female" },
  9: { model: "aura-cora-en", description: "Cora - Female", gender: "female" },
  10: { model: "aura-cordelia-en", description: "Cordelia - Female", gender: "female" },
  11: { model: "aura-delia-en", description: "Delia - Female", gender: "female" },
  12: { model: "aura-electra-en", description: "Electra - Female", gender: "female" },
  13: { model: "aura-harmonia-en", description: "Harmonia - Female", gender: "female" },
  14: { model: "aura-hera-en", description: "Hera - Professional female", gender: "female" },
  15: { model: "aura-iris-en", description: "Iris - Female", gender: "female" },
  16: { model: "aura-juno-en", description: "Juno - Female", gender: "female" },
  17: { model: "aura-luna-en", description: "Luna - Expressive female", gender: "female" },
  18: { model: "aura-minerva-en", description: "Minerva - Female", gender: "female" },
  19: { model: "aura-ophelia-en", description: "Ophelia - Female", gender: "female" },
  20: { model: "aura-pandora-en", description: "Pandora - Female", gender: "female" },
  21: { model: "aura-phoebe-en", description: "Phoebe - Female", gender: "female" },
  22: { model: "aura-selene-en", description: "Selene - Female", gender: "female" },
  23: { model: "aura-stella-en", description: "Stella - Conversational female", gender: "female" },
  24: { model: "aura-theia-en", description: "Theia - Female", gender: "female" },
  25: { model: "aura-vesta-en", description: "Vesta - Female", gender: "female" },

  // Male voices (20)
  26: { model: "aura-apollo-en", description: "Apollo - Male", gender: "male" },
  27: { model: "aura-arcas-en", description: "Arcas - Smooth male", gender: "male" },
  28: { model: "aura-aries-en", description: "Aries - Male", gender: "male" },
  29: { model: "aura-atlas-en", description: "Atlas - Male", gender: "male" },
  30: { model: "aura-draco-en", description: "Draco - Male", gender: "male" },
  31: { model: "aura-angus-en", description: "Angus - Gruff male", gender: "male" },
  32: { model: "aura-helios-en", description: "Helios - Energetic male", gender: "male" },
  33: { model: "aura-hermes-en", description: "Hermes - Male", gender: "male" },
  34: { model: "aura-hyperion-en", description: "Hyperion - Male", gender: "male" },
  35: { model: "aura-janus-en", description: "Janus - Male", gender: "male" },
  36: { model: "aura-jupiter-en", description: "Jupiter - Male", gender: "male" },
  37: { model: "aura-mars-en", description: "Mars - Male", gender: "male" },
  38: { model: "aura-neptune-en", description: "Neptune - Male", gender: "male" },
  39: { model: "aura-odysseus-en", description: "Odysseus - Male", gender: "male" },
  40: { model: "aura-orion-en", description: "Orion - Deep male", gender: "male" },
  41: { model: "aura-orpheus-en", description: "Orpheus - Narrative male", gender: "male" },
  42: { model: "aura-perseus-en", description: "Perseus - Authoritative male", gender: "male" },
  43: { model: "aura-pluto-en", description: "Pluto - Male", gender: "male" },
  44: { model: "aura-saturn-en", description: "Saturn - Male", gender: "male" },
  45: { model: "aura-zeus-en", description: "Zeus - Powerful male", gender: "male" }
};

// Grouped voices for UI display
const VOICE_GROUPS = {
  'Female': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
  'Male': [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45]
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
    return VOICE_MODEL_MAP[id] || VOICE_MODEL_MAP[40]; // Default to Orion (ID 40)
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
