#!/usr/bin/env node

const fetch = require('node-fetch');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ENDPOINTS = [
  '/api/health',
  '/',
  '/api/subjects',
  '/api/feedback/stats'
];

console.log('🏥 Backend Health Check');
console.log('=====================');
console.log(`Testing API at: ${API_URL}`);
console.log('');

async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server is healthy!');
      console.log('Response:', data);
      
      // Check CORS headers
      const corsHeader = response.headers.get('access-control-allow-origin');
      if (corsHeader) {
        console.log('✅ CORS is enabled:', corsHeader);
      } else {
        console.log('❌ CORS headers missing!');
      }
    } else {
      console.log(`❌ Server returned status ${response.status}`);
      try {
        const errorText = await response.text();
        console.log('Error:', errorText);
      } catch (e) {
        console.log('Could not read error response');
      }
    }
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    console.log('');
    console.log('⚠️  If you see a "ECONNREFUSED" error, the backend server might not be running.');
    console.log('⚠️  Make sure the backend server is started on port 5000 (or update API_URL)');
  }
}

// Run the health check
checkHealth();
