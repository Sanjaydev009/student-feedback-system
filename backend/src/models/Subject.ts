import { model, Schema } from 'mongoose';

const SubjectSchema = new Schema({
  name: String,
  code: String,
  instructor: String,
  department: {
    type: String,
    enum: [
      'Computer Science & Engineering',
      'Data Science',
      'Artificial Intelligence & Machine Learning',
      'Master of Computer Applications'
    ],
    required: true
  },
  year: {
    type: Number,
    enum: [1, 2, 3, 4],
    required: true
  },
  term: {
    type: Number,
    enum: [1, 2, 3, 4],
    required: true
  },
  branch: {
    type: [String], // Array to support multiple branches
    enum: [
      'Computer Science', 
      'Electronics', 
      'Mechanical', 
      'Civil', 
      'Electrical',
      'Information Technology',
      'Chemical',
      'Aerospace',
      'Biotechnology',
      'MCA Regular', 
      'MCA DS',
      'CSE',
      'DS', 
      'AIML'
    ],
    default: ['Computer Science']
  },
  sections: {
    type: [String], // Array to support multiple sections
    enum: ['A', 'B', 'C', 'D', 'E', 'F'],
    default: []
  },
  questions: [String]
});

export default model('Subject', SubjectSchema);