import { Sequelize } from 'sequelize';

// Create a new Sequelize instance
const sequelize = new Sequelize('safety_emergency_db', 'sarin_raj', 'Sarinraj@2025!', {
  host: '139.59.40.236',
  port: 3306,
  dialect: 'mysql',
  logging: console.log
});

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Check if the table exists
    const [results] = await sequelize.query("SHOW TABLES LIKE 'users'");
    console.log('Tables in database:', results);
    
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

testConnection();
