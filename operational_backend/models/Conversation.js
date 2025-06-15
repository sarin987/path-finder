import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Conversation extends Model {
    static associate(models) {
      // Define associations here
      Conversation.hasMany(models.ChatMessage, {
        foreignKey: 'conversation_id',
        as: 'messages'
      });
      
      // Last message association
      Conversation.belongsTo(models.ChatMessage, {
        foreignKey: 'last_message_id',
        as: 'lastMessage'
      });
      
      // Participants through User model
      Conversation.belongsToMany(models.User, {
        through: 'conversation_participants',
        foreignKey: 'conversation_id',
        otherKey: 'user_id',
        as: 'participants'
      });
      
      // Creator of the conversation
      Conversation.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
    }
    
    // Helper method to add a participant
    async addParticipant(userId) {
      const participantIds = this.participant_ids || [];
      if (!participantIds.includes(userId)) {
        participantIds.push(userId);
        this.participant_ids = participantIds;
        await this.save();
      }
      return this;
    }
    
    // Helper method to check if a user is a participant
    isParticipant(userId) {
      return (this.participant_ids || []).includes(userId);
    }
  }

  Conversation.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    service_type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of service (e.g., fire, police, medical)'
    },
    participant_ids: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of user IDs participating in the conversation',
      get() {
        const rawValue = this.getDataValue('participant_ids');
        return rawValue || [];
      },
      set(value) {
        if (Array.isArray(value)) {
          this.setDataValue('participant_ids', [...new Set(value)]); // Ensure unique IDs
        } else {
          this.setDataValue('participant_ids', []);
        }
      }
    },
    last_message_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'chat_messages',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp of the last message in the conversation'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional metadata for the conversation',
      get() {
        const rawValue = this.getDataValue('metadata');
        return rawValue || {};
      }
    },
    is_group: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this is a group conversation'
    },
    group_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Name of the group (if this is a group conversation)'
    },
    group_photo_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL to the group photo (if any)'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User who created the conversation (for group chats)'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the conversation is active'
    }
  }, {
    sequelize,
    modelName: 'Conversation',
    tableName: 'conversations',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_conversation_participants',
        fields: [sequelize.literal("(json_extract(participant_ids, '$[*]')")],
        using: 'BTREE'
      },
      {
        name: 'idx_conversation_last_message',
        fields: ['last_message_at']
      },
      {
        name: 'idx_conversation_active',
        fields: ['is_active']
      }
    ]
  });

  // Add hooks
  Conversation.afterCreate(async (conversation, options) => {
    // Ensure the creator is a participant
    if (conversation.created_by && !conversation.isParticipant(conversation.created_by)) {
      await conversation.addParticipant(conversation.created_by);
    }
  });

  return Conversation;
};
