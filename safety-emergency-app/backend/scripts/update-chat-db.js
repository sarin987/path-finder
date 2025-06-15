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

async function checkAndAddColumn(table, column, definition) {
  const [results] = await sequelize.query(`
    SELECT COUNT(*) as count 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'safety_emergency_db' 
    AND TABLE_NAME = '${table}' 
    AND COLUMN_NAME = '${column}'
  `);
  
  if (results[0].count === 0) {
    console.log(`Adding column ${column} to ${table}...`);
    await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } else {
    console.log(`Column ${column} already exists in ${table}`);
  }
}

async function updateChatSchema() {
  console.log('Starting chat schema update...');
  
  try {
    // Add columns to chat_messages
    await checkAndAddColumn('chat_messages', 'status', "ENUM('sent', 'delivered', 'read', 'failed') NOT NULL DEFAULT 'sent'");
    await checkAndAddColumn('chat_messages', 'read_at', 'DATETIME NULL');
    await checkAndAddColumn('chat_messages', 'delivered_at', 'DATETIME NULL');
    await checkAndAddColumn('chat_messages', 'reactions', 'JSON DEFAULT (JSON_OBJECT())');
    await checkAndAddColumn('chat_messages', 'is_edited', 'BOOLEAN NOT NULL DEFAULT FALSE');
    await checkAndAddColumn('chat_messages', 'is_deleted', 'BOOLEAN NOT NULL DEFAULT FALSE');
    await checkAndAddColumn('chat_messages', 'deleted_for', 'JSON DEFAULT (JSON_ARRAY())');
    await checkAndAddColumn('chat_messages', 'parent_message_id', 'INT NULL');

    // Add foreign key for parent_message_id if it doesn't exist
    const [fkResults] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = 'safety_emergency_db' 
      AND TABLE_NAME = 'chat_messages' 
      AND CONSTRAINT_NAME = 'fk_parent_message'
    `);
    
    if (fkResults[0].count === 0) {
      console.log('Adding foreign key constraint for parent_message_id...');
      await sequelize.query(`
        ALTER TABLE chat_messages 
        ADD CONSTRAINT fk_parent_message
        FOREIGN KEY (parent_message_id) 
        REFERENCES chat_messages(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
      `);
    }

    // Add indexes if they don't exist
    const [idxStatus] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = 'safety_emergency_db' 
      AND TABLE_NAME = 'chat_messages' 
      AND INDEX_NAME = 'idx_chat_messages_status'
    `);
    
    if (idxStatus[0].count === 0) {
      console.log('Adding index on status column...');
      await sequelize.query('CREATE INDEX idx_chat_messages_status ON chat_messages(status)');
    }

    const [idxCreatedAt] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = 'safety_emergency_db' 
      AND TABLE_NAME = 'chat_messages' 
      AND INDEX_NAME = 'idx_chat_messages_created_at'
    `);
    
    if (idxCreatedAt[0].count === 0) {
      console.log('Adding index on created_at column...');
      await sequelize.query('CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at)');
    }

    // Add last_active to users table if it doesn't exist
    await checkAndAddColumn('users', 'last_active', 'DATETIME NULL');

    console.log('✅ Chat schema updated successfully!');
  } catch (error) {
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
    console.error('Update failed:', error);
    process.exit(1);
  });
