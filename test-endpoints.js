const axios = require('axios');

async function testEndpoint(url, method = 'get', data = null) {
  const baseUrl = 'http://localhost:5001';
  const fullUrl = baseUrl + url;
  
  try {
    const options = {
      timeout: 5000,
      headers: {
        'Authorization': 'Bearer test-token', // This will fail auth but shows endpoint exists
        'Content-Type': 'application/json'
      }
    };
    
    let response;
    if (method.toLowerCase() === 'get') {
      response = await axios.get(fullUrl, options);
    } else if (method.toLowerCase() === 'post') {
      response = await axios.post(fullUrl, data, options);
    } else if (method.toLowerCase() === 'put') {
      response = await axios.put(fullUrl, data, options);
    } else if (method.toLowerCase() === 'delete') {
      response = await axios.delete(fullUrl, options);
    }
    
    console.log(`✅ ${method.toUpperCase()} ${url} endpoint exists and returned status ${response.status}`);
    return true;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        console.log(`✅ ${method.toUpperCase()} ${url} endpoint exists (401 is expected without auth)`);
        return true;
      } else if (error.response.status === 404) {
        console.log(`❌ ${method.toUpperCase()} ${url} endpoint NOT FOUND`);
        return false;
      } else {
        console.log(`✅ ${method.toUpperCase()} ${url} endpoint exists but returned status ${error.response.status}`);
        return true;
      }
    } else {
      console.log(`❌ Error with ${method.toUpperCase()} ${url}:`, error.message);
      return false;
    }
  }
}

async function testEndpoints() {
  console.log('🔍 Testing backend endpoints for student feedback system...');
  console.log('=====================================================');
  
  // Dashboard endpoints
  console.log('\n📊 Dashboard Endpoints:');
  await testEndpoint('/api/feedback/stats');
  await testEndpoint('/api/feedback/recent');
  await testEndpoint('/api/feedback/activities');
  
  // Reports endpoints
  console.log('\n📈 Reports Endpoints:');
  await testEndpoint('/api/feedback/reports');
  await testEndpoint('/api/feedback/summary/123456'); // Test with a dummy ID
  
  // Subject endpoints
  console.log('\n📚 Subject Endpoints:');
  await testEndpoint('/api/subjects');
  await testEndpoint('/api/subjects/123456');
  await testEndpoint('/api/subjects', 'post', { name: 'Test Subject', code: 'TEST101', instructor: 'John Doe' });
  await testEndpoint('/api/subjects/123456', 'put', { name: 'Updated Test Subject' });
  await testEndpoint('/api/subjects/123456', 'delete');
  
  // User management endpoints
  console.log('\n👥 User Management Endpoints:');
  await testEndpoint('/api/auth/users');
  await testEndpoint('/api/auth/users/123456');
  await testEndpoint('/api/auth/register', 'post', { name: 'Test User', email: 'test@example.com', password: 'password123' });
  await testEndpoint('/api/auth/register/bulk', 'post', { students: [{ name: 'Student 1', email: 'student1@example.com', rollNumber: 'R001' }] });
  await testEndpoint('/api/auth/users/123456', 'delete');
  
  // Analytics endpoints
  console.log('\n📊 Analytics Endpoints:');
  await testEndpoint('/api/admin/analytics');
  
  // Settings endpoints
  console.log('\n⚙️ Settings Endpoints:');
  await testEndpoint('/api/admin/settings');
  await testEndpoint('/api/admin/settings', 'put', { feedbackPeriodStart: '2023-11-01', feedbackPeriodEnd: '2023-11-30' });
  
  console.log('\n✅ Endpoint testing completed!');
}

testEndpoints();
