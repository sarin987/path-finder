import { testConnection } from './src/config/database';

async function runTest() {
  console.log('🔍 Testing database connection...');
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('✅ Database connection test passed!');
      process.exit(0);
    } else {
      console.error('❌ Database connection test failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during database connection test:', error);
    process.exit(1);
  }
}

runTest();
