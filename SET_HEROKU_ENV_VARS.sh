#!/bin/bash

# Randy - Set Heroku Environment Variables
# Run this AFTER deploying to Heroku

echo "Setting environment variables for randy-scam-bait..."

# Replace these with your actual values!
heroku config:set OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE -a randy-scam-bait
heroku config:set OPENAI_MODEL=gpt-4-turbo-preview -a randy-scam-bait
heroku config:set OPENAI_TTS_VOICE=alloy -a randy-scam-bait
heroku config:set OPENAI_TTS_SPEED=1.0 -a randy-scam-bait

heroku config:set TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID -a randy-scam-bait
heroku config:set TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN -a randy-scam-bait
heroku config:set TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER -a randy-scam-bait

heroku config:set NODE_ENV=production -a randy-scam-bait
heroku config:set AI_PERSONALITY=confused_grandparent -a randy-scam-bait

# Frontend URL (your Heroku app URL)
heroku config:set FRONTEND_URL=https://randy-scam-bait.herokuapp.com -a randy-scam-bait

echo ""
echo "✅ Environment variables set!"
echo ""
echo "Verify with:"
echo "heroku config -a randy-scam-bait"
