import { Sequelize } from 'sequelize';
import config from './config.js';

// Create a new Sequelize instance with the configuration
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    define: config.define,
  }
);

// Test the database connection
const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// Export the sequelize instance and test connection
export { sequelize, testConnection };

export default {
  sequelize,
  testConnection
};
