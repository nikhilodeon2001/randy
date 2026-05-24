# Randy - AI Call Handler (Web App)

A web application that uses AI to automatically handle spam calls while you monitor the conversation in real-time through a browser dashboard.

## Overview

Randy is deployed on Heroku and connects to your Twilio phone number. When spam callers call your number, Randy's AI (powered by OpenAI or Anthropic) answers and engages them in conversation while you watch the live transcript in your browser.

## Features

- 🤖 **Dual AI Provider Support** - Switch between OpenAI and Anthropic from the dashboard
- 📞 **Twilio Integration** - Seamless call handling via Twilio Voice API
- 📊 **Live Dashboard** - Watch conversations happen in real-time
- 💾 **Call History** - Review past calls and transcripts
- 🔄 **Real-time Updates** - WebSocket-powered live transcript streaming
- 🎭 **Multiple Personalities** - Choose from 5 AI personalities to confuse scammers
- 🎤 **Voice Selection** - Pick from 53 Deepgram TTS voices, including randomized per-call selection
- 🔖 **Caller Profiles** - Create personalized profiles so Randy knows who's calling

## Architecture

```
Incoming Call → Twilio → Heroku Web App → OpenAI or Anthropic
                              ↓
                          MongoDB
                              ↓
                        WebSocket → Browser Dashboard
```

## AI Providers

Randy supports two AI providers, switchable live from the dashboard:

| | OpenAI | Anthropic |
|---|---|---|
| **Live calls** | gpt-3.5-turbo | claude-haiku-4-5-20251001 |
| **Profile generation** | gpt-4o | claude-sonnet-4-6 |

Both providers use a fast model for real-time call responses and a higher-quality model for generating caller profiles. The provider can be toggled anytime from the dashboard — it takes effect on the next incoming call.

## Project Structure

```
randy/
├── backend/                 # Node.js/Express server
│   ├── server.js           # Main server file
│   ├── routes/             # API routes
│   │   ├── twilio.js      # Twilio webhooks
│   │   ├── calls.js       # Call management API
│   │   ├── voice.js       # Voice model selection
│   │   ├── provider.js    # AI provider toggle
│   │   └── profiles.js    # Caller profile management
│   ├── services/           # Business logic
│   │   ├── callHandler.js # AI conversation handler (OpenAI + Anthropic)
│   │   ├── profileGenerator.js # Profile generation from URLs/text
│   │   ├── ttsService.js  # Deepgram TTS
│   │   └── websocket.js   # Real-time updates
│   └── db/                 # Database layer
│       └── index.js        # MongoDB queries
│
├── frontend/                # React dashboard
│   ├── src/
│   │   ├── App.js          # Main app component
│   │   └── components/     # React components
│   │       ├── LiveCall.js       # Live call monitor
│   │       ├── CallHistory.js    # Past calls
│   │       ├── ProviderSelector.js # OpenAI/Anthropic toggle
│   │       ├── VoiceSelector.js  # TTS voice picker
│   │       └── ProfileMaker.js   # Caller profile creator
│   └── public/
│
├── Procfile                 # Heroku process file
├── package.json             # Root dependencies
└── HEROKU_DEPLOYMENT.md     # Deployment guide
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster
- Twilio account with phone number
- OpenAI API key and/or Anthropic API key
- Heroku account (for deployment)

### Local Development

1. **Install dependencies**:
   ```bash
   npm run install-all
   ```

2. **Set up environment variables**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run development servers**:
   ```bash
   npm run dev
   ```

   This starts:
   - Backend server on `http://localhost:3000`
   - Frontend dashboard on `http://localhost:3001`

4. **Expose to internet** (for Twilio webhooks):
   ```bash
   ngrok http 3000
   ```

   Copy the HTTPS URL and configure it in the Twilio console.

### Deploy to Heroku

Follow the detailed guide in [HEROKU_DEPLOYMENT.md](./HEROKU_DEPLOYMENT.md)

