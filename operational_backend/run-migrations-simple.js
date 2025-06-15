const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Run the conversations migration first
    console.log('1. Creating conversations table...');
    await execPromise('npx sequelize-cli db:migrate --migrations-path=./migrations --migration=20240417_conversations.js');
    
    // Then run the chat_messages migration
    console.log('2. Creating chat_messages table...');
    await execPromise('npx sequelize-cli db:migrate --migrations-path=./migrations --migration=20240417_chat_messages.js');
    
    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.stderr || error.message);
    process.exit(1);
  }
}

runMigrations();
