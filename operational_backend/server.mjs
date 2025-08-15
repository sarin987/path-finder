// ES Module imports
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import database initialization
import models, { sequelize } from './dist/models/index.js';

// Import socket services
import { SocketService } from './dist/services/socket.service.js';
import { LocationSocketService } from './dist/services/locationSocketService.js';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Import FileService
import FileService from './dist/services/fileService.js';

// Initialize services
const fileService = new FileService();

// Attach services to app for use in routes
app.set('services', { 
  fileService
});

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, allow specific origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:19006',
      'https://your-production-domain.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
async function ensureUploadsDir() {
  const uploadsDir = path.join(__dirname, 'uploads');
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(uploadsDir, { recursive: true });
      console.log('Uploads directory created');
    } else {
      throw error;
    }
  }
}

// Function to setup routes
async function setupRoutes() {
  try {
    // Import routes from compiled JavaScript files
    const uploadRoutes = (await import('./dist/routes/fileRoutes.js')).default;
    const dashboardRoutes = (await import('./dist/routes/dashboardRoutes.js')).default;
    const locationRoutes = (await import('./dist/routes/locationRoutes.js')).default;
    const authRoutes = (await import('./dist/routes/authRoutes.js')).default;
    const usersRoutes = (await import('./dist/routes/userRoutes.js')).default;
    const incidentRoutes = (await import('./dist/routes/incidentRoutes.js')).default;
    const emergencyRoutes = (await import('./dist/routes/emergencyRoutes.js')).default;
    const roleRegisterRoutes = (await import('./dist/routes/roleRegister.js')).default;

    // Setup routes
    app.use('/api/upload', uploadRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/locations', locationRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/users', usersRoutes);
    app.use('/api/incidents', incidentRoutes);
    app.use('/api/emergencies', emergencyRoutes);
    app.use('/api/role-register', roleRegisterRoutes);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    });

  } catch (error) {
    console.error('Error setting up routes:', error);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

// Main async function to start the server
async function startServer() {
  try {
    // Initialize file uploads directory
    await ensureUploadsDir();

    // Serve static files from uploads directory
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // Initialize socket service
    const socketService = new SocketService(httpServer);
    const locationSocketService = new LocationSocketService(socketService.io);

    // Setup routes
    await setupRoutes();

    // Sync database models
    await sequelize.sync({ alter: true });
    
    // Test database connection
    await testConnection();
    
    console.log('📊 Database models synchronized successfully');
    
    // Start the server
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found'
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the application
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
