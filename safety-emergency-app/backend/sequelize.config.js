import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  development: {
    username: process.env.DB_USER || 'sarin_raj',
    password: process.env.DB_PASSWORD || 'Sarinraj@2025!',
    database: process.env.DB_NAME || 'safety_emergency_db',
    host: process.env.DB_HOST || '139.59.40.236',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    migrationStorageTableName: 'sequelize_meta',
    seederStorage: 'json',
    seederStorageTableName: 'sequelize_data',
    seederStoragePath: 'sequelizeData.json'
  },
  test: {
    username: process.env.TEST_DB_USER || 'sarin_raj',
    password: process.env.TEST_DB_PASSWORD || 'Sarinraj@2025!',
    database: process.env.TEST_DB_NAME || 'safety_emergency_test',
    host: process.env.TEST_DB_HOST || '139.59.40.236',
    port: process.env.TEST_DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.PROD_DB_USER || 'sarin_raj',
    password: process.env.PROD_DB_PASSWORD || 'Sarinraj@2025!',
    database: process.env.PROD_DB_NAME || 'safety_emergency_prod',
    host: process.env.PROD_DB_HOST || '139.59.40.236',
    port: process.env.PROD_DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
};

// This configuration file provides environment-specific database configurations
// and supports both direct usage and Sequelize CLI operations.
