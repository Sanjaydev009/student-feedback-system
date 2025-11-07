const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define User Schema (simplified)
const UserSchema = new mongoose.Schema({
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
    enum: ['student', 'faculty', 'hod', 'admin'],
    default: 'student'
  },
  department: {
    type: String,
    enum: ['Engineering', 'MCA', 'MBA']
  },
  branch: {
    type: String,
    enum: [
      'CSE', 'AIML', 'DS', 'Computer Science', 'Electronics', 'Mechanical', 
      'Civil', 'Electrical', 'Information Technology', 'Chemical',
      'Aerospace', 'Biotechnology', 'MCA Regular', 'MCA DS',
      'MBA Finance', 'MBA Marketing', 'MBA HR'
    ]
  },
  year: {
    type: Number,
    enum: [1, 2, 3, 4]
  },
  section: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E', 'F'],
    default: 'A'
  },
  passwordResetRequired: {
    type: Boolean,
    default: true
  }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    
    if (this.password.startsWith('$2b$') || this.password.startsWith('$2a$')) {
      return next();
    }
    
    console.log('Hashing password for user:', this.email);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

async function initializeAdmin() {
  try {
    // Connect to MongoDB (use the same connection string from your environment)
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://your-connection-string';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', UserSchema);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('❌ Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    console.log('Creating admin user...');
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      passwordResetRequired: false
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the script
initializeAdmin();