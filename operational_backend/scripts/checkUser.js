const { sequelize } = require('../config/database');
const User = require('../models/User');

async function checkUser(phone) {
  try {
    // Format phone number (remove any non-digit characters)
    const formattedPhone = phone.replace(/\D/g, '');
    
    console.log('Checking user with phone:', formattedPhone);
    
    // Find user with raw query to bypass any model scopes
    const [results] = await sequelize.query(
      'SELECT id, phone, password, role, "createdAt", "updatedAt" FROM users WHERE phone = :phone',
      {
        replacements: { phone: formattedPhone },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!results) {
      console.log('No user found with phone:', formattedPhone);
      return null;
    }
    
    console.log('User found:');
    console.log('ID:', results.id);
    console.log('Phone:', results.phone);
    console.log('Role:', results.role);
    console.log('Password hash:', results.password ? '[HASH PRESENT]' : '[MISSING]');
    console.log('Created:', results.createdAt);
    console.log('Updated:', results.updatedAt);
    
    return results;
  } catch (error) {
    console.error('Error checking user:', error);
    throw error;
  }
}

// Get phone number from command line arguments
const phone = process.argv[2];
if (!phone) {
  console.error('Please provide a phone number as an argument');
  process.exit(1);
}

// Run the check
checkUser(phone)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
