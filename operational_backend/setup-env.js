import fs from 'fs';
import readline from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default configuration
const defaultConfig = {
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_USER: 'root',
  DB_PASSWORD: '',
  DB_NAME: 'safety_emergency',
  JWT_SECRET: 'your_jwt_secret_key',
  UPLOAD_PATH: './uploads',
  MAX_FILE_SIZE: '10485760',  // 10MB
  MAX_TOTAL_SIZE: '52428800',  // 50MB
  MAX_FILES: '5',
  PORT: '5000',
  NODE_ENV: 'development',
  FRONTEND_URL: 'http://localhost:3000'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question, defaultValue = '') {
  return new Promise((resolve) => {
    const promptText = defaultValue 
      ? `${question} [${defaultValue}]: `
      : `${question}: `;
    
    rl.question(promptText, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function setupEnv() {
  console.log('🚀 Setting up your environment configuration...\n');
  
  // Check if .env file already exists
  const envPath = path.join(__dirname, '.env');
  let existingConfig = {};
  
  if (fs.existsSync(envPath)) {
    console.log('ℹ️  Found existing .env file. Current configuration:');
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log(envContent);
    
    // Parse existing config
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        existingConfig[match[1].trim()] = match[2].trim();
      }
    });
    
    const update = await prompt('\nDo you want to update the existing configuration? (y/n)', 'y');
    if (update.toLowerCase() !== 'y') {
      console.log('\n✅ Configuration update skipped.');
      rl.close();
      return;
    }
  }
  
  // Get database configuration
  console.log('\n🔧 Database Configuration');
  console.log('----------------------');
  const dbHost = await prompt('Database host', existingConfig.DB_HOST || defaultConfig.DB_HOST);
  const dbPort = await prompt('Database port', existingConfig.DB_PORT || defaultConfig.DB_PORT);
  const dbUser = await prompt('Database username', existingConfig.DB_USER || defaultConfig.DB_USER);
  const dbPassword = await prompt('Database password', existingConfig.DB_PASSWORD || defaultConfig.DB_PASSWORD);
  const dbName = await prompt('Database name', existingConfig.DB_NAME || defaultConfig.DB_NAME);
  
  // Get server configuration
  console.log('\n🖥️  Server Configuration');
  console.log('----------------------');
  const port = await prompt('Server port', existingConfig.PORT || defaultConfig.PORT);
  const nodeEnv = await prompt('Node environment (development/production)', existingConfig.NODE_ENV || defaultConfig.NODE_ENV);
  const jwtSecret = await prompt('JWT secret key', existingConfig.JWT_SECRET || defaultConfig.JWT_SECRET);
  
  // Get file upload configuration
  console.log('\n📁 File Upload Configuration');
  console.log('-------------------------');
  const uploadPath = await prompt('File upload directory', existingConfig.UPLOAD_PATH || defaultConfig.UPLOAD_PATH);
  const maxFileSize = await prompt('Maximum file size (bytes)', existingConfig.MAX_FILE_SIZE || defaultConfig.MAX_FILE_SIZE);
  const maxTotalSize = await prompt('Maximum total size for multiple uploads (bytes)', existingConfig.MAX_TOTAL_SIZE || defaultConfig.MAX_TOTAL_SIZE);
  const maxFiles = await prompt('Maximum number of files per upload', existingConfig.MAX_FILES || defaultConfig.MAX_FILES);
  
  // Get frontend URL for CORS
  console.log('\n🌐 Frontend Configuration');
  console.log('----------------------');
  const frontendUrl = await prompt('Frontend URL for CORS', existingConfig.FRONTEND_URL || defaultConfig.FRONTEND_URL);
  
  // Generate .env content
  const envContent = `# Database Configuration
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}

# Server Configuration
PORT=${port}
NODE_ENV=${nodeEnv}
JWT_SECRET=${jwtSecret}

# File Upload Configuration
UPLOAD_PATH=${uploadPath}
MAX_FILE_SIZE=${maxFileSize}
MAX_TOTAL_SIZE=${maxTotalSize}
MAX_FILES=${maxFiles}

# Frontend Configuration
FRONTEND_URL=${frontendUrl}
`;
  
  // Write .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Configuration saved to .env file:');
  console.log(envContent);
  
  // Create uploads directory if it doesn't exist
  const uploadDir = path.isAbsolute(uploadPath) ? uploadPath : path.join(__dirname, uploadPath);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`\n📁 Created uploads directory at: ${uploadDir}`);
  }
  
  rl.close();
}

// Run the setup
setupEnv()
  .then(() => {
    console.log('\n✨ Environment setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Make sure your database server is running');
    console.log('2. Run: node check-db-connection.js');
    console.log('3. Run: node setup-files-table.js');
    console.log('4. Start the server with: node server.js');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error during environment setup:', error);
    process.exit(1);
  });
