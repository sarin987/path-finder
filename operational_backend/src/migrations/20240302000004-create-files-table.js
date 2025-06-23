'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('files', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('files', ['chat_message_id']);
    await queryInterface.addIndex('files', ['created_by']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('files');
  }
};
