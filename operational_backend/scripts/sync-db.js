import models from '../models/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

const execAsync = promisify(exec);

dotenv.config();

const syncDatabase = async () => {
  try {
    // Test the connection
    await models.db.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Sync all models
    console.log('🔄 Syncing database models...');
    await models.db.sync({ force: true }); // WARNING: This will drop all tables and recreate them
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
