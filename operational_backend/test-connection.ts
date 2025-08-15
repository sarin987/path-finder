import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  database: process.env.DB_NAME || 'safety_emergency',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  dialect: 'mysql' as const,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
};

// Create a new Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define,
  }
);

// Test the connection
async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT 1+1 as result');
    console.log('✅ Test query executed successfully:', results);
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  } finally {
    // Close the connection
    await sequelize.close();
  }
}

// Run the test
(async () => {
  const success = await testConnection();
  process.exit(success ? 0 : 1);
})();
