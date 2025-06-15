const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'safety_emergency_db',
  process.env.DB_USER || 'sarin_raj',
  process.env.DB_PASSWORD || 'Sarinraj@2025!',
  {
    host: process.env.DB_HOST || '139.59.40.236',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log
  }
);

async function updateTables() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔍 Checking and updating database tables...');
    
    // Check if conversations table exists and has the correct columns
    const [conversationColumns] = await sequelize.query(
      'SHOW COLUMNS FROM conversations',
      { transaction }
    );
    
    const hasParticipantIds = conversationColumns.some(col => col.Field === 'participant_ids');
    
    if (!hasParticipantIds) {
      console.log('🔄 Adding participant_ids column to conversations table...');
      await sequelize.query(
        'ALTER TABLE conversations ADD COLUMN participant_ids JSON NOT NULL COMMENT \'Array of user IDs participating in the conversation\'',
        { transaction }
      );
    }
    
    // Check if chat_messages table exists and has the correct columns
    const [messageColumns] = await sequelize.query(
      'SHOW COLUMNS FROM chat_messages',
      { transaction }
    );
    
    const hasConversationId = messageColumns.some(col => col.Field === 'conversation_id');
    const hasMessageType = messageColumns.some(col => col.Field === 'message_type');
    const hasContent = messageColumns.some(col => col.Field === 'content');
    
    if (!hasConversationId) {
      console.log('🔄 Adding conversation_id column to chat_messages table...');
      await sequelize.query(
        'ALTER TABLE chat_messages ADD COLUMN conversation_id INT NOT NULL',
        { transaction }
      );
    }
    
    if (!hasMessageType) {
      console.log('🔄 Adding message_type column to chat_messages table...');
      await sequelize.query(
        'ALTER TABLE chat_messages ADD COLUMN message_type ENUM(\'text\', \'image\', \'location\', \'file\') NOT NULL',
        { transaction }
      );
    }
    
    if (!hasContent) {
      console.log('🔄 Adding content column to chat_messages table...');
      await sequelize.query(
        'ALTER TABLE chat_messages ADD COLUMN content JSON NOT NULL',
        { transaction }
      );
    }
    
    // Add foreign key constraint if it doesn't exist
    const [constraints] = await sequelize.query(
      'SELECT * FROM information_schema.TABLE_CONSTRAINTS ' +
      'WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_TYPE = \'FOREIGN_KEY\' ' +
      'AND CONSTRAINT_NAME LIKE \'%conversation_id%\'',
      {
        replacements: [process.env.DB_NAME || 'safety_emergency_db', 'chat_messages'],
        transaction
      }
    );
    
    if (constraints.length === 0) {
      console.log('🔗 Adding foreign key constraint from chat_messages to conversations...');
      await sequelize.query(
        'ALTER TABLE chat_messages ' +
        'ADD CONSTRAINT fk_chat_messages_conversation ' +
        'FOREIGN KEY (conversation_id) REFERENCES conversations(id) ' +
        'ON UPDATE CASCADE ON DELETE CASCADE',
        { transaction }
      );
    }
    
    await transaction.commit();
    console.log('✅ Database tables updated successfully!');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error updating database tables:', error);
    process.exit(1);
  }
}

updateTables();
