const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class RoleLocation extends Model {}

RoleLocation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role_type: {
      type: DataTypes.ENUM('police', 'ambulance', 'fire', 'parent'),
      allowNull: false,
    },
    lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('available', 'busy', 'offline'),
      defaultValue: 'available',
      allowNull: false,
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'RoleLocation',
    tableName: 'role_locations',
    timestamps: true,
    underscored: true,
  }
);

module.exports = RoleLocation;
