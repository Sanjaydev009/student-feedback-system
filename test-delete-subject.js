async function testSubjectDeletion() {
  const API_BASE = 'http://localhost:5001';
  let token;
  
  try {
    // Try multiple admin credentials
    const adminCredentials = [
      { email: 'admin@test.com', password: 'admin123' },
      { email: 'admin@example.com', password: 'admin123' }
    ];
    
    let loginSuccess = false;
    
    // Try each credential set
    for (const creds of adminCredentials) {
      console.log(`🔐 Trying to login as admin (${creds.email})...`);
      
      try {
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: creds.email,
            password: creds.password
          })
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          token = loginData.token;
          loginSuccess = true;
          console.log(`✅ Login successful with ${creds.email}`);
          break;
        } else {
          console.log(`❌ Login failed with ${creds.email}`);
        }
      } catch (error) {
        console.log(`❌ Error trying ${creds.email}: ${error.message}`);
      }
    }
    
    if (!loginSuccess) {
      console.error("❌ Could not login with any admin credentials");
      
      // Try to register a new admin user
      console.log("🔐 Attempting to create new admin user...");
      
      try {
        const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Admin',
            email: 'admin123@test.com',
            password: 'admin123',
            role: 'admin',
            branch: 'Admin',
            semester: 1
          })
        });
        
        if (registerResponse.ok) {
          console.log("✅ Created new admin user, logging in...");
          
          const newLoginResponse = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'admin123@test.com',
              password: 'admin123'
            })
          });
          
          if (newLoginResponse.ok) {
            const loginData = await newLoginResponse.json();
            token = loginData.token;
            loginSuccess = true;
          } else {
            console.error("❌ Failed to login with new admin");
            return;
          }
        } else {
          console.error("❌ Failed to create new admin");
          return;
        }
      } catch (error) {
        console.error("❌ Error during admin creation:", error.message);
        return;
      }
    }
    console.log('✅ Login successful');

    // Create a test subject
    console.log('\n� Creating a test subject...');
    
    const testSubject = {
      name: `Test Subject ${Date.now()}`,
      code: `TEST-${Math.floor(Math.random() * 1000)}`,
      instructor: 'Test Instructor',
      department: 'Test Department',
      semester: 1,
      branch: 'MCA Regular',
      questions: [
        'Question 1?', 'Question 2?', 'Question 3?', 'Question 4?', 'Question 5?',
        'Question 6?', 'Question 7?', 'Question 8?', 'Question 9?', 'Question 10?'
      ]
    };
    
    const createResponse = await fetch(`${API_BASE}/api/subjects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testSubject)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`❌ Failed to create test subject: ${errorText}`);
      return;
    }
    
    const createdSubject = await createResponse.json();
    console.log(`✅ Test subject created: ${createdSubject.name} (ID: ${createdSubject._id})`);

    // Try to delete the test subject
    console.log(`\n🗑️ Attempting to delete subject: ${createdSubject.name} (ID: ${createdSubject._id})`);
    
    const deleteResponse = await fetch(`${API_BASE}/api/subjects/${createdSubject._id}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Delete response status: ${deleteResponse.status}`);
    
    if (!deleteResponse.ok) {
      let errorMessage;
      try {
        const errorData = await deleteResponse.json();
        errorMessage = errorData.message || 'Unknown error';
      } catch (e) {
        errorMessage = await deleteResponse.text();
      }
      console.error(`❌ Delete failed: ${errorMessage}`);
      return;
    }
    
    const deleteData = await deleteResponse.json();
    console.log('✅ Delete response:', deleteData);
    
    // Verify deletion
    console.log('\n🔍 Verifying deletion...');
    const verifyResponse = await fetch(`${API_BASE}/api/subjects/${createdSubject._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (verifyResponse.status === 404) {
      console.log('✅ Subject successfully deleted! (404 Not Found response)');
    } else {
      console.error('❌ Subject still exists after deletion!');
    }

  } catch (error) {
    console.error('❌ Error during test:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
  }
}

testSubjectDeletion();
