#!/bin/bash

# Randy - Set Heroku Environment Variables
# Run this AFTER deploying to Heroku

echo "Setting environment variables for randy-ai-assistant..."

# Replace these with your actual values!
heroku config:set OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE -a randy-ai-assistant
heroku config:set OPENAI_MODEL=gpt-4-turbo-preview -a randy-ai-assistant
heroku config:set OPENAI_TTS_VOICE=alloy -a randy-ai-assistant
heroku config:set OPENAI_TTS_SPEED=1.0 -a randy-ai-assistant

heroku config:set TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID -a randy-ai-assistant
heroku config:set TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN -a randy-ai-assistant
heroku config:set TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER -a randy-ai-assistant

heroku config:set NODE_ENV=production -a randy-ai-assistant
heroku config:set AI_PERSONALITY=confused_grandparent -a randy-ai-assistant

# Frontend URL (your Heroku app URL)
heroku config:set FRONTEND_URL=https://randy-ai-assistant.herokuapp.com -a randy-ai-assistant

echo ""
echo "✅ Environment variables set!"
echo ""
echo "Verify with:"
echo "heroku config -a randy-ai-assistant"
