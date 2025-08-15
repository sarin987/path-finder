import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'pathfinder',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: false
  }
);

async function checkSchema() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Check users table columns
    const [results] = await sequelize.query(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'pathfinder'}' 
       AND TABLE_NAME = 'users'`
    );

    console.log('\nUsers Table Schema:');
    console.table(results);

    // Check if firebase_uid exists
    const hasFirebaseUid = results.some(col => col.COLUMN_NAME === 'firebase_uid');
    console.log(`\nFirebase UID column exists: ${hasFirebaseUid ? 'YES' : 'NO'}`);

    // Check if is_active exists
    const hasIsActive = results.some(col => col.COLUMN_NAME === 'is_active');
    console.log(`is_active column exists: ${hasIsActive ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

checkSchema();
