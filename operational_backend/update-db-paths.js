const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');

// Get all JavaScript files in the models directory
const modelFiles = fs.readdirSync(modelsDir)
  .filter(file => file.endsWith('.js') && file !== 'index.js' && !file.startsWith('old/'));

console.log('Updating database import paths in model files:');

modelFiles.forEach(file => {
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file contains the old database path
  if (content.includes("require('../config/database')")) {
    // Replace the old path with the new one
    const updatedContent = content.replace(
      /require\('..\/config\/database'\)/g,
      "require('../src/config/database')"
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`✅ Updated: ${file}`);
  } else {
    console.log(`ℹ️  No update needed: ${file}`);
  }
});

console.log('\nUpdate complete.');
