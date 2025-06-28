async function testSubjectManagement() {
  const API_BASE = 'http://localhost:5001';
  let token;
  
  try {
    console.log('🔐 Testing admin login...');
    
    // Try to login with default admin credentials
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sanju.admin@gmail.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed with default credentials.');
      console.log('Please enter your admin credentials in the terminal:');
      
      // Use hardcoded credentials for testing
      const testEmail = 'admin@test.com';
      const testPassword = 'admin123';
      
      console.log(`Using test credentials: ${testEmail} / ${testPassword}`);
      
      const secondLoginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });
      
      if (!secondLoginResponse.ok) {
        console.log('❌ Login failed with test credentials.');
        return;
      }
      
      console.log('✅ Admin user created, logging in...');
      
      // Try login again
      const secondLoginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'admin123'
        })
      });
      
      const loginData = await secondLoginResponse.json();
      token = loginData.token;
    } else {
      const loginData = await loginResponse.json();
      token = loginData.token;
    }
    
    console.log('✅ Login successful');

    // Create a test subject
    console.log('\n📚 Creating a test subject...');
    const createResponse = await fetch(`${API_BASE}/api/subjects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        name: 'Test Subject for Deletion',
        code: 'TEST101',
        instructor: 'Test Instructor',
        department: 'Test Department',
        semester: 1,
        branch: 'MCA Regular',
        questions: [
          'Question 1', 'Question 2', 'Question 3', 'Question 4', 'Question 5',
          'Question 6', 'Question 7', 'Question 8', 'Question 9', 'Question 10'
        ]
      })
    });
    
    if (!createResponse.ok) {
      console.log('❌ Failed to create test subject');
      return;
    }
    
    const testSubject = await createResponse.json();
    console.log('✅ Test subject created:', testSubject.name, 'ID:', testSubject._id);

    // Get all subjects to verify
    console.log('\n📋 Fetching all subjects...');
    const subjectsResponse = await fetch(`${API_BASE}/api/subjects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!subjectsResponse.ok) {
      console.log('❌ Failed to fetch subjects');
      return;
    }
    
    const subjects = await subjectsResponse.json();
    console.log(`✅ Found ${subjects.length} subjects`);

    // Try to delete the test subject
    console.log(`\n🗑️ Attempting to delete test subject: ${testSubject.name}`);
    
    const deleteResponse = await fetch(`${API_BASE}/api/subjects/${testSubject._id}`, {
      method: 'DELETE',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      console.log('❌ Delete failed:', errorData.message);
      return;
    }
    
    const deleteData = await deleteResponse.json();
    console.log('✅ Delete response:', deleteData);
    
    // Verify deletion by fetching subjects again
    console.log('\n🔍 Verifying deletion...');
    const verifyResponse = await fetch(`${API_BASE}/api/subjects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const remainingSubjects = await verifyResponse.json();
    console.log(`✅ Remaining subjects: ${remainingSubjects.length}`);
    
    const stillExists = remainingSubjects.find(s => s._id === testSubject._id);
    if (stillExists) {
      console.log('❌ Subject still exists after deletion!');
    } else {
      console.log('✅ Subject successfully deleted from database!');
    }

  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

testSubjectManagement();
