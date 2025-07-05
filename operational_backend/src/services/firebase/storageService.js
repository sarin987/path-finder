const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const bucket = admin.storage().bucket();

class FirebaseStorageService {
  /**
   * Upload a file to Firebase Storage
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalName - Original file name
   * @param {string} destination - Destination path in storage (e.g., 'chat/media')
   * @returns {Promise<{url: string, name: string, type: string, size: number}>} File metadata
   */
  static async uploadFile(fileBuffer, originalName, destination = 'chat/media') {
    try {
      // Generate a unique filename
      const fileExt = path.extname(originalName);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = `${destination}/${fileName}`;
      
      // Upload file to Firebase Storage
      const file = bucket.file(filePath);
      await file.save(fileBuffer, {
        metadata: {
          contentType: this.getContentType(fileExt),
          metadata: {
            originalName,
            uploadedAt: new Date().toISOString()
          }
        },
        public: true
      });
      
      // Make the file publicly accessible
      await file.makePublic();
      
      // Get the public URL
      const [metadata] = await file.getMetadata();
      const url = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      
      return {
        url,
        name: originalName,
        type: this.getContentType(fileExt),
        size: metadata.size
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }
  
  /**
   * Delete a file from Firebase Storage
   * @param {string} fileUrl - The URL of the file to delete
   * @returns {Promise<void>}
   */
  static async deleteFile(fileUrl) {
    try {
      const filePath = this.getFilePathFromUrl(fileUrl);
      if (!filePath) return;
      
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      
      if (exists) {
        await file.delete();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }
  
  /**
   * Get content type based on file extension
   * @private
   */
  static getContentType(extension) {
    const types = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.zip': 'application/zip',
      '.txt': 'text/plain'
    };
    
    return types[extension.toLowerCase()] || 'application/octet-stream';
  }
  
  /**
   * Extract file path from Firebase Storage URL
   * @private
   */
  static getFilePathFromUrl(url) {
    const matches = url.match(/storage\.googleapis\.com\/([^?]+)/) || [];
    return matches[1] || '';
  }
}

module.exports = FirebaseStorageService;
