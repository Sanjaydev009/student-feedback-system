import { model, Schema } from 'mongoose';
import { IUser } from '../interfaces/User';

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  rollNumber: { type: String, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    default: 'student',
    enum: ['student', 'faculty', 'hod', 'dean', 'admin']
  }
});

export default model<IUser>('User', UserSchema);