# Deploying Randy to Heroku

Complete guide to deploy the Randy web app to Heroku.

## Prerequisites

- Heroku account
- Heroku CLI installed
- Git installed
- Twilio account with phone number
- MongoDB Atlas cluster (free tier works)
- OpenAI API key and/or Anthropic API key

## Step 1: Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku
```

Verify installation:
```bash
heroku --version
```

## Step 2: Login to Heroku

```bash
heroku login
```

## Step 3: Create Heroku App

```bash
# Create app (choose a unique name or let Heroku generate one)
heroku create randy-ai-call-handler
```

This creates your app and adds a git remote called `heroku`.

## Step 4: Set Environment Variables

```bash
# Twilio
heroku config:set TWILIO_ACCOUNT_SID=your_twilio_account_sid
heroku config:set TWILIO_AUTH_TOKEN=your_twilio_auth_token
heroku config:set TWILIO_PHONE_NUMBER=+1234567890

# OpenAI
heroku config:set OPENAI_API_KEY=your_openai_api_key
heroku config:set OPENAI_MODEL=gpt-3.5-turbo
heroku config:set OPENAI_PROFILE_MODEL=gpt-4-turbo-preview

# Anthropic
heroku config:set ANTHROPIC_API_KEY=your_anthropic_api_key
heroku config:set ANTHROPIC_MODEL=claude-haiku-4-5-20251001
heroku config:set ANTHROPIC_PROFILE_MODEL=claude-sonnet-4-6

# AI Provider — 'openai' or 'anthropic' (can also be toggled live from the dashboard)
heroku config:set AI_PROVIDER=openai

# MongoDB Atlas
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/randy?retryWrites=true&w=majority

# App settings
heroku config:set NODE_ENV=production
heroku config:set AI_PERSONALITY=confused_grandparent
heroku config:set APP_URL=https://your-app-name.herokuapp.com

# Dashboard auth
heroku config:set DASHBOARD_USERNAME=your_username
heroku config:set DASHBOARD_PASSWORD=your_password

# CORS
heroku config:set FRONTEND_URL=https://your-app-name.herokuapp.com

# Verify
heroku config
```

## Step 5: Deploy

```bash
git push heroku main
```

The build process will:
1. Install backend dependencies (`npm install` in `/backend`)
2. Build the React frontend (`npm run build` in `/frontend`)
3. Start the server (`node backend/server.js`)

## Step 6: Open Your App

```bash
heroku open
```

## Step 7: Configure Twilio Webhooks

1. **Get your Heroku app URL**:
   ```bash
   heroku info
   # Look for "Web URL", e.g., https://randy-ai-call-handler.herokuapp.com
   ```

2. **Go to Twilio Console** → Phone Numbers → Manage → Active Numbers → click your number

3. **Set Voice webhooks**:
   - **A Call Comes In**: `https://YOUR-APP.herokuapp.com/twilio/voice` (HTTP POST)
   - **Call Status Changes**: `https://YOUR-APP.herokuapp.com/twilio/status` (HTTP POST)

4. **Save** your changes

## Step 8: Test It!

1. Call your Twilio number
2. Open your Heroku app URL in a browser
3. Watch the AI conversation happen in real-time

## Switching AI Providers

The dashboard has an **AI Provider** toggle (OpenAI / Anthropic). Switching takes effect on the next incoming call. You can also set the default via the `AI_PROVIDER` config var.

| | Live calls | Profile generation |
|---|---|---|
| **OpenAI** | gpt-3.5-turbo | gpt-4-turbo-preview |
| **Anthropic** | claude-haiku-4-5-20251001 | claude-sonnet-4-6 |

## Viewing Logs

```bash
# Stream live logs
heroku logs --tail

# Filter for AI provider calls
heroku logs --tail | grep -E "openai|anthropic|GPT|Claude"
```

## Updating Your App

After making code changes:

```bash
git add .
git commit -m "Your change description"
git push heroku main
```

## Troubleshooting

### App crashes on startup
```bash
heroku logs --tail
# Common issues: missing env vars, MongoDB connection failure
```

### MongoDB connection fails
```bash
heroku config:get MONGODB_URI
heroku logs --tail | grep mongo
```

### Twilio webhooks not working
```bash
# Check logs when making a test call
heroku logs --tail

# Verify webhook URL is HTTPS and has no trailing slash
# Verify TWILIO_AUTH_TOKEN is set (required for webhook validation)
```

### AI provider errors
```bash
# Check which keys are set
heroku config | grep -E "OPENAI|ANTHROPIC|AI_PROVIDER"

# View AI-specific errors
heroku logs --tail | grep -E "openai|anthropic|error"
```

## Scaling

```bash
heroku ps          # Check current dynos
heroku ps:scale web=1  # Ensure 1 web dyno is running
```

---

**Your Randy app is now live and ready to prank scammers! 🎉**
