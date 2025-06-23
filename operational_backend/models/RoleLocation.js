const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const RoleLocation = sequelize.define('RoleLocation', {
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
    onDelete: 'CASCADE',
    comment: 'Reference to the user this location belongs to'
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'responder'),
    allowNull: false,
    comment: 'Role of the user at this location'
  },
  lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: -90,
      max: 90
    },
    comment: 'Latitude of the location'
  },
  lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      min: -180,
      max: 180
    },
    comment: 'Longitude of the location'
  },
  status: {
    type: DataTypes.ENUM('available', 'busy', 'offline'),
    defaultValue: 'available',
    allowNull: false
  },
  last_updated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'role_locations',  // Explicitly set the table name
  timestamps: true,             // Enable createdAt and updatedAt
  underscored: true,            // Use snake_case for column names
  createdAt: 'created_at',      // Customize the created_at column name
  updatedAt: 'updated_at',      // Customize the updated_at column name
  indexes: [
    // Unique index to ensure one location per role
    {
      unique: true,
      fields: ['role_type', 'role_id']
    },
    // Index for geospatial queries
    {
      fields: ['lat', 'lng']
    }
  ]
});

module.exports = RoleLocation;
