const { admin } = require('../config/firebase-admin');
const db = require('../models');
const path = require('path');

class StorageService {
  static async uploadFile(file, userId, folder = 'uploads/') {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      const bucket = admin.storage().bucket();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${folder}${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const fileUpload = bucket.file(fileName);

      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: userId,
            originalName: file.originalname
          }
        },
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (error) => {
          console.error('Error uploading file:', error);
          reject(error);
        });

        blobStream.on('finish', async () => {
          // Make the file public
          await fileUpload.makePublic();
          
          // Get the public URL
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
          
          // Save file info to database
          const fileRecord = await db.File.create({
            name: file.originalname,
            url: publicUrl,
            type: file.mimetype,
            size: file.size,
            storagePath: fileUpload.name,
            userId: userId
          });
          
          resolve({
            id: fileRecord.id,
            url: publicUrl,
            name: file.originalname,
            type: file.mimetype,
            size: file.size
          });
        });

        blobStream.end(file.buffer);
      });
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  }

  static async deleteFile(fileId, userId) {
    try {
      // Find the file in the database
      const file = await db.File.findOne({
        where: { id: fileId, userId }
      });

      if (!file) {
        throw new Error('File not found or access denied');
      }

      // Delete from Firebase Storage
      const bucket = admin.storage().bucket();
      const fileRef = bucket.file(file.storagePath);
      
      await fileRef.delete();
      
      // Delete from database
      await file.destroy();
      
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      console.error('Error deleting file:', error);
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
