const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Create a test token for authentication
const createTestToken = () => {
  // This is just for testing - in a real app, you'd use a real user ID
  return jwt.sign(
    {
      userId: 'test-user-id',
      userType: 'admin'
    },
    process.env.JWT_SECRET || 'test-secret'
  );
};

async function testTransactionsAPI() {
  try {
    const token = createTestToken();
    console.log('Created test token for authentication');
    
    // Test the /api/v1/transactions/all endpoint
    const response = await axios.get('http://localhost:5000/api/v1/transactions/all', {
      headers: {
        'x-auth-token': token
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error calling API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testTransactionsAPI();
