const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class ConversationParticipant extends Model {}

  ConversationParticipant.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      conversation_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'ID of the conversation',
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'ID of the user',
      },
      role: {
        type: DataTypes.ENUM('admin', 'member'),
        defaultValue: 'member',
        allowNull: false,
        comment: 'Role of the participant in the conversation',
      },
      last_read_message_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'messages',
          key: 'id',
        },
        comment: 'ID of the last message read by the participant',
      },
      is_muted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether the participant has muted the conversation',
      },
      is_blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether the participant has been blocked in the conversation',
      },
      joined_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'When the participant joined the conversation',
      },
      left_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the participant left the conversation (if applicable)',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'When the participant record was created',
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'When the participant record was last updated',
      },
    },
    {
      sequelize,
      modelName: 'ConversationParticipant',
      tableName: 'conversation_participants',
      timestamps: false, // We're using custom timestamp fields
      underscored: true,
      hooks: {
        beforeCreate: (participant) => {
          participant.created_at = new Date();
          participant.updated_at = new Date();
        },
        beforeUpdate: (participant) => {
          participant.updated_at = new Date();
        },
      },
    }
  );

  return ConversationParticipant;
};
