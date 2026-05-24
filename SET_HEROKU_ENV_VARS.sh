#!/bin/bash

# Randy - Set Heroku Environment Variables
# Run this AFTER deploying to Heroku
# Replace all placeholder values with your actual credentials

APP=randy-ai-assistant

echo "Setting environment variables for $APP..."

# --- Twilio ---
heroku config:set TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID -a $APP
heroku config:set TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN -a $APP
heroku config:set TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER -a $APP

# --- OpenAI ---
heroku config:set OPENAI_API_KEY=YOUR_OPENAI_API_KEY -a $APP
heroku config:set OPENAI_MODEL=gpt-3.5-turbo -a $APP
heroku config:set OPENAI_PROFILE_MODEL=gpt-4o -a $APP

# --- Anthropic ---
heroku config:set ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY -a $APP
heroku config:set ANTHROPIC_MODEL=claude-haiku-4-5-20251001 -a $APP
heroku config:set ANTHROPIC_PROFILE_MODEL=claude-sonnet-4-6 -a $APP

# --- AI Provider (can also be toggled live from the dashboard) ---
heroku config:set AI_PROVIDER=openai -a $APP

# --- MongoDB ---
heroku config:set MONGODB_URI=YOUR_MONGODB_URI -a $APP

# --- App settings ---
heroku config:set NODE_ENV=production -a $APP
heroku config:set AI_PERSONALITY=confused_grandparent -a $APP
heroku config:set APP_URL=https://$APP.herokuapp.com -a $APP

# --- Dashboard auth ---
heroku config:set DASHBOARD_USERNAME=YOUR_USERNAME -a $APP
heroku config:set DASHBOARD_PASSWORD=YOUR_PASSWORD -a $APP

# --- CORS ---
heroku config:set FRONTEND_URL=https://$APP.herokuapp.com -a $APP

echo ""
echo "✅ Environment variables set!"
echo ""
echo "Verify with:"
echo "heroku config -a $APP"
