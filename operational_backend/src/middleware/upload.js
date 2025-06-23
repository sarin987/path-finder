const multer = require('multer');
const path = require('path');
const fileService = require('../services/fileService');
const { formatFileSize } = require('../utils/helpers');

// Configure multer storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  try {
    // Check if we have a valid file
    if (!file || !file.mimetype) {
      return cb(new Error('Invalid file'), false);
    }

    // Check file type
    if (!fileService.allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error(
        `File type '${file.mimetype}' is not allowed. ` +
        'Supported types: images, documents, videos, audio, and archives.'
      ), false);
    }

    // Check file size
    if (file.size > fileService.maxFileSize) {
      return cb(new Error(
        `File '${file.originalname}' (${formatFileSize(file.size)}) exceeds the maximum allowed size of ${formatFileSize(fileService.maxFileSize)}`
      ), false);
    }

    // Add file metadata to the request for later use
    if (!req.fileMetadata) {
      req.fileMetadata = [];
    }

    req.fileMetadata.push({
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      extension: path.extname(file.originalname).toLowerCase(),
      timestamp: new Date().toISOString()
    });

    // Accept file
    cb(null, true);
  } catch (error) {
    console.error('Error in file filter:', error);
    cb(error, false);
  }
};

// Configure multer with options
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: fileService.maxFileSize,
    files: fileService.maxFiles,
    fieldNameSize: 200, // Max field name size
    fieldSize: 1024 * 1024, // Max field value size (1MB)
  },
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    // Handle multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${formatFileSize(fileService.maxFileSize)}`
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: `Too many files. Maximum ${fileService.maxFiles} files allowed per upload`
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: `Unexpected field: ${err.field}`
      });
    }

    // Handle other multer errors
    return res.status(400).json({
      success: false,
      error: err.message || 'Error uploading file(s)'
    });
  }

  // No error, proceed to next middleware
  next();
};

// Middleware for single file upload
const uploadSingle = (fieldName) => {
  return [
    upload.single(fieldName),
    (req, res, next) => {
      // Add file to request object for consistency
      if (req.file) {
        req.file = {
          ...req.file,
          ...(req.fileMetadata && req.fileMetadata[0] ? req.fileMetadata[0] : {})
        };
      }
      next();
    },
    handleMulterError
  ];
};

// Middleware for multiple file uploads
const uploadMultiple = (fieldName, maxCount = fileService.maxFiles) => {
  return [
    upload.array(fieldName, maxCount),
    (req, res, next) => {
      // Combine multer files with our metadata
      if (req.files && Array.isArray(req.files) && req.fileMetadata) {
        req.files = req.files.map((file, index) => ({
          ...file,
          ...(req.fileMetadata[index] || {})
        }));
      }
      next();
    },
    handleMulterError
  ];
};

// Middleware for fields upload
const uploadFields = (fields) => {
  return [
    upload.fields(fields),
    (req, res, next) => {
      // Process fields if needed
      next();
    },
    handleMulterError
  ];
};

// Middleware to check if files were uploaded
const requireFiles = (req, res, next) => {
  if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
    return res.status(400).json({
      success: false,
      error: 'No files were uploaded'
    });
  }
  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  requireFiles,
  handleMulterError
};
