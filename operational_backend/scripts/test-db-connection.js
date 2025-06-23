require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testConnection() {
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'safety_emergency_db',
    process.env.DB_USER || 'sarin_raj',
    process.env.DB_PASSWORD || 'your_db_password_here',
    {
      host: process.env.DB_HOST || '139.59.40.236',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: console.log,
      dialectOptions: {
        connectTimeout: 60000
      }
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Connection has been established successfully.');
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT 1+1 as result');
    console.log('✅ Test query result:', results[0]);
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  } finally {
    await sequelize.close();
  }
}

// Run the test
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
