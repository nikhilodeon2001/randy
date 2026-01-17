const { createClient } = require('@deepgram/sdk');
const fs = require('fs');
const path = require('path');

/**
 * Complete map of all Deepgram Aura-2 voices with models and descriptions
 * Copied from Discord bot discordbot.py
 */
const VOICE_MODEL_MAP = {
  1: { model: "aura-2-thalia-en", description: "Thalia - Caffeinated gym instructor" },
  2: { model: "aura-2-andromeda-en", description: "Andromeda - Says like constantly" },
  3: { model: "aura-2-helena-en", description: "Helena - Cigarettes whiskey wisdom" },
  4: { model: "aura-2-athena-en", description: "Athena - Posh British peasant judge" },
  5: { model: "aura-2-hera-en", description: "Hera - Mom's disappointed therapist" },
  6: { model: "aura-2-luna-en", description: "Luna - Meditation app gone rogue" },
  7: { model: "aura-2-stella-en", description: "Stella - Perky morning sociopath" },
  8: { model: "aura-2-amalthea-en", description: "Amalthea - Fake customer service" },
  9: { model: "aura-2-aurora-en", description: "Aurora - ASMR influencer energy" },
  10: { model: "aura-2-callista-en", description: "Callista - Spells your name wrong" },
  11: { model: "aura-2-cordelia-en", description: "Cordelia - Rich aunt married up" },
  12: { model: "aura-2-cora-en", description: "Cora - Irish pub storyteller" },
  13: { model: "aura-2-delia-en", description: "Delia - Stoner roommate advice" },
  14: { model: "aura-2-electra-en", description: "Electra - Energy drink personified" },
  15: { model: "aura-2-harmonia-en", description: "Harmonia - Corporate speak robot" },
  16: { model: "aura-2-iris-en", description: "Iris - Theater kid on caffeine" },
  17: { model: "aura-2-juno-en", description: "Juno - Girl boss toxic vibes" },
  18: { model: "aura-2-minerva-en", description: "Minerva - Know-it-all wine aunt" },
  19: { model: "aura-2-ophelia-en", description: "Ophelia - Shakespeare shade queen" },
  20: { model: "aura-2-pandora-en", description: "Pandora - Opened box of chaos" },
  21: { model: "aura-2-phoebe-en", description: "Phoebe - Central Perk barista" },
  22: { model: "aura-2-selene-en", description: "Selene - Calm before storm" },
  23: { model: "aura-2-theia-en", description: "Theia - Blinding 6AM optimism" },
  24: { model: "aura-2-vesta-en", description: "Vesta - Eternal shushing librarian" },
  25: { model: "aura-2-apollo-en", description: "Apollo - Gym bro mansplainer" },
  26: { model: "aura-2-arcas-en", description: "Arcas - Smooth jazz radio DJ" },
  27: { model: "aura-2-aries-en", description: "Aries - Golden retriever energy" },
  28: { model: "aura-2-orion-en", description: "Orion - Alpha podcast bro" },
  29: { model: "aura-2-orpheus-en", description: "Orpheus - Pretentious narrator" },
  30: { model: "aura-2-perseus-en", description: "Perseus - Movie trailer guy" },
  31: { model: "aura-2-triton-en", description: "Triton - Surfer bro vibes" },
  32: { model: "aura-2-draco-en", description: "Draco - Posh British snob" },
  33: { model: "aura-2-zeus-en", description: "Zeus - Booming authority figure" },
  34: { model: "aura-2-helios-en", description: "Helios - Australian adventure guide" },
  35: { model: "aura-2-angus-en", description: "Angus - Gruff old fisherman" },
  36: { model: "aura-2-fenrir-en", description: "Fenrir - Viking warrior poet" },
  37: { model: "aura-2-gilgamesh-en", description: "Gilgamesh - Ancient wise elder" },
  38: { model: "aura-2-hephaestus-en", description: "Hephaestus - Grumpy blacksmith" },
  39: { model: "aura-2-kronos-en", description: "Kronos - Time lord philosopher" },
  40: { model: "aura-2-loki-en", description: "Loki - Mischievous trickster" },
  41: { model: "aura-2-odin-en", description: "Odin - All-seeing sage" },
  42: { model: "aura-2-poseidon-en", description: "Poseidon - Ocean depths narrator" },
  43: { model: "aura-2-thor-en", description: "Thor - Thunder god energy" },
  44: { model: "aura-2-lucia-es", description: "Lucía - Spanish professional" },
  45: { model: "aura-2-ramona-es", description: "Ramona - Spanish storyteller" },
  46: { model: "aura-2-valentina-es", description: "Valentina - Spanish melodic" },
  47: { model: "aura-2-miguel-es", description: "Miguel - Spanish narrator" },
  48: { model: "aura-2-santiago-es", description: "Santiago - Spanish authoritative" }
};

// Grouped voices for UI display
const VOICE_GROUPS = {
  'Female - American': [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24],
  'Female - Other': [4, 8, 12, 19], // British, Filipino, Irish, British
  'Male - American': [25, 26, 27, 28, 29, 30, 31, 33, 35, 36, 37, 38, 39, 40, 41, 42, 43],
  'Male - Other': [32, 34], // British, Australian
  'Spanish': [44, 45, 46, 47, 48]
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
