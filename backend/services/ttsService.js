const { createClient } = require('@deepgram/sdk');
const fs = require('fs');
const path = require('path');

/**
 * All Deepgram Aura English voices (53 total: 41 Aura-2 + 12 Aura-1)
 * Aura-2 voices (IDs 1-42): Newer, higher quality, potentially slower
 * Aura-1 voices (IDs 43-54): Older, simpler, potentially faster for low-latency needs
 */
const VOICE_MODEL_MAP = {
  // Aura-2 Female voices (26)
  1: { model: "aura-2-thalia-en", description: "Thalia (Aura-2) - Default female", gender: "female", auraVersion: 2 },
  2: { model: "aura-2-andromeda-en", description: "Andromeda (Aura-2) - Female", gender: "female", auraVersion: 2 },
  3: { model: "aura-2-helena-en", description: "Helena (Aura-2) - Female", gender: "female", auraVersion: 2 },
  4: { model: "aura-2-amalthea-en", description: "Amalthea (Aura-2) - Female", gender: "female", auraVersion: 2 },
  5: { model: "aura-2-asteria-en", description: "Asteria (Aura-2) - Warm friendly female", gender: "female", auraVersion: 2 },
  6: { model: "aura-2-athena-en", description: "Athena (Aura-2) - Clear precise female", gender: "female", auraVersion: 2 },
  7: { model: "aura-2-aurora-en", description: "Aurora (Aura-2) - Female", gender: "female", auraVersion: 2 },
  8: { model: "aura-2-callista-en", description: "Callista (Aura-2) - Female", gender: "female", auraVersion: 2 },
  9: { model: "aura-2-cora-en", description: "Cora (Aura-2) - Female", gender: "female", auraVersion: 2 },
  10: { model: "aura-2-cordelia-en", description: "Cordelia (Aura-2) - Female", gender: "female", auraVersion: 2 },
  11: { model: "aura-2-delia-en", description: "Delia (Aura-2) - Female", gender: "female", auraVersion: 2 },
  12: { model: "aura-2-electra-en", description: "Electra (Aura-2) - Female", gender: "female", auraVersion: 2 },
  13: { model: "aura-2-harmonia-en", description: "Harmonia (Aura-2) - Female", gender: "female", auraVersion: 2 },
  14: { model: "aura-2-hera-en", description: "Hera (Aura-2) - Professional female", gender: "female", auraVersion: 2 },
  15: { model: "aura-2-iris-en", description: "Iris (Aura-2) - Female", gender: "female", auraVersion: 2 },
  16: { model: "aura-2-janus-en", description: "Janus (Aura-2) - Female", gender: "female", auraVersion: 2 },
  17: { model: "aura-2-juno-en", description: "Juno (Aura-2) - Female", gender: "female", auraVersion: 2 },
  18: { model: "aura-2-luna-en", description: "Luna (Aura-2) - Expressive female", gender: "female", auraVersion: 2 },
  19: { model: "aura-2-minerva-en", description: "Minerva (Aura-2) - Female", gender: "female", auraVersion: 2 },
  20: { model: "aura-2-ophelia-en", description: "Ophelia (Aura-2) - Female", gender: "female", auraVersion: 2 },
  21: { model: "aura-2-pandora-en", description: "Pandora (Aura-2) - Female", gender: "female", auraVersion: 2 },
  22: { model: "aura-2-phoebe-en", description: "Phoebe (Aura-2) - Female", gender: "female", auraVersion: 2 },
  23: { model: "aura-2-selene-en", description: "Selene (Aura-2) - Female", gender: "female", auraVersion: 2 },
  24: { model: "aura-2-stella-en", description: "Stella (Aura-2) - Conversational female", gender: "female", auraVersion: 2 },
  25: { model: "aura-2-theia-en", description: "Theia (Aura-2) - Female", gender: "female", auraVersion: 2 },
  26: { model: "aura-2-vesta-en", description: "Vesta (Aura-2) - Female", gender: "female", auraVersion: 2 },

  // Aura-2 Male voices (15)
  27: { model: "aura-2-apollo-en", description: "Apollo (Aura-2) - Male", gender: "male", auraVersion: 2 },
  28: { model: "aura-2-arcas-en", description: "Arcas (Aura-2) - Smooth male", gender: "male", auraVersion: 2 },
  29: { model: "aura-2-aries-en", description: "Aries (Aura-2) - Male", gender: "male", auraVersion: 2 },
  30: { model: "aura-2-atlas-en", description: "Atlas (Aura-2) - Male", gender: "male", auraVersion: 2 },
  31: { model: "aura-2-draco-en", description: "Draco (Aura-2) - Male", gender: "male", auraVersion: 2 },
  32: { model: "aura-2-hermes-en", description: "Hermes (Aura-2) - Male", gender: "male", auraVersion: 2 },
  33: { model: "aura-2-hyperion-en", description: "Hyperion (Aura-2) - Male", gender: "male", auraVersion: 2 },
  34: { model: "aura-2-jupiter-en", description: "Jupiter (Aura-2) - Male", gender: "male", auraVersion: 2 },
  35: { model: "aura-2-mars-en", description: "Mars (Aura-2) - Male", gender: "male", auraVersion: 2 },
  36: { model: "aura-2-neptune-en", description: "Neptune (Aura-2) - Male", gender: "male", auraVersion: 2 },
  37: { model: "aura-2-odysseus-en", description: "Odysseus (Aura-2) - Male", gender: "male", auraVersion: 2 },
  38: { model: "aura-2-orion-en", description: "Orion (Aura-2) - Deep male", gender: "male", auraVersion: 2 },
  39: { model: "aura-2-orpheus-en", description: "Orpheus (Aura-2) - Narrative male", gender: "male", auraVersion: 2 },
  40: { model: "aura-2-pluto-en", description: "Pluto (Aura-2) - Male", gender: "male", auraVersion: 2 },
  41: { model: "aura-2-saturn-en", description: "Saturn (Aura-2) - Male", gender: "male", auraVersion: 2 },
  42: { model: "aura-2-zeus-en", description: "Zeus (Aura-2) - Powerful male", gender: "male", auraVersion: 2 },

  // Aura-1 Female voices (5)
  43: { model: "aura-asteria-en", description: "Asteria (Aura-1) - Feminine", gender: "female", auraVersion: 1 },
  44: { model: "aura-luna-en", description: "Luna (Aura-1) - Feminine", gender: "female", auraVersion: 1 },
  45: { model: "aura-stella-en", description: "Stella (Aura-1) - Feminine", gender: "female", auraVersion: 1 },
  46: { model: "aura-athena-en", description: "Athena (Aura-1) - Feminine", gender: "female", auraVersion: 1 },
  47: { model: "aura-hera-en", description: "Hera (Aura-1) - Feminine", gender: "female", auraVersion: 1 },

  // Aura-1 Male voices (7)
  48: { model: "aura-orion-en", description: "Orion (Aura-1) - Deep masculine", gender: "male", auraVersion: 1 },
  49: { model: "aura-arcas-en", description: "Arcas (Aura-1) - Masculine", gender: "male", auraVersion: 1 },
  50: { model: "aura-perseus-en", description: "Perseus (Aura-1) - Masculine", gender: "male", auraVersion: 1 },
  51: { model: "aura-angus-en", description: "Angus (Aura-1) - Gruff masculine", gender: "male", auraVersion: 1 },
  52: { model: "aura-orpheus-en", description: "Orpheus (Aura-1) - Masculine", gender: "male", auraVersion: 1 },
  53: { model: "aura-helios-en", description: "Helios (Aura-1) - Masculine", gender: "male", auraVersion: 1 },
  54: { model: "aura-zeus-en", description: "Zeus (Aura-1) - Powerful masculine", gender: "male", auraVersion: 1 }
};

// Grouped voices for UI display
const VOICE_GROUPS = {
  'Aura-2 Female': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
  'Aura-2 Male': [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
  'Aura-1 Female': [43, 44, 45, 46, 47],
  'Aura-1 Male': [48, 49, 50, 51, 52, 53, 54]
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
