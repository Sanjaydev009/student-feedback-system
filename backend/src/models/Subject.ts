import { model, Schema } from 'mongoose';

const SubjectSchema = new Schema({
  name: String,
  code: String,
  instructor: String,
  department: String,
  semester: Number,
  branch: {
    type: String,
    enum: ['MCA Regular', 'MCA DS'],
    default: 'MCA Regular'
  },
  questions: [String]
});

export default model('Subject', SubjectSchema);