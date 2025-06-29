require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const path = require('path');
const fs = require('fs').promises;

// Initialize Firebase Admin (optional)
const firebase = require('./config/firebase-admin');
const admin = firebase.admin;

// Import database initialization
const { init, sequelize } = require('./models');

// Import routes
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const locationRoutes = require('./src/routes/locationRoutes');
const authRoutes = require('./routes/auth'); // <-- FIXED: use correct auth route
const chatRoutes = require('./src/routes/chat.routes');
const usersRoutes = require('./routes/users');
const emergencyRoutes = require('./routes/emergency');
const requestsRoutes = require('./routes/requests');

// Import socket services
const LocationSocketService = require('./src/services/locationSocketService');
const SocketService = require('./src/services/socket.service');
const registerChatHandlers = require('./socket');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Track connected users
const connectedUsers = new Map();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:2222', // Frontend on port 2222
    'http://localhost:8080', // Dashboard
    'http://localhost:3000', // Original frontend port
    'http://192.168.14.111:5000', // Backend (should not be here for frontend)
    'http://192.168.14.111:3000', // <-- Add your frontend LAN URL
    'http://localhost:8082', // <-- Added for Expo web frontend
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [])
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests and headers for debugging
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  next();
});

// Socket.IO will be initialized by the SocketService

// Ensure uploads directory exists
async function ensureUploadsDir() {
  const uploadsDir = path.join(__dirname, 'uploads');
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(uploadsDir, { recursive: true });
      console.log('📁 Created uploads directory');
    } else {
      throw error;
    }
  }
}

// Initialize file uploads directory
ensureUploadsDir().catch(console.error);

// API Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/auth', authRoutes); // <-- FIXED: use correct auth route
app.use('/api/chat', require('./routes/chat'));
app.use('/api/users', usersRoutes);
app.use('/api/incidents', require('./routes/incidents').default || require('./routes/incidents'));
app.use('/api/emergencies', require('./routes/emergency'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/role', require('./routes/roleDashboards')); // <-- New role-based dashboard routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Handle all OPTIONS preflight requests for CORS
app.options('*', cors(corsOptions));

// Initialize socket.io services
const socketService = new SocketService(httpServer);
const io = socketService.getIO();

// Register chat socket handlers
registerChatHandlers(io);

// Initialize location socket service with the same io instance
const locationSocketService = new LocationSocketService(io);

// Location socket service will handle its own connection events
// Chat socket events are handled in SocketService

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
}

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    console.log('🔄 Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Failed to connect to the database');
    }
    
    // Initialize database and models
    console.log('🔄 Initializing database...');
    await init();
    
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || '0.0.0.0';
    httpServer.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on port ${PORT} (host: ${HOST})`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔄 CORS allowed origins: ${corsOptions.origin}`);
      console.log('📊 Database models initialized successfully');
    });
    
    // Handle server errors
    httpServer.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = { app, httpServer, io };
