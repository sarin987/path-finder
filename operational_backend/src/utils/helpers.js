/**
 * Extracts the file extension from a filename
 * @param {string} filename - The original filename
 * @returns {string} The file extension including the dot (e.g., '.jpg')
 */
const getFileExtension = (filename) => {
  return filename ? '.' + filename.split('.').pop().toLowerCase() : '';
};

/**
 * Generates a unique filename with the original extension
 * @param {string} originalName - The original filename
 * @returns {string} A unique filename with the original extension
 */
const generateUniqueFilename = (originalName) => {
  const ext = getFileExtension(originalName);
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
};

/**
 * Validates if a file's MIME type is allowed
 * @param {string} mimetype - The file's MIME type
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} True if the MIME type is allowed
 */
const isValidMimeType = (mimetype, allowedTypes) => {
  return allowedTypes.includes(mimetype);
};

/**
 * Validates if a file's size is within the allowed limit
 * @param {number} size - The file size in bytes
 * @param {number} maxSize - Maximum allowed file size in bytes
 * @returns {boolean} True if the file size is within the limit
 */
const isValidFileSize = (size, maxSize) => {
  return size <= maxSize;
};

/**
 * Sanitizes a filename to remove any potentially problematic characters
 * @param {string} filename - The original filename
 * @returns {string} Sanitized filename
 */
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
};

/**
 * Gets the appropriate directory path based on file type
 * @param {string} mimetype - The file's MIME type
 * @returns {string} The directory path for the file type
 */
const getFileTypeDirectory = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'images';
  if (mimetype.startsWith('video/')) return 'videos';
  if (mimetype.startsWith('audio/')) return 'audios';
  if (mimetype.includes('pdf') || 
      mimetype.includes('word') || 
      mimetype.includes('excel') || 
      mimetype.includes('powerpoint') ||
      mimetype.includes('document') ||
      mimetype.includes('presentation') ||
      mimetype.includes('spreadsheet')) {
    return 'documents';
  }
  return 'others';
};

/**
 * Formats file size from bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size (e.g., '2.5 MB')
 */
const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

module.exports = {
  getFileExtension,
  generateUniqueFilename,
  isValidMimeType,
  isValidFileSize,
  sanitizeFilename,
  getFileTypeDirectory,
  formatFileSize,
};
