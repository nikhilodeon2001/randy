const express = require('express');
const router = express.Router();
const ttsService = require('../services/ttsService');
const db = require('../db');

// Store active call voice settings in memory
// Map<CallSid, voiceModel>
const activeCallVoices = new Map();

// Default voice (will be loaded from DB on startup)
let defaultVoiceModel = 'aura-2-orion-en';

// Load default voice from database on startup
(async () => {
  const savedVoice = await db.getSetting('default_voice_model', 'aura-2-orion-en');
  defaultVoiceModel = savedVoice;
  console.log(`📢 Loaded default voice from database: ${defaultVoiceModel}`);
})();

/**
 * GET /api/voice/models
 * Get all available voice models
 */
router.get('/models', (req, res) => {
  const models = ttsService.getVoiceModels();
  const grouped = ttsService.getGroupedVoices();

  res.json({
    models,
    grouped,
    total: Object.keys(models).length
  });
});

/**
 * GET /api/voice/current/:callSid
 * Get current voice for a specific call
 */
router.get('/current/:callSid', (req, res) => {
  const { callSid } = req.params;
  const currentVoice = activeCallVoices.get(callSid) || defaultVoiceModel;

  // Find the voice info
  const models = ttsService.getVoiceModels();
  const voiceInfo = Object.values(models).find(v => v.model === currentVoice);

  // Find the voice ID
  const voiceId = Object.keys(models).find(key => models[key].model === currentVoice) || 40;

  res.json({
    callSid,
    voiceId: parseInt(voiceId),
    currentVoice,
    description: voiceInfo?.description || 'Default voice'
  });
});

/**
 * POST /api/voice/change
 * Change voice for an active call
 * randomPerCall: if true and voice is random, resolve once per call; if false, resolve per TTS generation
 */
router.post('/change', async (req, res) => {
  const { callSid, voiceId, randomPerCall = true } = req.body;

  if (!callSid || !voiceId) {
    return res.status(400).json({
      error: 'Missing required fields: callSid, voiceId'
    });
  }

  // Get voice model by ID
  const voiceInfo = ttsService.getVoiceById(parseInt(voiceId));

  if (!voiceInfo) {
    return res.status(400).json({
      error: 'Invalid voice ID'
    });
  }

  // Determine what voice to store
  let storedVoiceModel;
  let displayDescription = voiceInfo.description;

  if (voiceInfo.isRandom && randomPerCall) {
    // Random per call: resolve once now and store the resolved voice
    storedVoiceModel = ttsService.selectRandomVoice(voiceInfo.model);
    const allVoices = ttsService.getVoiceModels();
    const actualVoice = Object.values(allVoices).find(v => v.model === storedVoiceModel);
    if (actualVoice) {
      displayDescription = `${voiceInfo.description} → ${actualVoice.description}`;
    }
    console.log(`🎲 Random voice resolved for call ${callSid}: ${storedVoiceModel} (locked for call)`);
  } else if (voiceInfo.isRandom && !randomPerCall) {
    // Random per generation: store the random- model so it gets resolved each time
    storedVoiceModel = voiceInfo.model;
    displayDescription = `${voiceInfo.description} (new each response)`;
    console.log(`🎲 Random voice set for call ${callSid}: will change each response`);
  } else {
    // Regular voice
    storedVoiceModel = voiceInfo.model;
  }

  // Update active call voice
  activeCallVoices.set(callSid, storedVoiceModel);
  console.log(`🔄 Voice changed for call ${callSid} to: ${storedVoiceModel} (${displayDescription})`);

  // Emit voice change event via WebSocket
  const io = req.app.get('io');
  if (io) {
    io.emit('voice:changed', {
      callSid,
      voiceModel: storedVoiceModel,
      description: displayDescription
    });
  }

  // Update database
  try {
    const db = require('../db');
    await db.pool.query(
      'UPDATE calls SET current_voice_model = $1 WHERE call_sid = $2',
      [storedVoiceModel, callSid]
    );
  } catch (error) {
    console.error('Error updating voice in database:', error);
  }

  res.json({
    success: true,
    callSid,
    voiceModel: storedVoiceModel,
    description: displayDescription,
    isRandom: voiceInfo.isRandom,
    randomPerCall
  });
});

/**
 * GET /api/voice/active
 * Get all active call voices
 */
router.get('/active', (req, res) => {
  const activeCalls = Array.from(activeCallVoices.entries()).map(([callSid, voiceModel]) => {
    const models = ttsService.getVoiceModels();
    const voiceInfo = Object.values(models).find(v => v.model === voiceModel);

    return {
      callSid,
      voiceModel,
      description: voiceInfo?.description || 'Unknown'
    };
  });

  res.json({
    activeCalls,
    count: activeCalls.length
  });
});

/**
 * POST /api/voice/default
 * Set default voice for all future calls
 */
router.post('/default', async (req, res) => {
  const { voiceId } = req.body;

  if (!voiceId) {
    return res.status(400).json({
      error: 'Missing required field: voiceId'
    });
  }

  // Get voice model by ID
  const voiceInfo = ttsService.getVoiceById(parseInt(voiceId));

  if (!voiceInfo) {
    return res.status(400).json({
      error: 'Invalid voice ID'
    });
  }

  // Store the voice model (keep random- prefix if it's a random voice)
  // This allows random selection to happen per-call or per-generation depending on settings
  defaultVoiceModel = voiceInfo.model;

  // Persist to database
  await db.setSetting('default_voice_model', voiceInfo.model);
  console.log(`💾 Saved default voice to database: ${voiceInfo.model}`);

  res.json({
    success: true,
    voiceModel: voiceInfo.model,
    description: voiceInfo.description,
    isRandom: voiceInfo.isRandom || false
  });
});

/**
 * GET /api/voice/default
 * Get current default voice
 */
router.get('/default', (req, res) => {
  const models = ttsService.getVoiceModels();
  const voiceInfo = Object.values(models).find(v => v.model === defaultVoiceModel);

  res.json({
    voiceModel: defaultVoiceModel,
    description: voiceInfo?.description || 'Default voice'
  });
});

/**
 * DELETE /api/voice/:callSid
 * Remove voice settings for ended call
 */
router.delete('/:callSid', (req, res) => {
  const { callSid } = req.params;
  const deleted = activeCallVoices.delete(callSid);

  res.json({
    success: deleted,
    callSid
  });
});

/**
 * Helper function to get voice for a call (used by CallHandler)
 */
function getVoiceForCall(callSid) {
  return activeCallVoices.get(callSid) || defaultVoiceModel; // Use default voice if not set
}

/**
 * Helper function to set voice for a call
 */
function setVoiceForCall(callSid, voiceModel) {
  activeCallVoices.set(callSid, voiceModel || defaultVoiceModel);
}

/**
 * Helper function to get default voice
 */
function getDefaultVoice() {
  return defaultVoiceModel;
}

module.exports = {
  router,
  getVoiceForCall,
  setVoiceForCall,
  getDefaultVoice,
  activeCallVoices
};
