// migrations/20240417_conversations_fixed.js
'use strict';

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
        type: Sequelize.JSON,  // Changed from JSONB to JSON for MySQL
        allowNull: false,
        comment: 'Array of user IDs participating in the conversation'
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp of the last message in the conversation'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add index for faster lookups
    await queryInterface.addIndex('conversations', ['participant_ids'], {
      using: 'BTREE',
      name: 'idx_conversations_participant_ids'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('conversations');
  }
};
