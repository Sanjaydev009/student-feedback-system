import { model, Schema } from 'mongoose';

interface ISubject {
  name: string;
  code: string;
  semester: number;
  department: string;
  instructor: string;
  questions: string[];
}

const SubjectSchema = new Schema<ISubject>({
  name: { type: String, required: true },
  code: { type: String, required: true },
  semester: { type: Number, required: true },
  department: { type: String, required: true },
  instructor: { type: String, required: true },
  questions: { type: [String], required: true }
});

export default model('Subject', SubjectSchema);