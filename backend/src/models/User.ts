// import { model, Schema } from 'mongoose';
// import bcrypt from 'bcryptjs';

// const UserSchema = new Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   email: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   rollNumber: String,
//   password: {
//     type: String,
//     required: true
//   },
//   role: {
//     type: String,
//     enum: ['student', 'faculty', 'hod', 'dean', 'admin'],
//     default: 'student'
//   },
//   branch: {
//     type: String,
//     enum: ['MCA Regular', 'MCA DS']
//   },
//   passwordResetRequired: {
//     type: Boolean,
//     default: true // Default to true for new users
//   }
// });

// // Hash password before saving
// UserSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// export default model('User', UserSchema);

import { model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    required: true
  },
  rollNumber: {
    type: String,
    unique: true,
    sparse: true // Only enforce uniqueness for non-null values
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
  branch: {
    type: String,
    enum: ['MCA Regular', 'MCA DS']
  },
  passwordResetRequired: {
    type: Boolean,
    default: true
  }
});

// Hash password before saving - but only if it's not already hashed
UserSchema.pre('save', async function (next) {
  try {
    // Skip if password hasn't been modified
    if (!this.isModified('password')) return next();
    
    // Check if the password is already hashed (bcrypt hashes start with $2b$ or $2a$)
    if (this.password.startsWith('$2b$') || this.password.startsWith('$2a$')) {
      // Password is already hashed, don't hash it again
      console.log('Password already hashed, skipping hash for user:', this.email);
      return next();
    } 
    
    // Hash the password only if it's plain text
    console.log('Hashing plain text password for user:', this.email);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('Error in password hashing middleware:', error);
    next(error instanceof Error ? error : new Error(String(error)));
  }
});

export default model('User', UserSchema);