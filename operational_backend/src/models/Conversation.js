const { DataTypes, Op, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Conversation extends Model {}

  Conversation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Title for group conversations',
      },
      is_group: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this is a group conversation',
      },
      last_message_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'chat_messages',
          key: 'id',
        },
        comment: 'ID of the last message in the conversation',
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        comment: 'User who created the conversation',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the conversation was soft-deleted',
      },
    },
    {
      sequelize,
      modelName: 'Conversation',
      tableName: 'conversations',
      timestamps: false,
      underscored: true,
      hooks: {
        beforeCreate: (conversation) => {
          conversation.created_at = new Date();
          conversation.updated_at = new Date();
        },
        beforeUpdate: (conversation) => {
          conversation.updated_at = new Date();
        },
      },
      defaultScope: {
        where: {
          deleted_at: null,
        },
      },
      scopes: {
        withParticipants: {
          include: [
            {
              model: sequelize.models.ConversationParticipant,
              as: 'participants',
              include: [
                {
                  model: sequelize.models.User,
                  as: 'user',
                  attributes: ['id', 'name', 'email', 'role'],
                },
              ],
            },
          ],
        },
        byUser(userId) {
          return {
            include: [
              {
                model: sequelize.models.ConversationParticipant,
                as: 'participants',
                where: { user_id: userId },
                required: true,
              },
            ],
            order: [['updated_at', 'DESC']],
          };
        },
      },
    }
  );

  return Conversation;
};
