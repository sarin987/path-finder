// migrations/20240417_conversations.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      service_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      participant_ids: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      last_message_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'chat_messages',
          key: 'id'
        }
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('conversations');
  }
};