import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  rollNumber?: string; // only for students
  email: string;
  password: string;
  role: 'student' | 'faculty' | 'hod' | 'dean' | 'admin';
  department?: string;
  branch?: string;
  year?: number; // for students
  passwordResetRequired?: boolean;
}