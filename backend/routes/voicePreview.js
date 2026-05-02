const express = require('express');
const router = express.Router();
const ttsService = require('../services/ttsService');
const path = require('path');
const fs = require('fs');

// All Deepgram Aura English voices (53 total: 41 Aura-2 + 12 Aura-1)
// Aura-2 voices: Newer, higher quality, potentially slower
// Aura-1 voices: Older, simpler, potentially faster for low-latency needs
const ALL_VOICES = [
  // Aura-2 Female voices (26)
  { id: 1, model: "aura-2-thalia-en", description: "Thalia (Aura-2) - Default female", gender: "female", auraVersion: 2 },
  { id: 2, model: "aura-2-andromeda-en", description: "Andromeda (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 3, model: "aura-2-helena-en", description: "Helena (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 4, model: "aura-2-amalthea-en", description: "Amalthea (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 5, model: "aura-2-asteria-en", description: "Asteria (Aura-2) - Warm friendly female", gender: "female", auraVersion: 2 },
  { id: 6, model: "aura-2-athena-en", description: "Athena (Aura-2) - Clear precise female", gender: "female", auraVersion: 2 },
  { id: 7, model: "aura-2-aurora-en", description: "Aurora (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 8, model: "aura-2-callista-en", description: "Callista (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 9, model: "aura-2-cora-en", description: "Cora (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 10, model: "aura-2-cordelia-en", description: "Cordelia (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 11, model: "aura-2-delia-en", description: "Delia (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 12, model: "aura-2-electra-en", description: "Electra (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 13, model: "aura-2-harmonia-en", description: "Harmonia (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 14, model: "aura-2-hera-en", description: "Hera (Aura-2) - Professional female", gender: "female", auraVersion: 2 },
  { id: 15, model: "aura-2-iris-en", description: "Iris (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 16, model: "aura-2-janus-en", description: "Janus (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 17, model: "aura-2-juno-en", description: "Juno (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 18, model: "aura-2-luna-en", description: "Luna (Aura-2) - Expressive female", gender: "female", auraVersion: 2 },
  { id: 19, model: "aura-2-minerva-en", description: "Minerva (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 20, model: "aura-2-ophelia-en", description: "Ophelia (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 21, model: "aura-2-pandora-en", description: "Pandora (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 22, model: "aura-2-phoebe-en", description: "Phoebe (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 23, model: "aura-2-selene-en", description: "Selene (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 24, model: "aura-2-stella-en", description: "Stella (Aura-2) - Conversational female", gender: "female", auraVersion: 2 },
  { id: 25, model: "aura-2-theia-en", description: "Theia (Aura-2) - Female", gender: "female", auraVersion: 2 },
  { id: 26, model: "aura-2-vesta-en", description: "Vesta (Aura-2) - Female", gender: "female", auraVersion: 2 },

  // Aura-2 Male voices (15)
  { id: 27, model: "aura-2-apollo-en", description: "Apollo (Aura-2) - Male", gender: "male", auraVersion: 2 },
  { id: 28, model: "aura-2-arcas-en", description: "Arcas (Aura-2) - Smooth male", gender: "male", auraVersion: 2 },
  { id: 29, model: "aura-2-aries-en", description: "Aries (Aura-2) - Male", gender: "male", auraVersion: 2 },
  { id: 30, model: "aura-2-atlas-en", description: "Atlas (Aura-2) - Male", gender: "male", auraVersion: 2 },
  { id: 31, model: "aura-2-draco-en", description: "Draco (Aura-2) - Male", gender: "male", auraVersion: 2 },
  { id: 32, model: "aura-2-hermes-en", description: "Hermes (Aura-2) - Male", gender: "male", auraVersion: 2 },
  { id: 33, model: "aura-2-hyperion-en", description: "Hyperion (Aura-2) - Male", gender: "male", auraVersion: 2 },
  { id: 34, model: "aura-2-jupiter-en", description: "Jupiter (Aura-2) - Male", gender: "male", auraVersion: 2 },
  { id: 35, model: "aura-2-mars-en", description: "Mars (Aura-2) - Male", gender: "male", auraVersion: 2 },
  { id: 36, model: "aura-2-neptune-en", description: "Neptune (Aura-2) - Male", gender: "male", auraVersion: 2 },
  { id: 37, model: "aura-2-odysseus-en", description: "Odysseus (Aura-2) - Male", gender: "male", auraVersion: 2 },
  { id: 38, model: "aura-2-orion-en", description: "Orion (Aura-2) - Deep male", gender: "male", auraVersion: 2 },
  { id: 39, model: "aura-2-orpheus-en", description: "Orpheus (Aura-2) - Narrative male", gender: "male", auraVersion: 2 },
  { id: 40, model: "aura-2-pluto-en", description: "Pluto (Aura-2) - Male", gender: "male", auraVersion: 2 },
  { id: 41, model: "aura-2-saturn-en", description: "Saturn (Aura-2) - Male", gender: "male", auraVersion: 2 },
  { id: 42, model: "aura-2-zeus-en", description: "Zeus (Aura-2) - Powerful male", gender: "male", auraVersion: 2 },

  // Aura-1 Female voices (5)
  { id: 43, model: "aura-asteria-en", description: "Asteria (Aura-1) - Feminine", gender: "female", auraVersion: 1 },
  { id: 44, model: "aura-luna-en", description: "Luna (Aura-1) - Feminine", gender: "female", auraVersion: 1 },
  { id: 45, model: "aura-stella-en", description: "Stella (Aura-1) - Feminine", gender: "female", auraVersion: 1 },
  { id: 46, model: "aura-athena-en", description: "Athena (Aura-1) - Feminine", gender: "female", auraVersion: 1 },
  { id: 47, model: "aura-hera-en", description: "Hera (Aura-1) - Feminine", gender: "female", auraVersion: 1 },

  // Aura-1 Male voices (7)
  { id: 48, model: "aura-orion-en", description: "Orion (Aura-1) - Deep masculine", gender: "male", auraVersion: 1 },
  { id: 49, model: "aura-arcas-en", description: "Arcas (Aura-1) - Masculine", gender: "male", auraVersion: 1 },
  { id: 50, model: "aura-perseus-en", description: "Perseus (Aura-1) - Masculine", gender: "male", auraVersion: 1 },
  { id: 51, model: "aura-angus-en", description: "Angus (Aura-1) - Gruff masculine", gender: "male", auraVersion: 1 },
  { id: 52, model: "aura-orpheus-en", description: "Orpheus (Aura-1) - Masculine", gender: "male", auraVersion: 1 },
  { id: 53, model: "aura-helios-en", description: "Helios (Aura-1) - Masculine", gender: "male", auraVersion: 1 },
  { id: 54, model: "aura-zeus-en", description: "Zeus (Aura-1) - Powerful masculine", gender: "male", auraVersion: 1 }
];

const PREVIEW_TEXT = "Hi, this is Randy, Nikhil's AI assistant. How can I help you today?";

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
