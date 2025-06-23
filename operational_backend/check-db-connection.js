import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabaseConnection() {
  // Database connection configuration
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'safety_emergency',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  console.log('🔍 Checking database connection...');
  console.log(`- Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`- Database: ${dbConfig.database}`);
  console.log(`- User: ${dbConfig.user}`);

  let connection;
  try {
    // First, try to connect without specifying the database
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    
    connection = await mysql.createConnection(tempConfig);
    console.log('✅ Successfully connected to the database server');

    // Check if the database exists
    const [rows] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbConfig.database]
    );

    if (rows.length === 0) {
      console.log(`Database '${dbConfig.database}' does not exist.`);
      const createDb = process.env.CREATE_DB_IF_NOT_EXISTS === 'true' || 
                      (await new Promise((resolve) => {
                        process.stdin.setEncoding('utf8');
                        console.log(`\nWould you like to create the database '${dbConfig.database}'? (y/n) `);
                        
                        const onData = (data) => {
                          const input = data.trim().toLowerCase();
                          if (input === 'y' || input === 'n') {
                            process.stdin.removeListener('data', onData);
                            resolve(input === 'y');
                          } else {
                            console.log("Please enter 'y' for yes or 'n' for no: ");
                          }
                        };
                        
                        process.stdin.on('data', onData);
                      }));
      
      if (createDb) {
        console.log(`Creating database '${dbConfig.database}'...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Database '${dbConfig.database}' created successfully`);
      } else {
        console.log('Database creation skipped. Please create the database manually.');
        process.exit(1);
      }
    } else {
      console.log(`✅ Database '${dbConfig.database}' exists`);
    }

    // Now connect to the specific database
    await connection.changeUser({ database: dbConfig.database });
    console.log(`✅ Successfully connected to database '${dbConfig.database}'`);

    // Check if the Files table exists
    const [tables] = await connection.query(
      `SHOW TABLES LIKE 'Files'`
    );

    if (tables.length === 0) {
      console.log("\nThe 'Files' table does not exist.");
      console.log('Please run the setup-files-table.js script to create it.');
    } else {
      console.log("✅ 'Files' table exists");
    }

  } catch (error) {
    console.error('❌ Error connecting to the database:');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied. Please check your database credentials.');
      console.error('- Make sure the username and password in your .env file are correct');
      console.error('- Verify that the database user has the necessary permissions');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Please check if the database server is running.');
      console.error(`- Check if MySQL is running on ${dbConfig.host}:${dbConfig.port}`);
      console.error('- Verify the host and port in your .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`Database '${dbConfig.database}' does not exist.`);
      console.error('Please create the database first or check the database name in your .env file');
    } else {
      console.error('Error details:', error.message);
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run the check
checkDatabaseConnection()
  .then(() => {
    console.log('\n✨ Database check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  });
