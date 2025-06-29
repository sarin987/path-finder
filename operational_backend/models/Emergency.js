const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Emergency = sequelize.define('Emergency', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('medical', 'fire', 'police', 'other'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'in-progress', 'resolved', 'cancelled'),
    defaultValue: 'pending'
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['type'] },
    { fields: ['latitude'] },
    { fields: ['longitude'] }
  ]
});

module.exports = Emergency;
