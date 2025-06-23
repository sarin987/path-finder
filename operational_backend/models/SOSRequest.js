const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const SOSRequest = sequelize.define('SOSRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: -90,
      max: 90
    }
  },
  lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      min: -180,
      max: 180
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'resolved', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'sos_requests',  // Explicitly set the table name
  timestamps: true,            // Enable createdAt and updatedAt
  underscored: true,           // Use snake_case for column names
  createdAt: 'created_at',     // Customize the created_at column name
  updatedAt: 'updated_at'      // Customize the updated_at column name
});

module.exports = SOSRequest;
