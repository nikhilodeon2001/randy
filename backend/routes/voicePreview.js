const express = require('express');
const router = express.Router();
const ttsService = require('../services/ttsService');
const path = require('path');
const fs = require('fs');

// All Deepgram Aura-2 English voices (41 total)
// Updated with correct Aura-2 format and verified genders
const ALL_VOICES = [
  // Female voices (26)
  { id: 1, model: "aura-2-thalia-en", description: "Thalia - Default female", gender: "female" },
  { id: 2, model: "aura-2-andromeda-en", description: "Andromeda - Female", gender: "female" },
  { id: 3, model: "aura-2-helena-en", description: "Helena - Female", gender: "female" },
  { id: 4, model: "aura-2-amalthea-en", description: "Amalthea - Female", gender: "female" },
  { id: 5, model: "aura-2-asteria-en", description: "Asteria - Warm friendly female", gender: "female" },
  { id: 6, model: "aura-2-athena-en", description: "Athena - Clear precise female", gender: "female" },
  { id: 7, model: "aura-2-aurora-en", description: "Aurora - Female", gender: "female" },
  { id: 8, model: "aura-2-callista-en", description: "Callista - Female", gender: "female" },
  { id: 9, model: "aura-2-cora-en", description: "Cora - Female", gender: "female" },
  { id: 10, model: "aura-2-cordelia-en", description: "Cordelia - Female", gender: "female" },
  { id: 11, model: "aura-2-delia-en", description: "Delia - Female", gender: "female" },
  { id: 12, model: "aura-2-electra-en", description: "Electra - Female", gender: "female" },
  { id: 13, model: "aura-2-harmonia-en", description: "Harmonia - Female", gender: "female" },
  { id: 14, model: "aura-2-hera-en", description: "Hera - Professional female", gender: "female" },
  { id: 15, model: "aura-2-iris-en", description: "Iris - Female", gender: "female" },
  { id: 16, model: "aura-2-janus-en", description: "Janus - Female", gender: "female" },
  { id: 17, model: "aura-2-juno-en", description: "Juno - Female", gender: "female" },
  { id: 18, model: "aura-2-luna-en", description: "Luna - Expressive female", gender: "female" },
  { id: 19, model: "aura-2-minerva-en", description: "Minerva - Female", gender: "female" },
  { id: 20, model: "aura-2-ophelia-en", description: "Ophelia - Female", gender: "female" },
  { id: 21, model: "aura-2-pandora-en", description: "Pandora - Female", gender: "female" },
  { id: 22, model: "aura-2-phoebe-en", description: "Phoebe - Female", gender: "female" },
  { id: 23, model: "aura-2-selene-en", description: "Selene - Female", gender: "female" },
  { id: 24, model: "aura-2-stella-en", description: "Stella - Conversational female", gender: "female" },
  { id: 25, model: "aura-2-theia-en", description: "Theia - Female", gender: "female" },
  { id: 26, model: "aura-2-vesta-en", description: "Vesta - Female", gender: "female" },

  // Male voices (15)
  { id: 27, model: "aura-2-apollo-en", description: "Apollo - Male", gender: "male" },
  { id: 28, model: "aura-2-arcas-en", description: "Arcas - Smooth male", gender: "male" },
  { id: 29, model: "aura-2-aries-en", description: "Aries - Male", gender: "male" },
  { id: 30, model: "aura-2-atlas-en", description: "Atlas - Male", gender: "male" },
  { id: 31, model: "aura-2-draco-en", description: "Draco - Male", gender: "male" },
  { id: 32, model: "aura-2-hermes-en", description: "Hermes - Male", gender: "male" },
  { id: 33, model: "aura-2-hyperion-en", description: "Hyperion - Male", gender: "male" },
  { id: 34, model: "aura-2-jupiter-en", description: "Jupiter - Male", gender: "male" },
  { id: 35, model: "aura-2-mars-en", description: "Mars - Male", gender: "male" },
  { id: 36, model: "aura-2-neptune-en", description: "Neptune - Male", gender: "male" },
  { id: 37, model: "aura-2-odysseus-en", description: "Odysseus - Male", gender: "male" },
  { id: 38, model: "aura-2-orion-en", description: "Orion - Deep male", gender: "male" },
  { id: 39, model: "aura-2-orpheus-en", description: "Orpheus - Narrative male", gender: "male" },
  { id: 40, model: "aura-2-pluto-en", description: "Pluto - Male", gender: "male" },
  { id: 41, model: "aura-2-saturn-en", description: "Saturn - Male", gender: "male" },
  { id: 42, model: "aura-2-zeus-en", description: "Zeus - Powerful male", gender: "male" }
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
