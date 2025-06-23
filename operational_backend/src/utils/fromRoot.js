const path = require('path');
const fs = require('fs');

/**
 * Resolves a module path relative to the project root
 * @param {string} modulePath - Path to the module relative to project root
 * @returns {*} The required module
 */
function fromRoot(modulePath) {
  // Check if modulePath is a file that exists
  const fullPath = path.resolve(__dirname, '../../', modulePath);
  
  try {
    // Check if the file exists
    const stats = fs.statSync(fullPath);
    
    // If it's a directory, try to resolve to index.js
    if (stats.isDirectory()) {
      const indexPath = path.join(fullPath, 'index.js');
      if (fs.existsSync(indexPath)) {
        return require(indexPath);
      }
      throw new Error(`Directory ${modulePath} does not contain an index.js file`);
    }
    
    // If it's a file, require it
    return require(fullPath);
  } catch (error) {
    // If the file doesn't exist, try to require it as a module
    if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ENOENT') {
      try {
        return require(modulePath);
      } catch (err) {
        console.error(`Failed to require ${modulePath}:`, err);
        throw new Error(`Module '${modulePath}' not found in project root or node_modules`);
      }
    }
    
    // Re-throw other errors
    throw error;
  }
}

// Export both as default and named export
module.exports = fromRoot;
module.exports.fromRoot = fromRoot;

// Also add helper methods for common paths
module.exports.rootPath = path.resolve(__dirname, '../../');
module.exports.srcPath = path.resolve(__dirname, '../');
module.exports.utilsPath = __dirname;
