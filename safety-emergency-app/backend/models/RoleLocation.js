import { DataTypes } from 'sequelize';
import db from '../config/database.js';

const RoleLocation = db.define('RoleLocation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the user in their respective role table (police_users, ambulance_users, etc.)'
  },
  role_type: {
    type: DataTypes.ENUM('police', 'ambulance', 'fire', 'parent'),
    allowNull: false,
    comment: 'Type of the role (which table to look in)'
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

export default RoleLocation;
