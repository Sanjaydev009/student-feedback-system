const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/student-feedback');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Use the actual User schema from the TypeScript model
const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    required: true
  },
  rollNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'hod', 'dean', 'admin'],
    default: 'student'
  },
  department: {
    type: String,
    enum: ['Engineering', 'MCA', 'MBA']
  },
  branch: {
    type: String,
    enum: [
      'Computer Science', 
      'Electronics', 
      'Mechanical', 
      'Civil', 
      'Electrical',
      'Information Technology',
      'Chemical',
      'Aerospace',
      'Biotechnology',
      'MCA Regular', 
      'MCA DS',
      'MBA Finance',
      'MBA Marketing',
      'MBA HR'
    ]
  },
  year: {
    type: Number,
    enum: [1, 2, 3, 4]
  },
  passwordResetRequired: {
    type: Boolean,
    default: true
  }
});

// Hash password before saving - same as TypeScript model
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    
    if (this.password.startsWith('$2b$') || this.password.startsWith('$2a$')) {
      console.log('Password already hashed, skipping hash for user:', this.email);
      return next();
    } 
    
    console.log('Hashing plain text password for user:', this.email);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('Error in password hashing middleware:', error);
    next(error instanceof Error ? error : new Error(String(error)));
  }
});

const User = mongoose.model('User', userSchema);

const createDeanUser = async () => {
  try {
    await connectDB();
    
    // Check if dean already exists
    const existingDean = await User.findOne({ email: 'dean@college.edu' });
    if (existingDean) {
      console.log('Dean user already exists');
      console.log('Email: dean@college.edu');
      console.log('Password: dean123');
      process.exit(0);
    }
    
    // Create dean user - let the pre-save middleware handle password hashing
    const deanUser = new User({
      name: 'Dean Admin',
      email: 'dean@college.edu',
      password: 'dean123', // Plain text - will be hashed by middleware
      role: 'dean',
      department: 'Engineering',
      passwordResetRequired: true
    });
    
    await deanUser.save();
    console.log('Dean user created successfully');
    console.log('Email: dean@college.edu');
    console.log('Password: dean123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating dean user:', error);
    process.exit(1);
  }
};

createDeanUser();
