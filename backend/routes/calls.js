const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * Get all call records
 */
router.get('/', async (req, res) => {
  try {
    const calls = await db.getAllCalls();
    res.json(calls);
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

/**
 * Get a specific call by ID
 */
router.get('/:callSid', async (req, res) => {
  try {
    const call = await db.getCallBySid(req.params.callSid);

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json(call);
  } catch (error) {
    console.error('Error fetching call:', error);
    res.status(500).json({ error: 'Failed to fetch call' });
  }
});

/**
 * Get transcript for a call
 */
router.get('/:callSid/transcript', async (req, res) => {
  try {
    const transcript = await db.getTranscript(req.params.callSid);

    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    res.json(transcript);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

/**
 * Delete a call record
 */
router.delete('/:callSid', async (req, res) => {
  try {
    await db.deleteCall(req.params.callSid);
    res.json({ message: 'Call deleted successfully' });
  } catch (error) {
    console.error('Error deleting call:', error);
    res.status(500).json({ error: 'Failed to delete call' });
  }
});

module.exports = router;
