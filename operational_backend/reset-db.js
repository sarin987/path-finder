import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Database configuration without database name
const dbConfig = {
  username: process.env.DB_USER || 'sarin_raj',
  password: process.env.DB_PASS || 'Sarinraj@2025!',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: console.log,
};

// Initialize Sequelize without database name
const sequelize = new Sequelize({
  ...dbConfig,
  database: null, // No database selected
});

// Database name
const DB_NAME = process.env.DB_NAME || 'safety_emergency_db';

async function resetDatabase() {
  try {
    // Connect to MySQL without selecting a database
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL server');
    
    // Drop the database if it exists
    console.log(`🔄 Dropping database '${DB_NAME}'...`);
    await sequelize.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    
    // Create a new database
    console.log(`🔄 Creating database '${DB_NAME}'...`);
    await sequelize.query(`CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    console.log(`✅ Database '${DB_NAME}' has been reset successfully`);
    
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close the connection
    await sequelize.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the reset
resetDatabase();
