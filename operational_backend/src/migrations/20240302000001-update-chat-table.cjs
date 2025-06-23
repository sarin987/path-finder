'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting migration: update-chat-table');
      
      // Add new columns if they don't exist
      const tableInfo = await queryInterface.describeTable('chat_messages');
      
      if (!tableInfo.status) {
        console.log('Adding status column');
        await queryInterface.addColumn('chat_messages', 'status', {
          type: Sequelize.ENUM('sent', 'delivered', 'read', 'failed'),
          allowNull: false,
          defaultValue: 'sent'
        }, { transaction });
      }

      if (!tableInfo.read_at) {
        console.log('Adding read_at column');
        await queryInterface.addColumn('chat_messages', 'read_at', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
      }

      if (!tableInfo.delivered_at) {
        console.log('Adding delivered_at column');
        await queryInterface.addColumn('chat_messages', 'delivered_at', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
      }

      if (!tableInfo.reactions) {
        console.log('Adding reactions column');
        await queryInterface.addColumn('chat_messages', 'reactions', {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: {}
        }, { transaction });
      }

      if (!tableInfo.is_edited) {
        console.log('Adding is_edited column');
        await queryInterface.addColumn('chat_messages', 'is_edited', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        }, { transaction });
      }

      if (!tableInfo.is_deleted) {
        console.log('Adding is_deleted column');
        await queryInterface.addColumn('chat_messages', 'is_deleted', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        }, { transaction });
      }

      if (!tableInfo.deleted_for) {
        console.log('Adding deleted_for column');
        await queryInterface.addColumn('chat_messages', 'deleted_for', {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: '[]'
        }, { transaction });
      }

      if (!tableInfo.parent_message_id) {
        console.log('Adding parent_message_id column');
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
      }

      // Rename message to content if it exists
      if (tableInfo.message && !tableInfo.content) {
        console.log('Renaming message column to content');
        await queryInterface.renameColumn('chat_messages', 'message', 'content', { transaction });
      }

      // Add indexes
      console.log('Adding indexes');
      const indexes = (await queryInterface.showIndex('chat_messages')).map(idx => idx.name);
      
      if (!indexes.includes('idx_chat_messages_status')) {
        await queryInterface.addIndex('chat_messages', ['status'], {
          name: 'idx_chat_messages_status',
          transaction
        });
      }
      
      if (!indexes.includes('idx_chat_messages_created_at')) {
        await queryInterface.addIndex('chat_messages', ['created_at'], {
          name: 'idx_chat_messages_created_at',
          transaction
        });
      }

      // Add last_active to users table if it doesn't exist
      const userTableInfo = await queryInterface.describeTable('users');
      if (!userTableInfo.last_active) {
        console.log('Adding last_active to users table');
        await queryInterface.addColumn('users', 'last_active', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
      }

      await transaction.commit();
      console.log('✅ Chat table updated successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error updating chat table:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting migration rollback: update-chat-table');
      
      // Remove indexes
      console.log('Removing indexes');
      const indexes = (await queryInterface.showIndex('chat_messages')).map(idx => idx.name);
      
      if (indexes.includes('idx_chat_messages_status')) {
        await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_status', { transaction });
      }
      
      if (indexes.includes('idx_chat_messages_created_at')) {
        await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_created_at', { transaction });
      }

      // Revert column renames
      const tableInfo = await queryInterface.describeTable('chat_messages');
      if (tableInfo.content && !tableInfo.message) {
        console.log('Reverting content column to message');
        await queryInterface.renameColumn('chat_messages', 'content', 'message', { transaction });
      }

      // Remove added columns
      console.log('Removing columns');
      const columnsToRemove = [
        'status', 'read_at', 'delivered_at', 'reactions',
        'is_edited', 'is_deleted', 'deleted_for', 'parent_message_id'
      ];
      
      for (const column of columnsToRemove) {
        if (tableInfo[column]) {
          console.log(`Removing column: ${column}`);
          await queryInterface.removeColumn('chat_messages', column, { transaction });
        }
      }

      // Remove last_active from users if it exists
      const userTableInfo = await queryInterface.describeTable('users');
      if (userTableInfo.last_active) {
        console.log('Removing last_active from users table');
        await queryInterface.removeColumn('users', 'last_active', { transaction });
      }

      // Drop enum type if it exists
      const enumExists = await queryInterface.sequelize.query(
        "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'safety_emergency_db' AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'status' AND COLUMN_TYPE LIKE 'enum%'",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      if (enumExists && enumExists.length > 0) {
        console.log('Dropping enum type');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS `enum_chat_messages_status`', { transaction });
      }

      await transaction.commit();
      console.log('✅ Chat table reverted successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error reverting chat table:', error);
      throw error;
    }
  }
};
