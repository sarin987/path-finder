// migrations/20240615_initial_schema.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create conversations table first
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
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Array of user IDs participating in the conversation'
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Create chat_messages table
    await queryInterface.createTable('chat_messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      conversation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      message_type: {
        type: Sequelize.ENUM('text', 'image', 'location', 'file'),
        allowNull: false
      },
      content: {
        type: Sequelize.JSON,
        allowNull: false
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      firebase_url: {
        type: Sequelize.STRING,
        allowNull: true
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

    // Add indexes for better performance
    await queryInterface.addIndex('chat_messages', ['conversation_id']);
    await queryInterface.addIndex('chat_messages', ['sender_id']);
    await queryInterface.addIndex('chat_messages', ['created_at']);
    await queryInterface.addIndex('conversations', ['participant_ids'], {
      using: 'BTREE',
      name: 'idx_conversations_participant_ids'
    });
  },

  down: async (queryInterface) => {
    // Drop in reverse order to respect foreign key constraints
    await queryInterface.dropTable('chat_messages');
    await queryInterface.dropTable('conversations');
  }
};
