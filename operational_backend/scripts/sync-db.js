const { init, sequelize } = require('../models');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

const syncDatabase = async () => {
  try {
    // Initialize database and models
    console.log('🔄 Initializing database models...');
    await init();
    
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Sync all models
    console.log('🔄 Syncing database models...');
    await sequelize.sync({ force: true }); // WARNING: This will drop all tables and recreate them
    console.log('✅ Database synchronized successfully.');
    
    // Run seeders
    console.log('🌱 Running seeders...');
    try {
      const { stdout, stderr } = await execAsync('npm run seed');
      if (stderr) console.error('Seeder stderr:', stderr);
      console.log('✅ Seeders executed successfully');
    } catch (seedError) {
      console.error('❌ Error running seeders:', seedError);
      throw seedError;
    }
    
    console.log('✨ Database setup completed successfully!');
    console.log('\nYou can now start the server with:');
    console.log('  npm run dev');
    console.log('\nTest accounts have been created with email: <role>@example.com and password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Unable to sync database:', error);
    process.exit(1);
  }
};

// Run the sync
syncDatabase();
