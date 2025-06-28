async function createAdminUser() {
  const API_BASE = 'http://localhost:5001';
  
  try {
    console.log('🔐 Creating admin user...');
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        branch: 'Admin',
        semester: 1
      })
    });
    
    const data = await response.json();
    console.log('Response:', response.status, data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminUser();
