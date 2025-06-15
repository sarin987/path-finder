import { DataTypes } from 'sequelize';
import db from '../config/database.js';

const ChatMessage = db.define('ChatMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  receiver_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  type: {
    type: DataTypes.ENUM('text', 'image', 'location', 'emergency_alert'),
    defaultValue: 'text',
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'chat_messages',  // Explicitly set the table name
  timestamps: true,             // Enable createdAt and updatedAt
  underscored: true,            // Use snake_case for column names
  createdAt: 'created_at',      // Customize the created_at column name
  updatedAt: 'updated_at',      // Customize the updated_at column name
  indexes: [
    // Index for querying messages between two users
    {
      fields: ['sender_id', 'receiver_id']
    },
    // Index for checking unread messages
    {
      fields: ['receiver_id', 'read']
    }
  ]
});

export default ChatMessage;
