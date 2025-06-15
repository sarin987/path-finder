const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Message extends Model {
  static STATUS = {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    FAILED: 'failed'
  };

  static TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    LOCATION: 'location',
    SYSTEM: 'system'
  };
}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    roomId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'room_id',
      comment: 'Unique identifier for the chat room/conversation'
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sender_id',
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'ID of the user who sent the message'
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'receiver_id',
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'ID of the user who should receive the message'
    },
    parentMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_message_id',
      references: {
        model: 'messages',
        key: 'id',
      },
      comment: 'For message replies, references the parent message'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'The message content (can be null for system messages)'
    },
    type: {
      type: DataTypes.ENUM(
        Message.TYPES.TEXT,
        Message.TYPES.IMAGE,
        Message.TYPES.FILE,
        Message.TYPES.LOCATION,
        Message.TYPES.SYSTEM
      ),
      defaultValue: Message.TYPES.TEXT,
      comment: 'Type of the message content'
    },
    status: {
      type: DataTypes.ENUM(
        Message.STATUS.SENT,
        Message.STATUS.DELIVERED,
        Message.STATUS.READ,
        Message.STATUS.FAILED
      ),
      defaultValue: Message.STATUS.SENT,
      comment: 'Delivery status of the message'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional metadata for the message (e.g., file info, location data)'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at',
      comment: 'When the message was read by the recipient'
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'delivered_at',
      comment: 'When the message was delivered to the recipient'
    },
    reactions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Message reactions from users (e.g., { userId: \'thumbs_up\' })'
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_edited',
      comment: 'Whether the message has been edited'
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_deleted',
      comment: 'Whether the message has been deleted'
    },
    deletedFor: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [],
      field: 'deleted_for',
      comment: 'User IDs for whom this message should be hidden'
    },
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    paranoid: false,
    defaultScope: {
      where: {
        isDeleted: false,
      },
    },
    scopes: {
      withDeleted: {
        where: {},
      },
      byRoom(roomId) {
        return {
          where: { roomId }
        };
      },
      byUser(userId) {
        return {
          where: {
            [Op.or]: [
              { senderId: userId },
              { receiverId: userId }
            ]
          }
        };
      },
      unread(userId) {
        return {
          where: {
            receiverId: userId,
            status: {
              [Op.in]: [Message.STATUS.SENT, Message.STATUS.DELIVERED]
            }
          }
        };
      },
    },
    hooks: {
      beforeCreate: (message) => {
        message.deliveredAt = new Date();
      },
    },
    indexes: [
      {
        fields: ['room_id'],
        name: 'idx_messages_room_id',
      },
      {
        fields: ['sender_id'],
        name: 'idx_messages_sender_id',
      },
      {
        fields: ['receiver_id'],
        name: 'idx_messages_receiver_id',
      },
      {
        fields: ['created_at'],
        name: 'idx_messages_created_at',
      },
      {
        fields: ['status'],
        name: 'idx_messages_status',
      },
    ],
  }
);

module.exports = Message;
