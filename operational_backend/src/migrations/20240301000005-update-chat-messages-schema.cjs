'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add new columns
      await queryInterface.addColumn('chat_messages', 'status', {
        type: Sequelize.ENUM('sent', 'delivered', 'read', 'failed'),
        defaultValue: 'sent',
        allowNull: false
      }, { transaction });

      await queryInterface.addColumn('chat_messages', 'read_at', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('chat_messages', 'delivered_at', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('chat_messages', 'reactions', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      }, { transaction });

      await queryInterface.addColumn('chat_messages', 'is_edited', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      }, { transaction });

      await queryInterface.addColumn('chat_messages', 'is_deleted', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      }, { transaction });

      await queryInterface.addColumn('chat_messages', 'deleted_for', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '[]'
      }, { transaction });

      await queryInterface.addColumn('chat_messages', 'parent_message_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'chat_messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      // Rename columns to match our model
      await queryInterface.renameColumn('chat_messages', 'is_read', 'is_read_legacy', { transaction });
      await queryInterface.renameColumn('chat_messages', 'message', 'content', { transaction });

      // Add indexes for better query performance
      await queryInterface.addIndex('chat_messages', ['room_id'], { name: 'idx_chat_messages_room_id', transaction });
      await queryInterface.addIndex('chat_messages', ['sender_id'], { name: 'idx_chat_messages_sender_id', transaction });
      await queryInterface.addIndex('chat_messages', ['receiver_id'], { name: 'idx_chat_messages_receiver_id', transaction });
      await queryInterface.addIndex('chat_messages', ['status'], { name: 'idx_chat_messages_status', transaction });
      await queryInterface.addIndex('chat_messages', ['created_at'], { name: 'idx_chat_messages_created_at', transaction });

      // Add last_active to users table if it doesn't exist
      const userColumns = await queryInterface.describeTable('users');
      if (!userColumns.last_active) {
        await queryInterface.addColumn('users', 'last_active', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
      }

      await transaction.commit();
      console.log('✅ Chat messages schema updated successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error updating chat messages schema:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove indexes
      await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_room_id', { transaction });
      await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_sender_id', { transaction });
      await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_receiver_id', { transaction });
      await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_status', { transaction });
      await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_created_at', { transaction });

      // Revert column renames
      await queryInterface.renameColumn('chat_messages', 'is_read_legacy', 'is_read', { transaction });
      await queryInterface.renameColumn('chat_messages', 'content', 'message', { transaction });

      // Remove added columns
      await queryInterface.removeColumn('chat_messages', 'status', { transaction });
      await queryInterface.removeColumn('chat_messages', 'read_at', { transaction });
      await queryInterface.removeColumn('chat_messages', 'delivered_at', { transaction });
      await queryInterface.removeColumn('chat_messages', 'reactions', { transaction });
      await queryInterface.removeColumn('chat_messages', 'is_edited', { transaction });
      await queryInterface.removeColumn('chat_messages', 'is_deleted', { transaction });
      await queryInterface.removeColumn('chat_messages', 'deleted_for', { transaction });
      await queryInterface.removeColumn('chat_messages', 'parent_message_id', { transaction });

      // Remove last_active from users if it was added
      const userColumns = await queryInterface.describeTable('users');
      if (userColumns.last_active) {
        await queryInterface.removeColumn('users', 'last_active', { transaction });
      }

      // Drop enum type if it exists
      const enumExists = await queryInterface.sequelize.query(
        "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'safety_emergency_db' AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'status' AND COLUMN_TYPE LIKE 'enum%'",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      if (enumExists && enumExists.length > 0) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS `enum_chat_messages_status`', { transaction });
      }

      await transaction.commit();
      console.log('✅ Chat messages schema reverted successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error reverting chat messages schema:', error);
      throw error;
    }
  }
};
