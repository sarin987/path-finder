import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupFilesTable() {
  // Database connection configuration
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'safety_emergency',
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  console.log('🔍 Database Configuration:');
  console.log(`- Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`- Database: ${dbConfig.database}`);
  console.log(`- User: ${dbConfig.user}`);
  
  if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
    console.error('❌ Error: Missing required database configuration. Please check your .env file.');
    console.log('\nPlease make sure your .env file contains the following variables:');
    console.log('DB_HOST=your_database_host');
    console.log('DB_PORT=3306');
    console.log('DB_USER=your_database_user');
    console.log('DB_PASSWORD=your_database_password');
    console.log('DB_NAME=your_database_name\n');
    process.exit(1);
  }

  let connection;
  
  try {
    // Create a connection to the database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to the database');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'sql', 'create_files_table.sql');
    const sql = await fs.readFile(sqlFilePath, 'utf8');
    
    // Split SQL into individual statements and execute them one by one
    const statements = sql.split(';').filter(statement => statement.trim() !== '');
    
    console.log('🚀 Setting up Files table...');
    
    for (const statement of statements) {
      if (statement.trim() === '') continue;
      try {
        const [results] = await connection.query(statement + ';');
        console.log('Executed SQL statement successfully');
        if (Array.isArray(results) && results.length > 0) {
          console.log('Query results:', JSON.stringify(results, null, 2));
        }
      } catch (error) {
        console.warn('⚠️ Warning executing statement:', error.message);
        // Continue with next statement for non-fatal errors
      }
    }
    
    console.log('✅ Files table setup completed successfully');
    
  } catch (error) {
    console.error('❌ Error setting up Files table:');
    
    // Provide more detailed error information
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied for database. Please check your database credentials.');
      console.error('- Make sure the username and password in your .env file are correct');
      console.error('- Verify that the database user has the necessary permissions');
      console.error('- Check if the database server is running and accessible');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`Database '${dbConfig.database}' does not exist.`);
      console.error('Please create the database first or check the database name in your .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection to the database server was refused.');
      console.error(`- Check if the database server is running on ${dbConfig.host}:${dbConfig.port}`);
      console.error('- Verify the host and port in your .env file');
    } else if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
      console.error('SQL State:', error.sqlState);
      console.error('Error Code:', error.errno);
      console.error('SQL Query:', error.sql);
    } else {
      console.error(error);
    }
    
    process.exit(1);
  } finally {
    // Close the database connection
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Run the setup
setupFilesTable()
  .then(() => {
    console.log('✨ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
