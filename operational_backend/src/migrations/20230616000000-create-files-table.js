'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('files', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      original_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      storage_path: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mime_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('image', 'audio', 'video', 'file'),
        allowNull: false,
      },
      chat_message_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_messages',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('files', ['chat_message_id']);
    await queryInterface.addIndex('files', ['created_by']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('files');
  },
};
