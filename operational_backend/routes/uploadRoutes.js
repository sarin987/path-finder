const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only certain file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'video/mp4',
      'video/mpeg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, PDFs, and Word documents are allowed.'));
    }
  },
});

// Upload single file (temporarily removed auth middleware for testing)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the file information
    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.file.filename}`
    };

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to upload file' 
    });
  }
});

// Get file by filename
router.get('/:filename', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
      res.sendFile(filePath);
    } catch (err) {
      res.status(404).json({ 
        success: false, 
        error: 'File not found' 
      });
    }
  } catch (error) {
    console.error('Error retrieving file:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve file' 
    });
  }
});

// Delete file by filename
router.delete('/:filename', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);
    
    // Check if file exists and delete it
    try {
      await fs.unlink(filePath);
      res.json({ 
        success: true, 
        message: 'File deleted successfully' 
      });
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.status(404).json({ 
          success: false, 
          error: 'File not found' 
        });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete file' 
    });
  }
});

module.exports = router;
