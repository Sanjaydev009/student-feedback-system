// test-bulk-upload.js
const axios = require('axios');

// Replace with your actual JWT token for an admin user
const token = ""; // Add your token here after logging in as admin

const API_URL = 'http://localhost:5001'; // Adjust if your backend is on a different port

// Test data - Similar to what would come from a CSV
const testStudents = [
  {
    name: "Test Student 1",
    email: "teststudent1@example.com",
    rollNumber: "TEST001",
    branch: "MCA Regular"
  },
  {
    name: "Test Student 2",
    email: "teststudent2@example.com",
    rollNumber: "TEST002",
    branch: "MCA Regular"
  },
  {
    // Deliberately missing rollNumber to test validation
    name: "Invalid Student",
    email: "invalid@example.com",
    branch: "MCA Regular"
  },
  {
    // Deliberately invalid email format to test validation
    name: "Invalid Email",
    email: "not-an-email",
    rollNumber: "TEST003",
    branch: "MCA Regular"
  }
];

async function testBulkUpload() {
  try {
    console.log('🚀 Testing bulk student upload endpoint');
    
    if (!token) {
      console.log('❌ ERROR: Please add your admin token to the script first');
      return;
    }

    console.log(`📤 Sending ${testStudents.length} students...`);
    
    const response = await axios.post(`${API_URL}/api/auth/register/bulk`, {
      students: testStudents
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Request successful!');
    console.log('📊 Response summary:');
    console.log(`   - Total students processed: ${response.data.results.success + response.data.results.failed}`);
    console.log(`   - Successfully added: ${response.data.results.success}`);
    console.log(`   - Failed: ${response.data.results.failed}`);
    
    if (response.data.results.failures && response.data.results.failures.length > 0) {
      console.log('❌ Failures:');
      response.data.results.failures.forEach((failure, index) => {
        console.log(`   ${index + 1}. Email: ${failure.email}, Reason: ${failure.reason}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error testing bulk upload:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('   No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log(`   Error message: ${error.message}`);
    }
  }
}

testBulkUpload();
