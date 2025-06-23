const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUser() {
  // Create a connection to the database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);
    
    // Insert the test user
    const [result] = await connection.execute(
      'INSERT INTO users (name, password, role, phone, firebase_uid, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [
        'Test User', 
        hashedPassword, 
        'user', 
        '911234567890', 
        'test-firebase-uid-123',
        1
      ]
    );
    
    console.log('Test user created successfully with ID:', result.insertId);
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await connection.end();
  }
}

createTestUser();
