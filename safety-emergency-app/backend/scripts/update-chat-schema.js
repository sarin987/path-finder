const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

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

async function updateChatSchema() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Starting chat schema update...');
    
    // 1. Add new columns to chat_messages
    console.log('Adding new columns to chat_messages table...');
    await sequelize.query(`
      ALTER TABLE chat_messages
      ADD COLUMN IF NOT EXISTS status ENUM('sent', 'delivered', 'read', 'failed') NOT NULL DEFAULT 'sent',
      ADD COLUMN IF NOT EXISTS read_at DATETIME NULL,
      ADD COLUMN IF NOT EXISTS delivered_at DATETIME NULL,
      ADD COLUMN IF NOT EXISTS reactions JSON DEFAULT (JSON_OBJECT()),
      ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS deleted_for JSON DEFAULT (JSON_ARRAY()),
      ADD COLUMN IF NOT EXISTS parent_message_id INT NULL,
      ADD CONSTRAINT fk_parent_message
        FOREIGN KEY (parent_message_id) 
        REFERENCES chat_messages(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
      ADD INDEX idx_chat_messages_status (status),
      ADD INDEX idx_chat_messages_created_at (created_at);
    `, { transaction });

    // 2. Rename message to content if it exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'safety_emergency_db' 
      AND TABLE_NAME = 'chat_messages' 
      AND COLUMN_NAME = 'message'
    `, { transaction });

    if (results.length > 0) {
      console.log('Renaming message column to content...');
      await sequelize.query(`
        ALTER TABLE chat_messages 
        CHANGE COLUMN message content TEXT NOT NULL
      `, { transaction });
    }

    // 3. Add last_active to users table if it doesn't exist
    console.log('Updating users table...');
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_active DATETIME NULL
    `, { transaction });

    await transaction.commit();
    console.log('✅ Chat schema updated successfully!');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error updating chat schema:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the update
updateChatSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
