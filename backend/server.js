require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const path = require('path');
const basicAuth = require('express-basic-auth');

// Import routes
const twilioRoutes = require('./routes/twilio');
const callsRoutes = require('./routes/calls');
const { router: voiceRoutes } = require('./routes/voice');
const { router: voicePreviewRoutes } = require('./routes/voicePreview');
const { setupWebSocket } = require('./services/websocket');
const db = require('./db');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic Authentication middleware for dashboard
// Exclude Twilio webhooks and health check from auth
const dashboardAuth = basicAuth({
  users: {
    [process.env.DASHBOARD_USERNAME || 'admin']: process.env.DASHBOARD_PASSWORD || 'password'
  },
  challenge: true, // Sends WWW-Authenticate header to prompt browser login
  realm: 'Doug Dashboard',
  unauthorizedResponse: (req) => {
    return 'Unauthorized: Authentication required to access the dashboard.';
  }
});

// Apply auth to all routes except Twilio webhooks and health check
app.use((req, res, next) => {
  // Skip auth for Twilio webhooks and health check
  if (req.path.startsWith('/twilio/') || req.path === '/health') {
    return next();
  }
  // Apply auth to everything else (dashboard, API, audio files)
  return dashboardAuth(req, res, next);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// API Routes
app.use('/twilio', twilioRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/voice-preview', voicePreviewRoutes);

// Serve audio files (Deepgram-generated TTS)
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../frontend/build')));

// All other routes serve React app (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Setup WebSocket handlers
setupWebSocket(io);

// Make io available to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize database tables
    await db.initDb();
    console.log('✅ Database initialized');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Doug server running on port ${PORT}`);
      console.log(`📱 Twilio webhook endpoint: /twilio/voice`);
      console.log(`🌐 Dashboard available at root URL`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, io };