Quick version:
```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set OPENAI_API_KEY=your_openai_key
heroku config:set ANTHROPIC_API_KEY=your_anthropic_key
heroku config:set TWILIO_ACCOUNT_SID=your_sid
git push heroku main
```

## Configuration

### Environment Variables

**Backend** (`backend/.env`):
```
PORT=3000

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_PROFILE_MODEL=gpt-4o

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_PROFILE_MODEL=claude-sonnet-4-6

# AI Provider ('openai' or 'anthropic') — overridden by dashboard toggle at runtime
AI_PROVIDER=openai

# MongoDB
MONGODB_URI=mongodb+srv://...

# Dashboard auth
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=your_password

# Personality
AI_PERSONALITY=confused_grandparent
```

### AI Personalities

Choose from:
- `confused_grandparent` - Elderly person confused by technology
- `tech_support` - Overly thorough tech support rep
- `interested_buyer` - Enthusiastic but indecisive buyer
- `conspiracy_theorist` - Suspicious of everything
- `busy_professional` - Always distracted and in a hurry

Set via environment variable:
```bash
heroku config:set AI_PERSONALITY=conspiracy_theorist
```

## API Endpoints

### Twilio Webhooks
- `POST /twilio/voice` - Incoming call webhook
- `POST /twilio/gather` - Speech recognition webhook
- `POST /twilio/status` - Call status updates
- `POST /twilio/recording` - Recording status callback

### Call Management
- `GET /api/calls` - Get all call records
- `GET /api/calls/:callSid` - Get specific call
- `GET /api/calls/:callSid/transcript` - Get call transcript
- `DELETE /api/calls/:callSid` - Delete call record

### AI Provider
- `GET /api/provider` - Get active AI provider
- `POST /api/provider` - Switch provider (`{ "provider": "openai" | "anthropic" }`)

### Voice
- `GET /api/voice/models` - List available TTS voices
- `POST /api/voice/change` - Change voice for active call
- `GET /api/voice/default` - Get default voice
- `POST /api/voice/default` - Set default voice

### Profiles
- `GET /api/profiles` - List caller profiles
- `POST /api/profiles` - Create caller profile from URL or text
- `DELETE /api/profiles/:phone` - Delete a profile

### WebSocket Events
- `call:started` - New call begins
- `call:transcript` - Transcript update
- `call:ended` - Call completed
- `voice:changed` - Voice changed during call

## Costs

### Heroku
- Eco dyno: ~$5/month for 24/7 uptime

### Twilio
- Phone number: ~$1/month
- Incoming calls: ~$0.0085/min
- Estimated: $0.03-0.10 per 3-5 min call

### AI (per call, ~3-5 min)
- OpenAI gpt-3.5-turbo: ~$0.01-0.05
- Anthropic claude-haiku: ~$0.01-0.03

### Deepgram TTS
- ~$0.01-0.02 per call

**Total per call: ~$0.05-0.20**

## Troubleshooting

### "Cannot connect to database"
```bash
heroku config:get MONGODB_URI
heroku logs --tail | grep mongo
```

### "Twilio webhook timeout"
```bash
heroku logs --tail
heroku ps  # check dyno is running
```

### AI provider errors
```bash
# Check which provider is active
curl -u admin:password https://your-app.herokuapp.com/api/provider

# View error logs
heroku logs --tail | grep "openai\|anthropic"
```

### "No transcript updates"
- Check WebSocket connection in browser console
- Verify CORS settings (`FRONTEND_URL` env var)

## Development Roadmap

- [x] Basic call handling
- [x] Live transcript dashboard
- [x] Call history
- [x] Multiple AI personalities
- [x] Voice selection (53 Deepgram voices)
- [x] Caller profiles for personalized greetings
- [x] OpenAI + Anthropic provider toggle
- [ ] Call recordings playback
- [ ] Authentication/user accounts
- [ ] Analytics dashboard
- [ ] Multi-language support

## License

MIT

---

**Happy scam-call pranking! 🎭📞**
