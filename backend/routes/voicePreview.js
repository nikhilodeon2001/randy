const express = require('express');
const router = express.Router();
const ttsService = require('../services/ttsService');
const path = require('path');
const fs = require('fs');

// All Deepgram Aura English voices
const ALL_VOICES = [
  // Female voices
  { id: 1, model: "aura-thalia-en", description: "Thalia - Default female", gender: "female" },
  { id: 2, model: "aura-andromeda-en", description: "Andromeda - Female", gender: "female" },
  { id: 3, model: "aura-helena-en", description: "Helena - Female", gender: "female" },
  { id: 4, model: "aura-amalthea-en", description: "Amalthea - Female", gender: "female" },
  { id: 5, model: "aura-asteria-en", description: "Asteria - Warm friendly female", gender: "female" },
  { id: 6, model: "aura-athena-en", description: "Athena - Clear precise female", gender: "female" },
  { id: 7, model: "aura-aurora-en", description: "Aurora - Female", gender: "female" },
  { id: 8, model: "aura-callista-en", description: "Callista - Female", gender: "female" },
  { id: 9, model: "aura-cora-en", description: "Cora - Female", gender: "female" },
  { id: 10, model: "aura-cordelia-en", description: "Cordelia - Female", gender: "female" },
  { id: 11, model: "aura-delia-en", description: "Delia - Female", gender: "female" },
  { id: 12, model: "aura-electra-en", description: "Electra - Female", gender: "female" },
  { id: 13, model: "aura-harmonia-en", description: "Harmonia - Female", gender: "female" },
  { id: 14, model: "aura-hera-en", description: "Hera - Professional female", gender: "female" },
  { id: 15, model: "aura-iris-en", description: "Iris - Female", gender: "female" },
  { id: 16, model: "aura-juno-en", description: "Juno - Female", gender: "female" },
  { id: 17, model: "aura-luna-en", description: "Luna - Expressive female", gender: "female" },
  { id: 18, model: "aura-minerva-en", description: "Minerva - Female", gender: "female" },
  { id: 19, model: "aura-ophelia-en", description: "Ophelia - Female", gender: "female" },
  { id: 20, model: "aura-pandora-en", description: "Pandora - Female", gender: "female" },
  { id: 21, model: "aura-phoebe-en", description: "Phoebe - Female", gender: "female" },
  { id: 22, model: "aura-selene-en", description: "Selene - Female", gender: "female" },
  { id: 23, model: "aura-stella-en", description: "Stella - Conversational female", gender: "female" },
  { id: 24, model: "aura-theia-en", description: "Theia - Female", gender: "female" },
  { id: 25, model: "aura-vesta-en", description: "Vesta - Female", gender: "female" },

  // Male voices
  { id: 26, model: "aura-apollo-en", description: "Apollo - Male", gender: "male" },
  { id: 27, model: "aura-arcas-en", description: "Arcas - Smooth male", gender: "male" },
  { id: 28, model: "aura-aries-en", description: "Aries - Male", gender: "male" },
  { id: 29, model: "aura-atlas-en", description: "Atlas - Male", gender: "male" },
  { id: 30, model: "aura-draco-en", description: "Draco - Male", gender: "male" },
  { id: 31, model: "aura-angus-en", description: "Angus - Gruff male", gender: "male" },
  { id: 32, model: "aura-helios-en", description: "Helios - Energetic male", gender: "male" },
  { id: 33, model: "aura-hermes-en", description: "Hermes - Male", gender: "male" },
  { id: 34, model: "aura-hyperion-en", description: "Hyperion - Male", gender: "male" },
  { id: 35, model: "aura-janus-en", description: "Janus - Male", gender: "male" },
  { id: 36, model: "aura-jupiter-en", description: "Jupiter - Male", gender: "male" },
  { id: 37, model: "aura-mars-en", description: "Mars - Male", gender: "male" },
  { id: 38, model: "aura-neptune-en", description: "Neptune - Male", gender: "male" },
  { id: 39, model: "aura-odysseus-en", description: "Odysseus - Male", gender: "male" },
  { id: 40, model: "aura-orion-en", description: "Orion - Deep male", gender: "male" },
  { id: 41, model: "aura-orpheus-en", description: "Orpheus - Narrative male", gender: "male" },
  { id: 42, model: "aura-perseus-en", description: "Perseus - Authoritative male", gender: "male" },
  { id: 43, model: "aura-pluto-en", description: "Pluto - Male", gender: "male" },
  { id: 44, model: "aura-saturn-en", description: "Saturn - Male", gender: "male" },
  { id: 45, model: "aura-zeus-en", description: "Zeus - Powerful male", gender: "male" }
];

const PREVIEW_TEXT = "Hi, this is Doug, Nikhil's AI assistant. How can I help you today?";

/**
 * GET /api/voice-preview/list
 * Get all available voices for preview
 */
router.get('/list', (req, res) => {
  res.json({
    voices: ALL_VOICES,
    total: ALL_VOICES.length,
    previewText: PREVIEW_TEXT
  });
});

/**
 * GET /api/voice-preview/:voiceId
 * Generate preview audio for a specific voice
 */
router.get('/:voiceId', async (req, res) => {
  try {
    const voiceId = parseInt(req.params.voiceId);
    const voice = ALL_VOICES.find(v => v.id === voiceId);

    if (!voice) {
      return res.status(404).json({ error: 'Voice not found' });
    }

    console.log(`Generating preview for ${voice.description} (${voice.model})`);

    const result = await ttsService.generateSpeech(PREVIEW_TEXT, voice.model, `preview_${voiceId}`);
    const audioUrl = `${req.protocol}://${req.get('host')}/audio/${result.filename}`;

    res.json({
      voice,
      audioUrl,
      filename: result.filename
    });

  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, ALL_VOICES };
