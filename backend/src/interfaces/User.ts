import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  rollNumber?: string; // only for students
  email: string;
  password: string;
  role: 'student' | 'faculty' | 'hod' | 'dean' | 'admin';
}