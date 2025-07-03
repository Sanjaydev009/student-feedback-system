// Create feedback test data
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/student-feedback');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Generate sample feedback data
const generateFeedbackData = async () => {
  try {
    await connectDB();

    // Create Subject Schema
    const SubjectSchema = new mongoose.Schema({
      name: String,
      code: String,
      instructor: String,
      department: String,
      year: Number,
      term: Number,
      branch: [String],
      questions: [String]
    });
    
    const Subject = mongoose.model('Subject', SubjectSchema);
    
    // Create User Schema
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      department: String,
      branch: String,
      year: Number,
      rollNumber: String
    });
    
    const User = mongoose.model('User', UserSchema);

    // Create Feedback Schema
    const FeedbackSchema = new mongoose.Schema({
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
      ratings: {
        teachingQuality: Number,
        courseContent: Number,
        preparation: Number,
        interaction: Number,
        overall: Number
      },
      comments: String,
      isAnonymous: Boolean,
      submittedAt: Date
    });
    
    const Feedback = mongoose.model('Feedback', FeedbackSchema);

    // Create subjects if they don't exist
    const subjects = [
      {
        name: 'Data Structures',
        code: 'CS101',
        instructor: 'Dr. Smith',
        department: 'Engineering',
        year: 1,
        term: 1,
        branch: ['Computer Science', 'MCA DS']
      },
      {
        name: 'Database Systems',
        code: 'CS201',
        instructor: 'Dr. Johnson',
        department: 'Engineering',
        year: 2,
        term: 1,
        branch: ['Computer Science', 'MCA Regular']
      },
      {
        name: 'Machine Learning',
        code: 'DS301',
        instructor: 'Prof. Williams',
        department: 'Engineering',
        year: 3,
        term: 2,
        branch: ['Computer Science', 'MCA DS']
      }
    ];

    // Create or find subjects
    const createdSubjects = [];
    for (const subjectData of subjects) {
      let subject = await Subject.findOne({ code: subjectData.code });
      if (!subject) {
        subject = await Subject.create(subjectData);
        console.log(`Created subject: ${subject.name}`);
      } else {
        console.log(`Subject exists: ${subject.name}`);
      }
      createdSubjects.push(subject);
    }

    // Create students if they don't exist
    const students = [
      {
        name: 'Student 1',
        email: 'student1@college.edu',
        password: await bcrypt.hash('student123', 10),
        role: 'student',
        department: 'Engineering',
        branch: 'MCA DS',
        year: 1,
        rollNumber: '232P4R0001'
      },
      {
        name: 'Student 2',
        email: 'student2@college.edu',
        password: await bcrypt.hash('student123', 10),
        role: 'student',
        department: 'Engineering',
        branch: 'MCA DS',
        year: 2,
        rollNumber: '232P4R0002'
      },
      {
        name: 'Student 3',
        email: 'student3@college.edu',
        password: await bcrypt.hash('student123', 10),
        role: 'student',
        department: 'Engineering',
        branch: 'MCA Regular',
        year: 3,
        rollNumber: '232P4R0003'
      }
    ];

    // Create or find students
    const createdStudents = [];
    for (const studentData of students) {
      let student = await User.findOne({ email: studentData.email });
      if (!student) {
        student = await User.create(studentData);
        console.log(`Created student: ${student.name}`);
      } else {
        console.log(`Student exists: ${student.name}`);
      }
      createdStudents.push(student);
    }

    // Delete existing feedbacks
    await Feedback.deleteMany({});
    console.log('Deleted existing feedback data');

    // Create feedbacks
    const feedbacks = [
      {
        student: createdStudents[0]._id,
        subject: createdSubjects[0]._id,
        ratings: {
          teachingQuality: 4,
          courseContent: 5,
          preparation: 4,
          interaction: 4,
          overall: 4
        },
        comments: 'Great course!',
        isAnonymous: false,
        submittedAt: new Date()
      },
      {
        student: createdStudents[1]._id,
        subject: createdSubjects[0]._id,
        ratings: {
          teachingQuality: 5,
          courseContent: 4,
          preparation: 5,
          interaction: 5,
          overall: 5
        },
        comments: 'Excellent teaching!',
        isAnonymous: true,
        submittedAt: new Date()
      },
      {
        student: createdStudents[0]._id,
        subject: createdSubjects[1]._id,
        ratings: {
          teachingQuality: 3,
          courseContent: 4,
          preparation: 3,
          interaction: 4,
          overall: 3
        },
        comments: 'Good content but needs more examples',
        isAnonymous: false,
        submittedAt: new Date()
      },
      {
        student: createdStudents[2]._id,
        subject: createdSubjects[2]._id,
        ratings: {
          teachingQuality: 5,
          courseContent: 5,
          preparation: 5,
          interaction: 4,
          overall: 5
        },
        comments: 'One of the best courses!',
        isAnonymous: false,
        submittedAt: new Date()
      },
      {
        student: createdStudents[1]._id,
        subject: createdSubjects[2]._id,
        ratings: {
          teachingQuality: 4,
          courseContent: 3,
          preparation: 4,
          interaction: 4,
          overall: 4
        },
        comments: 'Very informative',
        isAnonymous: true,
        submittedAt: new Date()
      }
    ];

    // Create feedbacks
    for (const feedbackData of feedbacks) {
      const feedback = await Feedback.create(feedbackData);
      console.log(`Created feedback for ${feedback.subject}`);
    }

    console.log('Test data generated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error generating test data:', error);
    process.exit(1);
  }
};

generateFeedbackData();
