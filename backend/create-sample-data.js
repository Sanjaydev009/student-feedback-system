const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feedback-system')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schemas (simplified for testing)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  rollNumber: String,
  role: { type: String, default: 'student' },
  branch: String,
  section: String,
  year: Number,
  password: String,
  createdAt: { type: Date, default: Date.now }
});

const subjectSchema = new mongoose.Schema({
  name: String,
  code: String,
  instructor: String,
  department: String,
  year: Number,
  term: Number,
  branch: [String],
  sections: [String],
  questions: [String],
  createdAt: { type: Date, default: Date.now }
});

const feedbackSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  feedbackType: { type: String, default: 'midterm' },
  term: { type: Number, default: 1 },
  academicYear: { type: String, default: '2024-25' },
  answers: [{
    question: String,
    answer: Number,
    type: { type: String, enum: ['rating', 'comment'] },
    comment: String,
    category: String
  }],
  averageRating: Number,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Subject = mongoose.model('Subject', subjectSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);

const createSampleData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Feedback.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@university.edu',
      role: 'admin',
      password: 'hashedpassword'
    });

    // Create sample students
    const students = await User.create([
      {
        name: 'John Doe',
        email: 'john@student.edu',
        rollNumber: 'CS001',
        role: 'student',
        branch: 'CSE',
        section: 'A',
        year: 3,
        password: 'hashedpassword'
      },
      {
        name: 'Jane Smith',
        email: 'jane@student.edu',
        rollNumber: 'CS002',
        role: 'student',
        branch: 'CSE',
        section: 'A',
        year: 3,
        password: 'hashedpassword'
      },
      {
        name: 'Bob Johnson',
        email: 'bob@student.edu',
        rollNumber: 'CS003',
        role: 'student',
        branch: 'CSE',
        section: 'B',
        year: 3,
        password: 'hashedpassword'
      }
    ]);

    // Create sample subjects
    const subjects = await Subject.create([
      {
        name: 'Advanced Database Systems',
        code: 'CS301',
        instructor: 'Dr. Smith',
        department: 'Computer Science & Engineering',
        year: 3,
        term: 1,
        branch: ['CSE'],
        sections: ['A', 'B'],
        questions: [
          'How would you rate the teaching methodology for this subject?',
          'How effective were the lectures in explaining complex concepts?',
          'How well did the instructor respond to student questions?',
          'How well-organized was the course material?',
          'How accessible was the instructor outside of class hours?',
          'How fair were the assignments and exams for this subject?',
          'How useful were the practical exercises or lab sessions?',
          'How relevant was the course content to real-world applications?'
        ]
      },
      {
        name: 'Machine Learning Fundamentals',
        code: 'CS302',
        instructor: 'Dr. Johnson',
        department: 'Computer Science & Engineering',
        year: 3,
        term: 1,
        branch: ['CSE', 'AIML'],
        sections: ['A', 'B'],
        questions: [
          'How would you rate the teaching methodology for this subject?',
          'How effective were the lectures in explaining complex concepts?',
          'How well did the instructor respond to student questions?',
          'How well-organized was the course material?',
          'How accessible was the instructor outside of class hours?',
          'How fair were the assignments and exams for this subject?',
          'How useful were the practical exercises or lab sessions?',
          'How relevant was the course content to real-world applications?'
        ]
      },
      {
        name: 'Data Structures and Algorithms',
        code: 'CS201',
        instructor: 'Prof. Williams',
        department: 'Computer Science & Engineering',
        year: 2,
        term: 1,
        branch: ['CSE', 'DS'],
        sections: ['A', 'B', 'C'],
        questions: [
          'How would you rate the teaching methodology for this subject?',
          'How effective were the lectures in explaining complex concepts?',
          'How well did the instructor respond to student questions?',
          'How well-organized was the course material?',
          'How accessible was the instructor outside of class hours?',
          'How fair were the assignments and exams for this subject?',
          'How useful were the practical exercises or lab sessions?',
          'How relevant was the course content to real-world applications?'
        ]
      }
    ]);

    // Create sample feedback for first subject (CS301 - Advanced Database Systems)
    const feedbacks = await Feedback.create([
      {
        student: students[0]._id,
        subject: subjects[0]._id,
        feedbackType: 'midterm',
        answers: [
          { question: 'How would you rate the teaching methodology?', answer: 4, type: 'rating', category: 'Teaching Quality' },
          { question: 'How effective were the lectures?', answer: 5, type: 'rating', category: 'Teaching Quality' },
          { question: 'How well did instructor respond to questions?', answer: 4, type: 'rating', category: 'Faculty Engagement' },
          { question: 'How well-organized was the course material?', answer: 4, type: 'rating', category: 'Course Delivery' },
          { question: 'How accessible was the instructor?', answer: 3, type: 'rating', category: 'Faculty Engagement' },
          { question: 'How fair were assignments and exams?', answer: 4, type: 'rating', category: 'Course Delivery' },
          { question: 'How useful were practical exercises?', answer: 5, type: 'rating', category: 'Teaching Quality' },
          { question: 'How relevant was the course content?', answer: 4, type: 'rating', category: 'Teaching Quality' },
          { question: 'Any suggestions for improvement?', comment: 'More practical examples would be helpful', type: 'comment', category: 'Comments' },
          { question: 'Additional comments?', comment: 'Overall excellent course structure', type: 'comment', category: 'Comments' }
        ],
        averageRating: 4.1
      },
      {
        student: students[1]._id,
        subject: subjects[0]._id,
        feedbackType: 'midterm',
        answers: [
          { question: 'How would you rate the teaching methodology?', answer: 5, type: 'rating', category: 'Teaching Quality' },
          { question: 'How effective were the lectures?', answer: 4, type: 'rating', category: 'Teaching Quality' },
          { question: 'How well did instructor respond to questions?', answer: 5, type: 'rating', category: 'Faculty Engagement' },
          { question: 'How well-organized was the course material?', answer: 5, type: 'rating', category: 'Course Delivery' },
          { question: 'How accessible was the instructor?', answer: 4, type: 'rating', category: 'Faculty Engagement' },
          { question: 'How fair were assignments and exams?', answer: 3, type: 'rating', category: 'Course Delivery' },
          { question: 'How useful were practical exercises?', answer: 4, type: 'rating', category: 'Teaching Quality' },
          { question: 'How relevant was the course content?', answer: 5, type: 'rating', category: 'Teaching Quality' },
          { question: 'Any suggestions for improvement?', comment: 'Could use more interactive sessions', type: 'comment', category: 'Comments' },
          { question: 'Additional comments?', comment: 'Great instructor, very knowledgeable', type: 'comment', category: 'Comments' }
        ],
        averageRating: 4.4
      }
    ]);

    // Create one feedback for second subject (endterm)
    await Feedback.create({
      student: students[0]._id,
      subject: subjects[1]._id,
      feedbackType: 'endterm',
      answers: [
        { question: 'How would you rate the teaching methodology?', answer: 3, type: 'rating', category: 'Teaching Quality' },
        { question: 'How effective were the lectures?', answer: 4, type: 'rating', category: 'Teaching Quality' },
        { question: 'How well did instructor respond to questions?', answer: 3, type: 'rating', category: 'Faculty Engagement' },
        { question: 'How well-organized was the course material?', answer: 4, type: 'rating', category: 'Course Delivery' },
        { question: 'How accessible was the instructor?', answer: 3, type: 'rating', category: 'Faculty Engagement' },
        { question: 'How fair were assignments and exams?', answer: 4, type: 'rating', category: 'Course Delivery' },
        { question: 'How useful were practical exercises?', answer: 3, type: 'rating', category: 'Teaching Quality' },
        { question: 'How relevant was the course content?', answer: 4, type: 'rating', category: 'Teaching Quality' },
        { question: 'Any suggestions for improvement?', comment: 'Need more hands-on machine learning projects', type: 'comment', category: 'Comments' },
        { question: 'Additional comments?', comment: 'Course content was good but delivery could be improved', type: 'comment', category: 'Comments' }
      ],
      averageRating: 3.5
    });

    console.log('✅ Sample data created successfully!');
    console.log('- Created', students.length, 'students');
    console.log('- Created', subjects.length, 'subjects');
    console.log('- Created 3 feedback records');
    console.log('\nSubjects:');
    subjects.forEach(s => console.log(`  - ${s.name} (${s.code}) - ${s.instructor}`));
    
    console.log('\nFeedback status:');
    console.log(`  - ${subjects[0].name}: 2 midterm feedback`);
    console.log(`  - ${subjects[1].name}: 1 endterm feedback`);
    console.log(`  - ${subjects[2].name}: No feedback yet`);

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    process.exit(0);
  }
};

createSampleData();