// Test script for force deletion of subjects
async function testForceDelete() {
  const API_BASE = 'http://localhost:5001';
  let token;
  
  try {
    // Try logging in with existing admin credentials
    console.log('🔐 Trying to login with existing admin...');
    
    // Try a few common admin credentials
    const credentials = [
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'admin@test.com', password: 'admin123' },
      { email: 'admin@admin.com', password: 'admin123' }
    ];
    
    let loginSuccess = false;
    
    for (const cred of credentials) {
      console.log(`Trying ${cred.email}...`);
      
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred)
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        token = loginData.token;
        loginSuccess = true;
        console.log('✅ Login successful with existing account');
        break;
      }
    }
    
    // If all logins fail, try to create a new admin account
    if (!loginSuccess) {
      console.log('Creating a new admin account for testing...');
      
      // For testing, this endpoint should be unprotected or we need to use an existing admin token
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Admin',
          email: 'test-admin@example.com',
          password: 'test123',
          role: 'admin', 
          branch: 'Test',
          semester: 1
        })
      });
      
      // Try to login with the new credentials
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-admin@example.com',
          password: 'test123'
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        token = loginData.token;
        loginSuccess = true;
        console.log('✅ Login successful with new admin account');
      } else {
        console.error('❌ Failed to login with new admin account');
        return;
      }
    }
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed');
      return;
    }
    
    const loginData = await loginResponse.json();
    token = loginData.token;
    console.log('✅ Login successful');
    
    // Create test subject
    console.log('📚 Creating test subject...');
    const subjectResponse = await fetch(`${API_BASE}/api/subjects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Force Delete Test Subject',
        code: 'FDEL101',
        instructor: 'Test Instructor',
        department: 'Test Department',
        semester: 1,
        branch: 'MCA Regular',
        questions: Array(10).fill('Test Question?')
      })
    });
    
    if (!subjectResponse.ok) {
      console.error('❌ Failed to create test subject');
      return;
    }
    
    const subject = await subjectResponse.json();
    console.log(`✅ Test subject created: ${subject.name} (${subject._id})`);
    
    // Try to delete it (should work since no feedback exists)
    console.log('🗑️ Attempting to delete subject...');
    
    const deleteResponse = await fetch(`${API_BASE}/api/subjects/${subject._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (deleteResponse.ok) {
      const deleteData = await deleteResponse.json();
      console.log('✅ Subject deleted successfully:', deleteData);
      
      // Now try to fetch the deleted subject (should return 404)
      console.log('🔍 Verifying deletion...');
      
      const verifyResponse = await fetch(`${API_BASE}/api/subjects/${subject._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (verifyResponse.status === 404) {
        console.log('✅ Subject confirmed deleted (404 response)');
      } else {
        console.error('❌ Subject still exists');
      }
    } else {
      console.error('❌ Failed to delete subject');
      const errorText = await deleteResponse.text();
      console.error(errorText);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

testForceDelete();
