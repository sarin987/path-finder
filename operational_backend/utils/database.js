const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5, // Reduced connection limit
  queueLimit: 10,    // Added queue limit to prevent overwhelming
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000,
  idleTimeout: 60000  // Close idle connections after 60 seconds
});

// Test the connection and handle errors
const testConnection = async () => {
  let retries = 2; // Reduced retry attempts
  while (retries > 0) {
    try {
      const connection = await pool.getConnection();
      console.log('Database connection successful');
      connection.release();
      return true;
    } catch (error) {
      console.error(`Database connection failed (${retries} retries left):`, error.message);
      retries--;
      if (retries === 0) throw error;
      // Wait 2 seconds between retries
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  if (err.code === 'ER_HOST_IS_BLOCKED') {
    console.log('Host is blocked. The application will restart in 5 seconds...');
    setTimeout(() => process.exit(1), 5000);
  }
});

// Initialize connection
testConnection().catch(err => {
  console.error('Failed to establish database connection after all retries:', err);
  process.exit(1);
});

module.exports = pool;
