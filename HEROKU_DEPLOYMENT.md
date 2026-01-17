# Deploying Randy to Heroku

Complete guide to deploy the Randy web app to Heroku.

## Prerequisites

- Heroku account (free tier works!)
- Heroku CLI installed
- Git installed
- Twilio account with phone number
- OpenAI API key

## Step 1: Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Or download from https://devcenter.heroku.com/articles/heroku-cli
```

Verify installation:
```bash
heroku --version
```

## Step 2: Login to Heroku

```bash
heroku login
```

This will open your browser to log in.

## Step 3: Create Heroku App

```bash
cd ~/randy

# Create app (choose a unique name or let Heroku generate one)
heroku create randy-ai-call-handler

# Or just:
heroku create
```

This creates your app and adds a git remote called `heroku`.

## Step 4: Add PostgreSQL Database

```bash
# Add Heroku Postgres (free tier)
heroku addons:create heroku-postgresql:essential-0

# Verify it was added
heroku addons
```

This automatically sets the `DATABASE_URL` environment variable.

## Step 5: Set Environment Variables

```bash
# OpenAI
heroku config:set OPENAI_API_KEY=your_openai_api_key_here
heroku config:set OPENAI_MODEL=gpt-4-turbo-preview
heroku config:set OPENAI_TTS_VOICE=alloy

# Twilio
heroku config:set TWILIO_ACCOUNT_SID=your_twilio_account_sid
heroku config:set TWILIO_AUTH_TOKEN=your_twilio_auth_token
heroku config:set TWILIO_PHONE_NUMBER=+1234567890

# App settings
heroku config:set NODE_ENV=production
heroku config:set AI_PERSONALITY=confused_grandparent

# Verify
heroku config
```

## Step 6: Initialize Git and Deploy

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Randy web app"

# Deploy to Heroku
git push heroku main
```

**Note**: If your branch is named `master`, use `git push heroku master` instead.

## Step 7: Initialize Database

```bash
# The database tables will be created automatically on first run
# But you can manually trigger it:
heroku run node backend/db/init.js
```

## Step 8: Open Your App

```bash
heroku open
```

This opens your deployed app in the browser!

## Step 9: Configure Twilio Webhooks

1. **Get your Heroku app URL**:
   ```bash
   heroku info
   # Look for "Web URL", e.g., https://randy-ai-call-handler.herokuapp.com
   ```

2. **Go to Twilio Console**: https://console.twilio.com

3. **Configure your phone number**:
   - Go to Phone Numbers → Manage → Active Numbers
   - Click on your number
   - Scroll to "Voice Configuration"

4. **Set Voice webhooks**:
   - **A Call Comes In**:
     - Webhook: `https://YOUR-APP.herokuapp.com/twilio/voice`
     - HTTP POST

   - **Call Status Changes**:
     - Webhook: `https://YOUR-APP.herokuapp.com/twilio/status`
     - HTTP POST

5. **Save** your changes

## Step 10: Test It!

1. Call your Twilio number from any phone
2. Open your Heroku app URL in a browser
3. You should see the call appear in the dashboard!
4. Watch the AI conversation happen in real-time

## Viewing Logs

```bash
# Stream live logs
heroku logs --tail

# View recent logs
heroku logs --num=100
```

## Scaling (if needed)

```bash
# Check current dynos
heroku ps

# Scale up (not needed for free tier)
heroku ps:scale web=1
```

## Updating Your App

After making code changes:

```bash
git add .
git commit -m "Your change description"
git push heroku main
```

The app will automatically rebuild and redeploy!

## Troubleshooting

### App crashes on startup

```bash
# Check logs
heroku logs --tail

# Common issues:
# - Missing environment variables
# - Database connection error
# - Port binding issue (Heroku sets PORT automatically)
```

### Database connection fails

```bash
# Verify DATABASE_URL is set
heroku config:get DATABASE_URL

# Reset database
heroku pg:reset DATABASE_URL
heroku restart
```

### Twilio webhooks not working

```bash
# Check logs when making a call
heroku logs --tail

# Verify webhook URL is correct
# Make sure it's HTTPS (not HTTP)
# Ensure no trailing slashes
```

### Environment variables not working

```bash
# List all config vars
heroku config

# Set missing ones
heroku config:set KEY=value

# Restart after setting
heroku restart
```

## Monitoring

```bash
# View app metrics
heroku open --app randy-ai-call-handler

# Click on "Metrics" tab in dashboard
```

## Cost Breakdown

**Heroku (Free Tier)**:
- ✅ Web dyno: FREE (550-1000 hrs/month)
- ✅ PostgreSQL: FREE (10,000 rows)
- ⚠️ App sleeps after 30 min inactivity (wakes on request)

**API Costs per Call** (~3-5 min):
- Twilio Voice: ~$0.01-0.02/min = $0.03-0.10
- OpenAI GPT-4: ~$0.10-0.30 (depends on conversation length)
- **Total**: ~$0.15-0.40 per call

## Keeping App Awake (Optional)

Free Heroku apps sleep after 30 min. To keep it awake:

**Option 1**: Upgrade to Hobby dyno ($7/month - never sleeps)
```bash
heroku ps:type hobby
```

**Option 2**: Use a ping service (free)
- https://uptimerobot.com
- Ping your app every 25 minutes

## Advanced: Custom Domain

```bash
# Add custom domain
heroku domains:add www.your-domain.com

# Follow instructions to update DNS
```

## Backup Database

```bash
# Create backup
heroku pg:backups:capture

# Download backup
heroku pg:backups:download
```

## Next Steps

1. ✅ Deploy to Heroku
2. ✅ Configure Twilio webhooks
3. ✅ Test with a real call
4. Add more AI personalities
5. Improve dashboard UI
6. Add authentication (if needed)
7. Set up monitoring/alerts

## Getting Help

- Heroku docs: https://devcenter.heroku.com
- Twilio docs: https://www.twilio.com/docs/voice
- Check logs: `heroku logs --tail`

---

**Your Randy app is now live and ready to prank scammers! 🎉**
