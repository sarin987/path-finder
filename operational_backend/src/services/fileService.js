const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { File } = require('../models');
const { getFileExtension, formatFileSize } = require('../utils/helpers');

/**
 * @class FileService
 * Handles file upload, download, and management operations
 */
class FileService {
  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');
    this.allowedMimeTypes = new Set([
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/rtf',
      'application/json',
      
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/x-gzip',
      
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/webm',
      'audio/aac',
      
      // Video
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/x-flv',
      'video/3gpp',
      'video/3gpp2',
      'video/x-matroska',
    ]);
    
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.maxTotalSize = 50 * 1024 * 1024; // 50MB for multiple files
    this.maxFiles = 5; // Max number of files per upload
  }

  async init() {
    await this.ensureUploadDirectoryExists();
  }

  async ensureUploadDirectoryExists() {
    try {
      // Create main upload directory if it doesn't exist
      await fs.mkdir(this.uploadPath, { recursive: true });

      // Create subdirectories for each file type
      for (const dir of Object.values(this.allowedMimeTypes)) {
        const dirPath = path.join(this.uploadPath, dir);
        await fs.mkdir(dirPath, { recursive: true });
      }
    } catch (error) {
      console.error('Error setting up upload directories:', error);
      throw new Error('Failed to set up file storage');
    }
  }

  /**
   * Get the directory path for a file based on its MIME type
   * @param {string} mimetype - The MIME type of the file
   * @returns {string} The directory path for the file type
   */
  getFileTypeDirectory(mimetype) {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('video/')) return 'videos';
    if (mimetype.startsWith('audio/')) return 'audios';
    if (mimetype.includes('pdf') || 
        mimetype.includes('word') || 
        mimetype.includes('excel') || 
        mimetype.includes('powerpoint') ||
        mimetype.includes('document') ||
        mimetype.includes('presentation') ||
        mimetype.includes('spreadsheet') ||
        mimetype.includes('text/')) {
      return 'documents';
    }
    if (mimetype.includes('zip') || 
        mimetype.includes('rar') || 
        mimetype.includes('7z') || 
        mimetype.includes('tar') || 
        mimetype.includes('gzip')) {
      return 'archives';
    }
    return 'others';
  }

  /**
   * Validate a file before processing
   * @param {Object} file - The file object from multer
   * @throws {Error} If file is invalid
   */
  async validateFile(file) {
    // Check if file exists
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new Error('No file uploaded or file is empty');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File size (${formatFileSize(file.size)}) exceeds the limit of ${formatFileSize(this.maxFileSize)}`);
    }

    // Check MIME type
    if (!this.allowedMimeTypes.has(file.mimetype)) {
      throw new Error(`File type '${file.mimetype}' is not allowed`);
    }
  }

  /**
   * Validate multiple files before processing
   * @param {Array} files - Array of file objects from multer
   * @throws {Error} If files are invalid
   */
  async validateFiles(files) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No files uploaded');
    }

    // Check number of files
    if (files.length > this.maxFiles) {
      throw new Error(`Maximum ${this.maxFiles} files allowed per upload`);
    }

    // Check total size
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    if (totalSize > this.maxTotalSize) {
      throw new Error(`Total upload size (${formatFileSize(totalSize)}) exceeds the limit of ${formatFileSize(this.maxTotalSize)}`);
    }

    // Validate each file
    for (const file of files) {
      await this.validateFile(file);
    }
  }

  /**
   * Save a file to the server and create a database record
   * @param {Object} file - The file object from multer
   * @param {number} userId - The ID of the user uploading the file
   * @returns {Promise<Object>} The created file record
   * @throws {Error} If file cannot be saved
   */
  async saveFile(file, userId) {
    if (!file || !file.buffer) {
      throw new Error('No file data provided');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Validate the file
    await this.validateFile(file);
    
    try {
      // Generate a unique filename
      const fileExt = getFileExtension(file.originalname);
      const fileTypeDir = this.getFileTypeDirectory(file.mimetype);
      const fileName = `${uuidv4()}${fileExt}`;
      const relativePath = path.join(fileTypeDir, fileName);
      const filePath = path.join(this.uploadPath, relativePath);

      // Ensure the target directory exists
      const dirPath = path.dirname(filePath);
      await fs.mkdir(dirPath, { recursive: true });

      // Save file to disk
      await fs.writeFile(filePath, file.buffer);

      // Create file record in database
      const fileRecord = await File.create({
        original_name: file.originalname,
        mime_type: file.mimetype,
        size: file.size,
        storage_path: relativePath,
        user_id: userId,
        metadata: {
          originalName: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          uploadedAt: new Date().toISOString(),
        },
      });

      return fileRecord;
    } catch (error) {
      console.error('Error saving file:', error);
      
      // Clean up if file was written but database operation failed
      if (filePath) {
        try {
          await fs.unlink(filePath).catch(console.error);
        } catch (cleanupError) {
          console.error('Error cleaning up file after failed save:', cleanupError);
        }
      }
      
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }

  /**
   * Save multiple files to the server and create database records
   * @param {Array} files - Array of file objects from multer
   * @param {number} userId - The ID of the user uploading the files
   * @returns {Promise<Array>} Array of created file records
   * @throws {Error} If files cannot be saved
   */
  async saveFiles(files, userId) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided');
    }

    // Validate all files first
    await this.validateFiles(files);
    
    const savedFiles = [];
    const savedFilePaths = [];
    
    try {
      // Process each file
      for (const file of files) {
        const savedFile = await this.saveFile(file, userId);
        savedFiles.push(savedFile);
        savedFilePaths.push(path.join(this.uploadPath, savedFile.storage_path));
      }
      
      return savedFiles;
    } catch (error) {
      // Clean up any files that were saved before the error
      await this.cleanupFiles(savedFilePaths);
      throw error;
    }
  }

  /**
   * Get a file by ID with access control
   * @param {number} fileId - The ID of the file to retrieve
   * @param {number} userId - The ID of the user requesting the file
   * @returns {Promise<Object>} File information including path and metadata
   * @throws {Error} If file is not found or access is denied
   */
  async getFile(fileId, userId) {
    if (!fileId) {
      throw new Error('File ID is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    try {
      const file = await File.findOne({
        where: {
          id: fileId,
          user_id: userId, // Ensure user owns the file
        },
      });

      if (!file) {
        throw new Error('File not found or access denied');
      }

      const filePath = path.join(this.uploadPath, file.storage_path);
      
      // Verify file exists on disk
      try {
        await fs.access(filePath);
      } catch (err) {
        console.error(`File not found on disk: ${filePath}`);
        throw new Error('File not found on server');
      }

      // Get file stats for additional metadata
      const stats = await fs.stat(filePath);
      
      return {
        id: file.id,
        filePath,
        fileName: file.original_name,
        mimeType: file.mime_type,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        createdAt: file.created_at,
        updatedAt: file.updated_at,
        lastModified: stats.mtime,
        metadata: file.metadata || {}
      };
    } catch (error) {
      console.error(`Error retrieving file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a file by ID with access control
   * @param {number} fileId - The ID of the file to delete
   * @param {number} userId - The ID of the user requesting deletion
   * @returns {Promise<boolean>} True if deletion was successful
   * @throws {Error} If file cannot be deleted
   */
  async deleteFile(fileId, userId) {
    if (!fileId) {
      throw new Error('File ID is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const transaction = await sequelize.transaction();
    let filePath = null;
    
    try {
      // Find the file with a lock to prevent race conditions
      const file = await File.findOne({
        where: {
          id: fileId,
          user_id: userId, // Ensure user owns the file
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!file) {
        throw new Error('File not found or access denied');
      }

      // Store the file path for later deletion
      filePath = path.join(this.uploadPath, file.storage_path);
      
      // Delete the database record first
      await file.destroy({ transaction });
      
      // Commit the transaction before file system operations
      await transaction.commit();
      
      // Delete the file from disk
      try {
        await fs.unlink(filePath);
        return true;
      } catch (err) {
        console.error(`Error deleting file from disk: ${filePath}`, err);
        // Don't fail the operation if file deletion from disk fails
        // The file will be orphaned but the database record is already deleted
        return true;
      }
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error(`Error deleting file ${fileId}:`, error);
      throw error;
    }
  }
  
  /**
   * Clean up multiple files from disk
   * @param {Array} filePaths - Array of file paths to delete
   * @private
   */
  async cleanupFiles(filePaths) {
    if (!Array.isArray(filePaths)) return;
    
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Error cleaning up file ${filePath}:`, error);
      }
    }
  }
}

module.exports = new FileService();
