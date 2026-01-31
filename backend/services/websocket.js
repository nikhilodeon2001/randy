/**
 * WebSocket service for real-time updates to dashboard
 */

const db = require('../db');

// Store active calls in memory (callSid -> call data)
const activeCalls = new Map();

function setupWebSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Send current active call (if any) when client connects/reconnects
    socket.on('get:active-call', async () => {
      try {
        // Get the first (should be only) active call
        const activeCallEntries = [...activeCalls.values()];

        if (activeCallEntries.length > 0) {
          const activeCallData = activeCallEntries[0];

          // Fetch current transcript from database
          const transcript = await db.getTranscript(activeCallData.callSid);

          socket.emit('active-call', {
            call: activeCallData,
            transcript: transcript?.messages || []
          });

          console.log(`📞 Sent active call ${activeCallData.callSid} to client ${socket.id}`);
        } else {
          socket.emit('active-call', null);
          console.log(`📞 No active calls for client ${socket.id}`);
        }
      } catch (error) {
        console.error('Error fetching active call:', error);
        socket.emit('active-call', null);
      }
    });

    // Send current active calls list
    socket.on('get:active-calls', async () => {
      socket.emit('active-calls', [...activeCalls.values()]);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });

    // Join a specific call room for updates
    socket.on('join:call', (callSid) => {
      socket.join(`call:${callSid}`);
      console.log(`Client ${socket.id} joined call room: ${callSid}`);
    });

    // Leave a call room
    socket.on('leave:call', (callSid) => {
      socket.leave(`call:${callSid}`);
      console.log(`Client ${socket.id} left call room: ${callSid}`);
    });
  });

  return io;
}

/**
 * Register an active call
 */
function registerActiveCall(callSid, callData) {
  activeCalls.set(callSid, callData);
  console.log(`✅ Registered active call: ${callSid}`);
}

/**
 * Unregister an active call
 */
function unregisterActiveCall(callSid) {
  const removed = activeCalls.delete(callSid);
  if (removed) {
    console.log(`✅ Unregistered active call: ${callSid}`);
  }
}

/**
 * Get all active calls
 */
function getActiveCalls() {
  return [...activeCalls.values()];
}

module.exports = {
  setupWebSocket,
  registerActiveCall,
  unregisterActiveCall,
  getActiveCalls
};
