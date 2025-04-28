const express = require('express');
const admin = require('firebase-admin');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const morgan = require('morgan');
const Message = require('./models/Message'); // Import Message model

require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = require('./config/firebaseConfig.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://corosole-core21-default-rtdb.firebaseio.com',
    storageBucket: 'gs://corosole-core21.firebasestorage.app'
  });
}

console.log('Server starting in single-process mode...');

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression
app.use(compression({
  level: 6,
  threshold: 100 * 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many authentication requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Speed limiter for auth routes
const authSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 500,
  delayMs: (used) => {
    const delayAfter = 500;
    return Math.min((used - delayAfter) * 500, 2000);
  },
});

// Body parser with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to auth routes
//app.use('/api/auth', authLimiter, authSpeedLimiter);

// Route registration
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/users');
const statusRoutes = require('./routes/status');
const healthRoutes = require('./routes/health');
const messageRoutes = require('./routes/messageRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/status', healthRoutes);  // Alias for health check
app.use('/api/messages', messageRoutes);
app.use('/api', emergencyRoutes);

// Add debug middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('[Socket.io] Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('[Socket.io] Client disconnected:', socket.id);
  });

  // Client identification
  socket.on('identify', (clientType) => {
    console.log(`Client identified as: ${clientType}`);
    socket.clientType = clientType; // 'android' or 'web'
  });

  // Emergency call handling
  socket.on('newEmergencyCall', (data) => {
    console.log('Emergency call received:', data);
    
    // Store in Firebase
    const emergencyCalls = admin.firestore().collection('emergencyCalls');
    emergencyCalls.add({
      ...data,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    });
    
    // Broadcast to all clients
    io.emit('newEmergencyCall', {
      ...data,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
  });

  // Location updates
  socket.on('locationUpdate', (data) => {
    console.log('Location update received:', data);
    
    // Store in Firebase
    const locations = admin.firestore().collection('locations');
    locations.add({
      ...data,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      clientType: socket.clientType
    });
    
    // Broadcast to all clients
    io.emit('locationUpdate', {
      ...data,
      timestamp: new Date().toISOString(),
      clientType: socket.clientType
    });
  });

  // Chat messages
  socket.on('newMessage', (data) => {
    console.log('New message:', data);
    
    // Store in Firebase
    const messages = admin.firestore().collection('messages');
    messages.add({
      ...data,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      senderType: socket.clientType
    });
    
    // Broadcast to all clients
    io.emit('newMessage', {
      ...data,
      timestamp: new Date().toISOString(),
      senderType: socket.clientType
    });
  });

  // Case status updates (only from web dashboard)
  socket.on('caseStatusUpdate', (data) => {
    if (socket.clientType === 'web') {
      console.log('Case status updated:', data);
      
      // Update in Firebase
      const caseRef = admin.firestore().collection('cases').doc(data.caseId);
      caseRef.update({
        status: data.status,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Broadcast to all clients
      io.emit('caseStatusUpdate', {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Real-time Chat Messaging
io.on('connection', (socket) => {
  // --- USER-BASED CHAT JOIN/HISTORY ---
  socket.on('join_chat', async ({ chat_type, user_id, other_user_id }) => {
    try {
      // Join a room specific to the user or user pair
      const room = other_user_id ? `chat_${chat_type}_${[user_id, other_user_id].sort().join('_')}` : `chat_${chat_type}_${user_id}`;
      socket.join(room);
      console.log(`[join_chat] User ${user_id} joined room:`, room);
      // Fetch chat history for this user or user pair
      let where = { chat_type };
      // For group chat (like police), do not filter by sender_id/receiver_id
      if (chat_type !== 'police') {
        if (user_id) where.sender_id = user_id;
        if (other_user_id) where.receiver_id = other_user_id;
      }
      const messages = await Message.findAll({ where, order: ['timestamp', 'ASC'], limit: 50 });
      socket.emit('chat_history', messages);
    } catch (err) {
      console.error('[join_chat] ERROR:', err);
      socket.emit('chat_history', []);
    }
  });

  socket.on('leave_chat', ({ chat_type, user_id, other_user_id }) => {
    const room = other_user_id ? `chat_${chat_type}_${[user_id, other_user_id].sort().join('_')}` : `chat_${chat_type}_${user_id}`;
    socket.leave(room);
    console.log(`[leave_chat] User ${user_id} left room:`, room);
  });

  socket.on('chat_message', async (msg) => {
    try {
      const dbResult = await Message.create(msg);
      const savedMsg = await Message.findById(dbResult);
      // Broadcast to the appropriate room
      const { chat_type, sender_id, receiver_id } = savedMsg;
      const room = receiver_id ? `chat_${chat_type}_${[sender_id, receiver_id].sort().join('_')}` : `chat_${chat_type}_${sender_id}`;
      console.log(`[chat_message] Emitting to room: ${room}`);
      socket.to(room).emit('chat_message', savedMsg);
      // Optionally, send to sender as well for confirmation
      socket.emit('chat_message', savedMsg);
    } catch (err) {
      console.error('[chat_message] Failed to save chat message:', err, '\nMessage:', msg);
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', pid: process.pid });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Something went wrong!'
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try another port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = admin;
