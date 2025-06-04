import { Document } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  code: string;
  semester: number;
  department: string;
  instructor: string;
  questions: string[];
}