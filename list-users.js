// Script to create a dean user
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
require('dotenv').config({ path: './backend/.env' });

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-feedback-system')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import the User model
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty', 'hod', 'dean', 'admin'], required: true },
  branch: { type: String },
  year: { type: Number },
  rollNumber: { type: String },
  department: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

const listUsers = async () => {
  try {
    // Find users with role 'dean'
    const deanUsers = await User.find({ role: 'dean' }).select('name email role');
    console.log('Dean users:', deanUsers);
    
    // Get one of each role
    const roles = ['student', 'faculty', 'hod', 'dean', 'admin'];
    for (const role of roles) {
      const user = await User.findOne({ role }).select('name email role');
      console.log(`Sample ${role} user:`, user ? user : 'None found');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error listing users:', error);
    mongoose.connection.close();
  }
};

listUsers();
