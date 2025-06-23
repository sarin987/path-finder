import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api/auth';

async function testAuth() {
  try {
    console.log('🚀 Testing Authentication Flow\n');
    
    // Test registration for each role
    const roles = ['police', 'ambulance', 'fire', 'parent'];
    
    for (const role of roles) {
      console.log(`\n🔹 Testing ${role} user flow...`);
      
      // Test registration
      console.log('  Testing registration...');
      const registerResponse = await axios.post(
        `${API_BASE_URL}/register/${role}`,
        {
          name: `Test ${role}`,
          email: `test.${role}@example.com`,
          password: 'test123',
          phone: '+1234567890'
        }
      );
      
      console.log('  ✅ Registration successful');
      
      // Test login
      console.log('  Testing login...');
      const loginResponse = await axios.post(
        `${API_BASE_URL}/login`,
        {
          email: `test.${role}@example.com`,
          password: 'test123'
        }
      );
      
      const token = loginResponse.data.token;
      console.log('  ✅ Login successful');
      
      // Test protected route
      console.log('  Testing protected route...');
      const meResponse = await axios.get(`${API_BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('  ✅ Protected route access successful');
      console.log('  User data:', {
        id: meResponse.data.id,
        name: meResponse.data.name,
        email: meResponse.data.email,
        role: meResponse.data.role
      });
    }
    
    console.log('\n✨ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAuth();
