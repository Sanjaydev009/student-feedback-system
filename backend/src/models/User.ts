import { model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'hod', 'dean', 'admin'],
    default: 'student'
  },
  rollNumber: {
    type: String,
    unique: true,
    required: function (this: any): boolean {
      return this.role === 'student';
    }
  },
  branch: {
    type: String,
    enum: ['MCA Regular', 'MCA DS'],
    validate: {
      validator: function (this: any, value: string): boolean {
        if (this.role === 'student' && !value) {
          return false;
        }
        return true;
      },
      message: 'Branch is required for students.'
    }
  }
});

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default model('User', UserSchema);