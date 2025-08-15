const fs = require('fs');
const path = require('path');
const db = require('../models');

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

class StorageService {
  static async uploadFile(file, userId, folder = '') {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Create folder if it doesn't exist
      const folderPath = path.join(UPLOAD_DIR, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const filePath = path.join(folderPath, fileName);
      const relativePath = path.join(folder, fileName);

      // Move file to uploads directory
      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath);
        
        writeStream.on('finish', resolve);
        writeStream.on('error', (error) => {
          console.error('Error writing file:', error);
          reject(error);
        });
        
        writeStream.end(file.buffer);
      });

      // Construct public URL
      const publicUrl = `/uploads/${relativePath}`;
      
      // Save file info to database
      const fileRecord = await db.File.create({
        name: file.originalname,
        url: publicUrl,
        type: file.mimetype,
        size: file.size,
        storagePath: relativePath,
        userId: userId
      });
      
      return {
        id: fileRecord.id,
        url: publicUrl,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        storagePath: relativePath,
        userId: userId,
        createdAt: fileRecord.createdAt,
        updatedAt: fileRecord.updatedAt
      };
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  }

  static async deleteFile(fileId, userId) {
    try {
      const fileRecord = await db.File.findOne({
        where: { id: fileId, userId }
      });

      if (!fileRecord) {
        throw new Error('File not found or access denied');
      }

      // Delete from file system
      const filePath = path.join(UPLOAD_DIR, fileRecord.storagePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Delete from database
      await fileRecord.destroy();
      
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  static async getFileUrl(fileId, userId) {
    try {
      const file = await db.File.findOne({
        where: { id: fileId, userId },
        attributes: ['id', 'name', 'url', 'type', 'size', 'createdAt']
      });

      if (!file) {
        throw new Error('File not found or access denied');
      }

      return file;
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }
}

module.exports = StorageService;
