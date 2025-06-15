const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialect = 'mysql';

const dbConfig = {
  database: process.env.DB_NAME || 'safety_emergency_db',
  username: process.env.DB_USER || 'sarin_raj',
  password: process.env.DB_PASSWORD || 'Sarinraj@2025!',
  host: process.env.DB_HOST || '139.59.40.236',
  port: process.env.DB_PORT || 3306,
  dialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  timezone: '+05:30' // IST timezone
};

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    ...dbConfig,
    dialectOptions: {
      // Add any dialect-specific options here
    },
  }
);

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

testConnection();

module.exports = {
  sequelize,
  Sequelize,
  dbConfig
};

// For ES modules compatibility
module.exports.default = sequelize;
