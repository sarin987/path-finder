import dotenv from 'dotenv';

dotenv.config();

const config = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    migrationStorageTableName: 'sequelize_meta',
    seederStorage: 'json',
    seederStorageTableName: 'sequelize_data',
    seederStoragePath: 'sequelizeData.json'
  },
  test: {
    username: process.env.TEST_DB_USER || process.env.DB_USER,
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.TEST_DB_NAME || 'test_' + (process.env.DB_NAME || 'test_db'),
    host: process.env.TEST_DB_HOST || process.env.DB_HOST,
    port: parseInt(process.env.TEST_DB_PORT || process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.PROD_DB_USER || process.env.DB_USER,
    password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.PROD_DB_NAME || process.env.DB_NAME,
    host: process.env.PROD_DB_HOST || process.env.DB_HOST,
    port: parseInt(process.env.PROD_DB_PORT || process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};

export default config;
