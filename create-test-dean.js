// Script to create a dean user for testing
const axios = require('axios');
const crypto = require('crypto');

const API_URL = 'http://localhost:5001';

// Generate a password or use default
const password = process.argv[2] || 'password123';

// Test user data
const deanUser = {
  name: 'Test Dean',
  email: 'dean@test.com',
  password: password,
  role: 'dean',
  department: 'Administration'
};

// First try to register the dean user
async function createDeanUser() {
  try {
    console.log('Creating a dean user for testing...');
    console.log('User details:', { ...deanUser, password: '[HIDDEN]' });
    
    const response = await axios.post(`${API_URL}/api/auth/register`, deanUser);
    
    if (response.status === 201) {
      console.log('Dean user created successfully!');
      console.log('Login with:', deanUser.email);
      console.log('Password:', password);
      return true;
    } else {
      console.log('Unexpected response:', response.status, response.data);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response.data?.message?.includes('already exists')) {
      console.log('User already exists, trying to login...');
      return await testLogin();
    } else {
      console.error('Failed to create dean user:', error.message);
      if (error.response?.data) {
        console.error('Response data:', error.response.data);
      }
      return false;
    }
  }
}

// Try to login with the dean user
async function testLogin() {
  try {
    console.log('Testing login with dean credentials...');
    
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: deanUser.email,
      password: password
    });
    
    if (response.data.token) {
      console.log('Login successful!');
      console.log('User:', response.data.user);
      return true;
    } else {
      console.log('Login response did not include token:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Login failed:', error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Main function
async function main() {
  const success = await createDeanUser();
  
  if (success) {
    console.log('\nYou can now use the dean user credentials to login:');
    console.log(`Email: ${deanUser.email}`);
    console.log(`Password: ${password}`);
    console.log('\nUse the browser-based tester at: http://localhost:3000/dean-api-tester.html');
  } else {
    console.log('\nFailed to set up dean user. Please check the server is running and try again.');
  }
}

main();
