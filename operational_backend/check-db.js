const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'safety_emergency_db',
  process.env.DB_USER || 'sarin_raj',
  process.env.DB_PASSWORD || 'Sarinraj@2025!',
  {
    host: process.env.DB_HOST || '139.59.40.236',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log
  }
);

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // List all tables
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('\n📊 Existing tables:');
    console.table(tables);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

checkDatabase();
