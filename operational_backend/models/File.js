'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    static associate(models) {
      // Define associations here
      File.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      
      File.belongsTo(models.Message, {
        foreignKey: 'message_id',
        as: 'message'
      });
    }
  }
  
  File.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    original_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    storage_path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    message_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Messages',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'File',
    tableName: 'Files',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return File;
};
