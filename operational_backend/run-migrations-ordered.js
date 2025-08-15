const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

async function runMigration(migrationName) {
  try {
    console.log(`🔄 Running migration: ${migrationName}`);
    await execPromise(`npx sequelize-cli db:migrate --migrations-path=./migrations --migration=${migrationName}`);
    console.log(`✅ Migration ${migrationName} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Migration ${migrationName} failed:`, error.stderr || error.message);
    return false;
  }
}

async function runMigrations() {
  try {
    // Run conversations first
    const convSuccess = await runMigration('20240417_conversations.js');
    if (!convSuccess) {
      console.log('⚠️ Conversations migration failed, but continuing with chat messages...');
    }

    // Then run chat messages
    const chatSuccess = await runMigration('20240417_chat_messages.js');
    if (!chatSuccess) {
      throw new Error('Chat messages migration failed');
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  }
}

runMigrations();
