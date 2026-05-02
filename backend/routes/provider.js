const express = require('express');
const router = express.Router();

const VALID_PROVIDERS = ['openai', 'anthropic'];

// In-memory store — resets on server restart, defaults to env var or 'openai'
let activeProvider = process.env.AI_PROVIDER || 'openai';

function getActiveProvider() {
  return activeProvider;
}

// GET /api/provider — return current provider
router.get('/', (req, res) => {
  res.json({ provider: activeProvider });
});

// POST /api/provider — switch provider
router.post('/', (req, res) => {
  const { provider } = req.body;

  if (!VALID_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` });
  }

  activeProvider = provider;
  console.log(`🔄 AI provider switched to: ${provider}`);
  res.json({ provider: activeProvider });
});

module.exports = { router, getActiveProvider };
