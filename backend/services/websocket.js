/**
 * WebSocket service for real-time updates to dashboard
 */

function setupWebSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Send current active calls
    socket.on('get:active-calls', async () => {
      // Implementation would fetch from database or memory
      socket.emit('active-calls', []);
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

module.exports = { setupWebSocket };
