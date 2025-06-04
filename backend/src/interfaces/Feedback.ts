import { Document } from 'mongoose';
import { IUser } from './User';
import { ISubject } from './Subject';

export interface IFeedback extends Document {
  student: IUser['_id'];
  subject: ISubject['_id'];
  answers: {
    question: string;
    answer: number; // e.g., 1 to 5
  }[];
}