# Randy - AI Call Handler (Web App)

A web application that uses AI to automatically handle spam calls while you monitor the conversation in real-time through a browser dashboard.

## Overview

Randy is deployed on Heroku and connects to your Twilio phone number. When spam callers call your number, Randy's AI (powered by OpenAI GPT-4) answers and engages them in conversation while you watch the live transcript in your browser.

## Features

- 🤖 **AI-Powered Conversations** - GPT-4 handles calls with customizable personalities
- 📞 **Twilio Integration** - Seamless call handling via Twilio Voice API
- 📊 **Live Dashboard** - Watch conversations happen in real-time
- 💾 **Call History** - Review past calls and transcripts
- 🔄 **Real-time Updates** - WebSocket-powered live transcript streaming
- 🎭 **Multiple Personalities** - Choose from 5 AI personalities to confuse scammers

## Architecture

```
Incoming Call → Twilio → Heroku Web App → OpenAI GPT-4
                              ↓
                          MongoDB
                              ↓
                        WebSocket → Browser Dashboard
```

## Project Structure

```
webapp/
├── backend/                 # Node.js/Express server
│   ├── server.js           # Main server file
│   ├── routes/             # API routes
│   │   ├── twilio.js      # Twilio webhooks
│   │   └── calls.js       # Call management API
│   ├── services/           # Business logic
│   │   ├── callHandler.js # AI conversation handler
│   │   └── websocket.js   # Real-time updates
│   └── db/                 # Database layer
│       └── index.js        # MongoDB queries
│
├── frontend/                # React dashboard
│   ├── src/
│   │   ├── App.js          # Main app component
│   │   └── components/     # React components
│   │       ├── LiveCall.js # Live call monitor
│   │       └── CallHistory.js # Past calls
│   └── public/
│
├── Procfile                 # Heroku process file
├── package.json             # Root dependencies
└── HEROKU_DEPLOYMENT.md     # Deployment guide
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (or MongoDB Atlas)
- Twilio account with phone number
- OpenAI API key
- Heroku account (for deployment)

### Local Development

1. **Install dependencies**:
   ```bash
   cd webapp
   npm run install-all
   ```

2. **Set up environment variables**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Set up MongoDB** (if running locally):
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community

   # Or use a free MongoDB Atlas cluster and set MONGODB_URI in your .env
   ```

4. **Run development servers**:
   ```bash
   # From webapp/ directory
   npm run dev
   ```

   This starts:
   - Backend server on `http://localhost:3000`
   - Frontend dashboard on `http://localhost:3001`

5. **Expose to internet** (for Twilio webhooks):
   ```bash
   # Use ngrok to expose localhost
   ngrok http 3000
   ```

   Copy the HTTPS URL and configure it in Twilio console.

### Deploy to Heroku

Follow the detailed guide in [HEROKU_DEPLOYMENT.md](./HEROKU_DEPLOYMENT.md)

Quick version:
```bash
cd webapp
heroku create your-app-name
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set OPENAI_API_KEY=your_key
heroku config:set TWILIO_ACCOUNT_SID=your_sid
git push heroku main
```

## Configuration

### Environment Variables

**Backend** (`.env`):
```
PORT=3000
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
MONGODB_URI=mongodb+srv://...
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
- `POST /twilio/fallback` - Error fallback

### API Routes
- `GET /api/calls` - Get all call records
- `GET /api/calls/:callSid` - Get specific call
- `GET /api/calls/:callSid/transcript` - Get call transcript
- `DELETE /api/calls/:callSid` - Delete call record

### WebSocket Events
- `call:started` - New call begins
- `call:transcript` - Transcript update
- `call:ended` - Call completed

## Testing

### Test Locally

1. Start the app: `npm run dev`
2. Expose via ngrok: `ngrok http 3000`
3. Configure Twilio webhook to ngrok URL
4. Call your Twilio number
5. Watch the dashboard at `http://localhost:3001`

### Test on Heroku

1. Deploy app to Heroku
2. Configure Twilio webhook to Heroku URL
3. Call your Twilio number
4. Open Heroku app URL in browser

## Monitoring

### View Logs
```bash
# Real-time logs
heroku logs --tail

# Filter for errors
heroku logs --tail | grep ERROR
```

### Database
```bash
# Connect via mongosh using your MONGODB_URI
mongosh "$MONGODB_URI"

# View calls
db.calls.find().sort({ startTime: -1 }).limit(10)

# View transcripts
db.transcripts.find()
```

## Costs

### Heroku
- Free tier: 550-1000 dyno hours/month
- App sleeps after 30 min inactivity
- Upgrade to Hobby ($7/mo) for 24/7 uptime

### Twilio
- Phone number: ~$1/month
- Incoming calls: ~$0.0085/min
- Estimated: $0.03-0.10 per 3-5 min call

### OpenAI
- GPT-4: ~$0.10-0.30 per call
- Depends on conversation length

**Total per call: ~$0.15-0.40**

## Troubleshooting

### "Cannot connect to database"
```bash
# Verify MONGODB_URI is set
heroku config:get MONGODB_URI

# Check app logs for connection errors
heroku logs --tail | grep mongo
```

### "Twilio webhook timeout"
- Check Heroku logs for errors
- Ensure app is running: `heroku ps`
- Verify webhook URL is correct (HTTPS)

### "No transcript updates"
- Check WebSocket connection in browser console
- Ensure backend is running
- Verify CORS settings

### "OpenAI API errors"
```bash
# Check API key is set
heroku config:get OPENAI_API_KEY

# View error logs
heroku logs --tail | grep OpenAI
```

## Development Roadmap

- [x] Basic call handling
- [x] Live transcript dashboard
- [x] Call history
- [x] Multiple AI personalities
- [ ] Call recordings playback
- [ ] Authentication/user accounts
- [ ] Custom AI personality training
- [ ] Analytics dashboard
- [ ] Multi-language support

## Contributing

Pull requests welcome! Areas to improve:
- Better UI/UX for dashboard
- Additional AI personalities
- Voice cloning integration
- Mobile-responsive design
- Performance optimizations

## License

MIT

## Support

For issues:
- Check [HEROKU_DEPLOYMENT.md](./HEROKU_DEPLOYMENT.md) for deployment help
- Review Heroku logs: `heroku logs --tail`
- Check Twilio debugger: https://www.twilio.com/console/debugger

---

**Happy scam-call pranking! 🎭📞**
