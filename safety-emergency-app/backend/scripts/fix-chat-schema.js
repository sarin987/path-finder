const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Use the same credentials as in the working commands
const sequelize = new Sequelize(
  'safety_emergency_db',
  'sarin_raj',
  'Sarinraj@2025!',
  {
    host: '139.59.40.236',
    port: 3306,
    dialect: 'mysql',
    logging: console.log
  }
);

async function fixChatSchema() {
  console.log('Starting chat schema fix...');
  
  try {
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
        ON UPDATE CASCADE;
    `);

    // 2. Add indexes
    console.log('Adding indexes...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
    `);

    // 3. Update users table
    console.log('Updating users table...');
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_active DATETIME NULL;
    `);

    console.log('✅ Chat schema fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing chat schema:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the fix
fixChatSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fix failed:', error);
    process.exit(1);
  });
