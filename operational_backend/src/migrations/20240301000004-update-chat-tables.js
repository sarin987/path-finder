'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if columns exist before adding them
      const tableInfo = await queryInterface.describeTable('ChatMessages');
      
      if (!tableInfo.status) {
        await queryInterface.addColumn('ChatMessages', 'status', {
          type: Sequelize.ENUM('sent', 'delivered', 'read', 'failed'),
          defaultValue: 'sent',
          allowNull: false
        }, { transaction });
      }

      if (!tableInfo.readAt) {
        await queryInterface.addColumn('ChatMessages', 'readAt', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
      }

      if (!tableInfo.deliveredAt) {
        await queryInterface.addColumn('ChatMessages', 'deliveredAt', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
      }

      if (!tableInfo.reactions) {
        await queryInterface.addColumn('ChatMessages', 'reactions', {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: {}
        }, { transaction });
      }

      if (!tableInfo.isEdited) {
        await queryInterface.addColumn('ChatMessages', 'isEdited', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        }, { transaction });
      }

      if (!tableInfo.isDeleted) {
        await queryInterface.addColumn('ChatMessages', 'isDeleted', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        }, { transaction });
      }

      if (!tableInfo.deletedFor) {
        await queryInterface.addColumn('ChatMessages', 'deletedFor', {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: []
        }, { transaction });
      }

      if (!tableInfo.parentMessageId) {
        await queryInterface.addColumn('ChatMessages', 'parentMessageId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'ChatMessages',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }, { transaction });
      }

      // Add indexes for better query performance
      const indexes = await queryInterface.showIndex('ChatMessages');
      const indexNames = indexes.map(idx => idx.name);
      
      if (!indexNames.includes('chat_messages_room_id')) {
        await queryInterface.addIndex('ChatMessages', ['roomId'], { 
          name: 'chat_messages_room_id',
          transaction 
        });
      }
      
      if (!indexNames.includes('chat_messages_sender_id')) {
        await queryInterface.addIndex('ChatMessages', ['senderId'], { 
          name: 'chat_messages_sender_id',
          transaction 
        });
      }
      
      if (!indexNames.includes('chat_messages_receiver_id')) {
        await queryInterface.addIndex('ChatMessages', ['receiverId'], { 
          name: 'chat_messages_receiver_id',
          transaction 
        });
      }
      
      if (!indexNames.includes('chat_messages_status')) {
        await queryInterface.addIndex('ChatMessages', ['status'], { 
          name: 'chat_messages_status',
          transaction 
        });
      }
      
      if (!indexNames.includes('chat_messages_created_at')) {
        await queryInterface.addIndex('ChatMessages', ['createdAt'], { 
          name: 'chat_messages_created_at',
          transaction 
        });
      }

      // Add lastActive to Users table if it doesn't exist
      const userTableInfo = await queryInterface.describeTable('Users');
      if (!userTableInfo.lastActive) {
        await queryInterface.addColumn('Users', 'lastActive', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
      }

      await transaction.commit();
      console.log('✅ Chat tables updated successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error updating chat tables:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove indexes if they exist
      const indexes = await queryInterface.showIndex('ChatMessages');
      const indexNames = indexes.map(idx => idx.name);
      
      if (indexNames.includes('chat_messages_room_id')) {
        await queryInterface.removeIndex('ChatMessages', 'chat_messages_room_id', { transaction });
      }
      
      if (indexNames.includes('chat_messages_sender_id')) {
        await queryInterface.removeIndex('ChatMessages', 'chat_messages_sender_id', { transaction });
      }
      
      if (indexNames.includes('chat_messages_receiver_id')) {
        await queryInterface.removeIndex('ChatMessages', 'chat_messages_receiver_id', { transaction });
      }
      
      if (indexNames.includes('chat_messages_status')) {
        await queryInterface.removeIndex('ChatMessages', 'chat_messages_status', { transaction });
      }
      
      if (indexNames.includes('chat_messages_created_at')) {
        await queryInterface.removeIndex('ChatMessages', 'chat_messages_created_at', { transaction });
      }

      // Remove columns if they exist
      const tableInfo = await queryInterface.describeTable('ChatMessages');
      
      if (tableInfo.status) {
        await queryInterface.removeColumn('ChatMessages', 'status', { transaction });
      }
      
      if (tableInfo.readAt) {
        await queryInterface.removeColumn('ChatMessages', 'readAt', { transaction });
      }
      
      if (tableInfo.deliveredAt) {
        await queryInterface.removeColumn('ChatMessages', 'deliveredAt', { transaction });
      }
      
      if (tableInfo.reactions) {
        await queryInterface.removeColumn('ChatMessages', 'reactions', { transaction });
      }
      
      if (tableInfo.isEdited) {
        await queryInterface.removeColumn('ChatMessages', 'isEdited', { transaction });
      }
      
      if (tableInfo.isDeleted) {
        await queryInterface.removeColumn('ChatMessages', 'isDeleted', { transaction });
      }
      
      if (tableInfo.deletedFor) {
        await queryInterface.removeColumn('ChatMessages', 'deletedFor', { transaction });
      }
      
      if (tableInfo.parentMessageId) {
        await queryInterface.removeColumn('ChatMessages', 'parentMessageId', { transaction });
      }

      // Remove column from Users if it exists
      const userTableInfo = await queryInterface.describeTable('Users');
      if (userTableInfo.lastActive) {
        await queryInterface.removeColumn('Users', 'lastActive', { transaction });
      }

      // Drop enum type if it exists
      const enumExists = await queryInterface.sequelize.query(
        "SELECT 1 FROM pg_type WHERE typname = 'enum_ChatMessages_status'",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      if (enumExists && enumExists.length > 0) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ChatMessages_status"', { transaction });
      }

      await transaction.commit();
      console.log('✅ Chat tables reverted successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error reverting chat tables:', error);
      throw error;
    }
  }
};
