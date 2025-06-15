const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Run the migration
    const { stdout, stderr } = await execPromise('npx sequelize-cli db:migrate');
    
    if (stdout) console.log('✅ Migration output:', stdout);
    if (stderr) console.error('⚠️ Migration warnings:', stderr);
    
    console.log('✅ Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.stderr || error.message);
    process.exit(1);
  }
}

runMigrations();
