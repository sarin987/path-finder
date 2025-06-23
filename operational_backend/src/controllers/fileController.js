const fs = require('fs').promises;
const path = require('path');
const { File, Message, User } = require('../models');
const fileService = require('../services/fileService');
const { formatFileSize } = require('../utils/helpers');

/**
 * @class FileController
 * Handles file upload, download, and management operations
 */
class FileController {
  /**
   * Initialize file service
   */
  static async init() {
    try {
      await fileService.init();
      console.log('File service initialized');
    } catch (error) {
      console.error('Failed to initialize file service:', error);
      process.exit(1);
    }
  }

  /**
   * Get file information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getFileInfo(req, res, next) {
    try {
      const { fileId } = req.params;
      const userId = req.user.id;

      const file = await File.findByPk(fileId, {
        attributes: [
          'id', 
          'original_name', 
          'mime_type', 
          'size', 
          'created_at', 
          'updated_at',
          'user_id',
          'storage_path',
          'metadata'
        ]
      });
      
      if (!file) {
        return res.status(404).json({ 
          success: false,
          error: 'File not found' 
        });
      }

      // Check if user has permission to access this file
      if (file.user_id !== userId) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      res.json({
        success: true,
        data: {
          id: file.id,
          originalName: file.original_name,
          mimeType: file.mime_type,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          createdAt: file.created_at,
          updatedAt: file.updated_at,
          url: `/api/v1/files/${file.id}/download`,
          metadata: file.metadata || {}
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download a file
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async downloadFile(req, res, next) {
    try {
      const { fileId } = req.params;
      const userId = req.user.id;

      const file = await File.findByPk(fileId, {
        attributes: ['id', 'original_name', 'mime_type', 'storage_path', 'user_id']
      });
      
      if (!file) {
        return res.status(404).json({ 
          success: false,
          error: 'File not found' 
        });
      }

      // Check if user has permission to access this file
      if (file.user_id !== userId) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      try {
        const { filePath, fileName, mimeType } = await fileService.getFile(fileId, userId);
        
        // Set appropriate headers
        res.set({
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
          'Cache-Control': 'private, max-age=31536000', // 1 year cache
        });

        // Stream the file
        const fileStream = require('fs').createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
          console.error('Error streaming file:', error);
          if (!res.headersSent) {
            res.status(500).json({ 
              success: false, 
              error: 'Error streaming file' 
            });
          }
        });
      } catch (error) {
        if (error.message === 'File not found or access denied') {
          return res.status(404).json({ 
            success: false,
            error: 'File not found' 
          });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle file upload
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async uploadFile(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Save file using file service
      const file = await fileService.saveFile(req.file, userId);
      
      res.status(201).json({
        success: true,
        data: {
          id: file.id,
          originalName: file.original_name,
          mimeType: file.mime_type,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          url: `/api/v1/files/${file.id}/download`,
          createdAt: file.created_at,
          metadata: file.metadata || {}
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload file for chat
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async uploadChatFile(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      
      // Save file using file service
      const file = await fileService.saveFile(req.file, userId);
      
      // Create a message record for the file
      const message = await Message.create({
        room_id: `conversation_${conversationId}`,
        sender_id: userId,
        receiver_id: null, // Will be set by the chat service
        conversation_id: conversationId,
        message: req.file.originalname,
        message_type: this._getMessageTypeFromMime(req.file.mimetype),
        content: {
          fileId: file.id,
          fileName: file.original_name,
          fileSize: file.size,
          fileType: file.mime_type,
          url: `/api/v1/files/${file.id}/download`
        },
        is_read: false,
        status: 'sent'
      });

      // Get the message with sender info
      const messageWithSender = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'name', 'email', 'profile_picture']
          }
        ]
      });
      
      res.status(201).json({
        success: true,
        data: {
          message: messageWithSender,
          file: {
            id: file.id,
            originalName: file.original_name,
            mimeType: file.mime_type,
            size: file.size,
            sizeFormatted: formatFileSize(file.size),
            url: `/api/v1/files/${file.id}/download`,
            createdAt: file.created_at
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a file
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deleteFile(req, res, next) {
    try {
      const { fileId } = req.params;
      const userId = req.user.id;

      await fileService.deleteFile(fileId, userId);
      
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      if (error.message === 'File not found or access denied') {
        return res.status(404).json({ 
          success: false,
          error: 'File not found' 
        });
      }
      next(error);
    }
  }

  /**
   * Upload multiple files
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async uploadMultipleFiles(req, res, next) {
    try {
      const userId = req.user.id;
      const uploadedFiles = [];
      
      // Process each file
      for (const file of req.files) {
        try {
          const savedFile = await fileService.saveFile(file, userId);
          uploadedFiles.push({
            id: savedFile.id,
            originalName: savedFile.original_name,
            mimeType: savedFile.mime_type,
            size: savedFile.size,
            sizeFormatted: formatFileSize(savedFile.size),
            url: `/api/v1/files/${savedFile.id}/download`,
            createdAt: savedFile.created_at,
            metadata: savedFile.metadata || {}
          });
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          // Continue with other files even if one fails
        }
      }

      if (uploadedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Failed to process any files'
        });
      }

      res.status(201).json({
        success: true,
        data: uploadedFiles
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper to get message type from MIME type
   * @private
   */
  static _getMessageTypeFromMime(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || 
        mimeType.includes('word') || 
        mimeType.includes('excel') || 
        mimeType.includes('powerpoint') ||
        mimeType.includes('document') ||
        mimeType.includes('presentation') ||
        mimeType.includes('spreadsheet')) {
      return 'file';
    }
    return 'file';
  }
}

// Initialize file service when this module is loaded
FileController.init().catch(console.error);

module.exports = FileController;
