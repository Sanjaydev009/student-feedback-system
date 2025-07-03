const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/student-feedback-system');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const testLogin = async () => {
  try {
    await connectDB();
    
    const email = 'dean@college.edu';
    const password = 'dean123';
    
    console.log('Testing login for:', email);
    
    // Find user
    const users = await mongoose.connection.db.collection('users').find({email: email}).toArray();
    console.log('Found users:', users.length);
    
    if (users.length > 0) {
      const user = users[0];
      console.log('User data:', {
        email: user.email,
        role: user.role,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      });
      
      // Test password comparison
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password comparison result:', isMatch);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testLogin();
