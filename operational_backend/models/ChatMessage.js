import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class ChatMessage extends Model {
    static associate(models) {
      // Define associations here
      ChatMessage.belongsTo(models.Conversation, {
        foreignKey: 'conversation_id',
        as: 'conversation'
      });
      
      ChatMessage.belongsTo(models.User, {
        foreignKey: 'sender_id',
        as: 'sender'
      });
      
      ChatMessage.belongsTo(models.User, {
        foreignKey: 'receiver_id',
        as: 'receiver'
      });
      
      // Self-referential for replies
      ChatMessage.belongsTo(models.ChatMessage, {
        foreignKey: 'parent_message_id',
        as: 'parentMessage'
      });
      
      ChatMessage.hasMany(models.ChatMessage, {
        foreignKey: 'parent_message_id',
        as: 'replies'
      });
    }
  }

  ChatMessage.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    room_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Unique room identifier for the conversation'
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
    conversation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Legacy message field, use content for new messages'
    },
    message_type: {
      type: DataTypes.ENUM('text', 'image', 'location', 'file'),
      allowNull: false,
      defaultValue: 'text'
    },
    content: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Structured message content including text, media URLs, etc.'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed'),
      allowNull: false,
      defaultValue: 'sent'
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reactions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      get() {
        const rawValue = this.getDataValue('reactions');
        return rawValue || {};
      }
    },
    is_edited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    deleted_for: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      get() {
        const rawValue = this.getDataValue('deleted_for');
        return rawValue || [];
      }
    },
    parent_message_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'chat_messages',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {
    sequelize,
    modelName: 'ChatMessage',
    tableName: 'chat_messages',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_chat_messages_conversation',
        fields: ['conversation_id']
      },
      {
        name: 'idx_chat_messages_sender',
        fields: ['sender_id']
      },
      {
        name: 'idx_chat_messages_receiver',
        fields: ['receiver_id']
      },
      {
        name: 'idx_chat_messages_created',
        fields: ['created_at']
      }
    ]
  });

  return ChatMessage;
};
