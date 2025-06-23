import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mysql from 'mysql2/promise';

// Configure dotenv
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
let dbConnection;

async function connectToDatabase() {
  try {
    dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'safety_emergency_db',
    });
    console.log('✅ Connected to the database');
  } catch (error) {
    console.error('❌ Error connecting to the database:', error);
    process.exit(1);
  }
}

// Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Accept only certain file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and Word documents are allowed.'));
    }
  },
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'File Upload API is running' });
});

// Upload a single file
app.post('/api/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Save file info to database
    const [result] = await dbConnection.execute(
      'INSERT INTO Files (original_name, mime_type, size, storage_path) VALUES (?, ?, ?, ?)',
      [
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.file.path,
      ]
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: result.insertId,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: `/files/${result.insertId}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get all files
app.get('/api/files', async (req, res, next) => {
  try {
    const [files] = await dbConnection.query('SELECT * FROM Files ORDER BY created_at DESC');
    res.json(files);
  } catch (error) {
    next(error);
  }
});

// Get a single file
app.get('/api/files/:id', async (req, res, next) => {
  try {
    const [files] = await dbConnection.execute('SELECT * FROM Files WHERE id = ?', [req.params.id]);
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = files[0];
    res.json(file);
  } catch (error) {
    next(error);
  }
});

// Download a file
app.get('/api/files/:id/download', async (req, res, next) => {
  try {
    const [files] = await dbConnection.execute('SELECT * FROM Files WHERE id = ?', [req.params.id]);
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = files[0];
    
    if (!fs.existsSync(file.storage_path)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    res.download(file.storage_path, file.original_name);
  } catch (error) {
    next(error);
  }
});

// Delete a file
app.delete('/api/files/:id', async (req, res, next) => {
  let connection;
  try {
    // Start a transaction
    connection = await dbConnection.getConnection();
    await connection.beginTransaction();
    
    // Get file info before deleting
    const [files] = await connection.execute('SELECT * FROM Files WHERE id = ? FOR UPDATE', [req.params.id]);
    
    if (files.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = files[0];
    
    // Delete file from disk
    if (fs.existsSync(file.storage_path)) {
      fs.unlinkSync(file.storage_path);
    }
    
    // Delete record from database
    await connection.execute('DELETE FROM Files WHERE id = ?', [req.params.id]);
    
    await connection.commit();
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'The file size exceeds the allowed limit',
    });
  }
  
  if (err.message && (err.message.includes('File type') || err.message.includes('file format'))) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: err.message,
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
async function startServer() {
  try {
    await connectToDatabase();
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📂 File uploads directory: ${process.env.UPLOAD_PATH || './uploads'}`);
      console.log(`🌐 API Documentation: http://localhost:${PORT}/api-docs`);
    });
    
    // Handle graceful shutdown
    const gracefulShutdown = async () => {
      console.log('🛑 Shutting down server...');
      
      server.close(async () => {
        console.log('👋 HTTP server closed');
        
        if (dbConnection) {
          await dbConnection.end();
          console.log('👋 Database connection closed');
        }
        
        process.exit(0);
      });
    };
    
    // Handle signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
