require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const path = require('path');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Track connected users
const connectedUsers = new Map();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Safety Emergency API is running...');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    users: connectedUsers.size
  });
});

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/emergency', require('./src/middleware/auth').authenticateToken, require('./src/routes/emergency'));
app.use('/api/location', require('./src/middleware/auth').authenticateToken, require('./src/routes/locationRoutes'));
app.use('/api/chat', require('./src/routes/chatRoutes'));

// Initialize Socket.IO
const io = require('socket.io')(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Store user info when they authenticate
  socket.on('authenticate', ({ userId, role }) => {
    connectedUsers.set(socket.id, { userId, role });
    console.log(`User ${userId} (${role}) connected with socket ${socket.id}`);
  });

  // Handle location updates
  socket.on('location-update', async (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    // Broadcast to all clients in the same role group
    socket.broadcast.emit(`location-update-${user.role}`, {
      userId: user.userId,
      ...data
    });
  });

  // Handle emergency alerts
  socket.on('emergency-alert', (data) => {
    // Broadcast to all connected clients except the sender
    socket.broadcast.emit('new-emergency', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`User ${user.userId} (${user.role}) disconnected`);
      connectedUsers.delete(socket.id);
    } else {
      console.log('Unknown user disconnected:', socket.id);
    }
  });
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    status: 'error',
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.path
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Start the HTTP server
httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕒 Server started at: ${new Date().toISOString()}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
