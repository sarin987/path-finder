const path = require('path');
const fs = require('fs').promises;

// Helper to get file extension from filename
function getFileExtension(filename) {
  return path.extname(filename || '').toLowerCase();
}

// Format file size to human-readable format
function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Validate MIME type against allowed types
function validateMimeType(mimeType, allowedTypes) {
  if (!mimeType) return false;
  
  // If no specific types are provided, allow all
  if (!allowedTypes || allowedTypes.length === 0) return true;
  
  // Check if the MIME type matches any of the allowed types
  return allowedTypes.some(type => {
    // Handle wildcard types like 'image/*'
    if (type.endsWith('/*')) {
      const typePrefix = type.split('/*')[0];
      return mimeType.startsWith(typePrefix);
    }
    
    // Exact match
    return mimeType === type;
  });
}

// Ensure directory exists, create if it doesn't
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

// Generate a unique filename while preserving extension
function generateUniqueFilename(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  const baseName = path.basename(originalName || 'file', ext);
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  return `${baseName.replace(/[^\w\d-]/g, '_')}_${timestamp}_${randomString}${ext}`;
}

// Get MIME type from filename extension
function getMimeTypeFromExtension(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  
  const mimeTypes = {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    
    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.rtf': 'application/rtf',
    '.json': 'application/json',
    
    // Archives
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    
    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.webm': 'audio/webm',
    '.aac': 'audio/aac',
    
    // Video
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogv': 'video/ogg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.3gp': 'video/3gpp',
    '.3g2': 'video/3gpp2',
    '.mkv': 'video/x-matroska'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// Check if a file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Delete a file if it exists
async function deleteFileIfExists(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false; // File doesn't exist
    }
    throw error; // Other error
  }
}

// Get file stats (size, mtime, etc.)
async function getFileStats(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { exists: false };
    }
    throw error;
  }
}

module.exports = {
  getFileExtension,
  formatFileSize,
  validateMimeType,
  ensureDirectoryExists,
  generateUniqueFilename,
  getMimeTypeFromExtension,
  fileExists,
  deleteFileIfExists,
  getFileStats
};
