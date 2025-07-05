const fs = require('fs');
const path = require('path');

// Files to update with their respective replacements
const filesToUpdate = [
  {
    path: 'src/screens/HomeScreen.js',
    search: 'http://192.168.1.18:5000',
    replace: '${BASE_URL}${API_VERSION}'
  },
  {
    path: 'src/screens/OtpVerificationScreen.js',
    search: 'http://192.168.1.18:5000',
    replace: '${BASE_URL}${API_VERSION}'
  },
  // Add more files here as needed
];

// Update files
filesToUpdate.forEach(({ path: filePath, search, replace }) => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    const updatedContent = content.replace(new RegExp(search, 'g'), replace);
    
    if (content !== updatedContent) {
      fs.writeFileSync(fullPath, updatedContent, 'utf8');
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`No changes needed for ${filePath}`);
    }
  } else {
    console.warn(`File not found: ${filePath}`);
  }
});

console.log('API URL update complete!');
