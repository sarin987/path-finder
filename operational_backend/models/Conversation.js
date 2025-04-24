// models/Conversation.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  service_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  participant_ids: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  last_message_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Message',
      key: 'id'
    }
  },
  last_message_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  underscored: true
});

module.exports = Conversation;