const { DataTypes, Op, Model } = require('sequelize');

module.exports = (sequelize) => {
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
      LOCATION: 'location'
    };
  }

  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Primary key'
    },
    room_id: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Room ID for the conversation'
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'ID of the user who sent the message'
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'ID of the user who should receive the message'
    },
    conversation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'ID of the conversation this message belongs to'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'The message content (optional if content JSON is used)'
    },
    message_type: {
      type: DataTypes.ENUM('text', 'image', 'file', 'location'),
      defaultValue: 'text',
      comment: 'Type of the message content'
    },
    content: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Structured content of the message (for rich content)'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the message has been read by the recipient'
    },
    status: {
      type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed'),
      defaultValue: 'sent',
      comment: 'Delivery status of the message'
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the message was read by the recipient'
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the message was delivered to the recipient'
    },
    reactions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Message reactions from users (e.g., { userId: "thumbs_up" })'
    },
    is_edited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the message has been edited'
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the message has been deleted'
    },
    deleted_for: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'User IDs for whom this message should be hidden'
    },
    parent_message_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'chat_messages',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'For message replies, references the parent message'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When the message was created'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When the message was last updated'
    }
  };

  const options = {
    sequelize,
    modelName: 'Message',
    tableName: 'chat_messages',
    timestamps: false, // Using custom timestamp fields
    underscored: true,
    hooks: {
      beforeCreate: (message) => {
        message.created_at = new Date();
        message.updated_at = new Date();
      },
      beforeUpdate: (message) => {
        message.updated_at = new Date();
      },
    },
    defaultScope: {
      where: {
        is_deleted: false,
      },
      attributes: {
        exclude: ['deleted_for'],
      },
    },
    scopes: {
      withUser: {
        include: [
          {
            model: () => sequelize.models.User,
            as: 'sender',
            attributes: ['id', 'name', 'email', 'profile_picture']
          },
          {
            model: () => sequelize.models.User,
            as: 'receiver',
            attributes: ['id', 'name', 'email', 'profile_picture']
          },
          {
            model: () => sequelize.models.Conversation,
            as: 'conversation',
            attributes: ['id', 'title', 'is_group']
          }
        ]
      },
      byRoom(roomId) {
        return {
          where: { room_id: roomId },
          order: [['created_at', 'ASC']],
        };
      },
      byUser(userId) {
        return {
          where: {
            [Op.or]: [
              { sender_id: userId },
              { receiver_id: userId },
            ],
          },
          order: [['created_at', 'DESC']],
        };
      },
      unread(userId) {
        return {
          where: {
            receiver_id: userId,
            is_read: false,
          },
          order: [['created_at', 'DESC']],
        };
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
        fields: ['conversation_id'],
        name: 'idx_messages_conversation_id',
      },
      {
        fields: ['parent_message_id'],
        name: 'idx_messages_parent_message_id',
      },
      {
        fields: ['created_at'],
        name: 'idx_messages_created_at',
      },
      {
        fields: ['is_deleted'],
        name: 'idx_messages_is_deleted',
      },
      {
        fields: ['status'],
        name: 'idx_messages_status',
      },
    ]
  };

  Message.init(schema, options);
  return Message;
};
