import { Document } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  code: string;
  year: number;
  term: number;
  department: string;
  instructor: string;
  branch: string[]; // Array to support multiple branches
  sections: string[]; // Array to support multiple sections
  questions: string[];
}