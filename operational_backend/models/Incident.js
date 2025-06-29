const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Incident = sequelize.define('Incident', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING(50), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  photo_url: { type: DataTypes.STRING(255), allowNull: true },
  lat: { type: DataTypes.DOUBLE, allowNull: true },
  lng: { type: DataTypes.DOUBLE, allowNull: true },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'incidents',
  timestamps: false
});

// Add association for join in routes
Incident.associate = (models) => {
  Incident.belongsTo(models.User, { foreignKey: 'user_id' });
};

module.exports = Incident;
