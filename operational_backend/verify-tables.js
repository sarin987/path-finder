const { Sequelize } = require('sequelize');
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

async function verifyTables() {
  try {
    console.log('🔍 Verifying table structures...');
    
    // Check conversations table
    console.log('\n📋 Conversations table structure:');
    const [conversationColumns] = await sequelize.query('SHOW COLUMNS FROM conversations');
    console.table(conversationColumns);
    
    // Check chat_messages table
    console.log('\n📋 Chat Messages table structure:');
    const [messageColumns] = await sequelize.query('SHOW COLUMNS FROM chat_messages');
    console.table(messageColumns);
    
    // Check foreign key constraints
    console.log('\n🔗 Foreign Key Constraints:');
    const [constraints] = await sequelize.query(
      `SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? 
      AND REFERENCED_TABLE_NAME IS NOT NULL
      AND TABLE_NAME IN ('chat_messages', 'conversations')`,
      {
        replacements: [process.env.DB_NAME || 'safety_emergency_db']
      }
    );
    console.table(constraints);
    
    console.log('✅ Verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying tables:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

verifyTables();
