const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student_feedback')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Define models
    const User = mongoose.model('User', {
      name: String,
      email: String,
      role: String,
      branch: String,
      rollNumber: String,
      password: String,
      passwordResetRequired: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    });
    
    const Subject = mongoose.model('Subject', {
      name: String,
      code: String,
      instructor: String,
      branch: String,
      semester: String,
      year: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const Feedback = mongoose.model('Feedback', {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
      answers: [{
        question: String,
        answer: Number
      }],
      averageRating: Number,
      comment: String,
      submittedAt: { type: Date, default: Date.now }
    });
    
    const targetSubjectId = '68fa88476c656cd19f0a077d'; // Engineering Physics
    
    // Find or create a student user
    let student = await User.findOne({ role: 'student' });
    if (!student) {
      student = await User.create({
        name: 'Test Student',
        email: 'student@college.edu',
        role: 'student',
        branch: 'CSE',
        rollNumber: 'CSE001',
        password: 'hashed_password'
      });
      console.log('✅ Created test student');
    } else {
      console.log('✅ Found existing student');
    }
    
    // Create sample feedback for Engineering Physics
    const sampleFeedback = await Feedback.create({
      student: student._id,
      subject: targetSubjectId,
      answers: [
        { question: 'Teaching Quality', answer: 4 },
        { question: 'Course Content', answer: 3 },
        { question: 'Assessment Methods', answer: 4 },
        { question: 'Instructor Support', answer: 5 },
        { question: 'Overall Experience', answer: 4 }
      ],
      averageRating: 4.0,
      comment: 'Good physics course, but could be more practical.',
      submittedAt: new Date()
    });
    
    console.log(`✅ Created sample feedback for subject ${targetSubjectId}`);
    console.log(`📋 Feedback ID: ${sampleFeedback._id}`);
    console.log(`👤 Student: ${student.name}`);
    console.log(`⭐ Rating: ${sampleFeedback.averageRating}`);
    
    // Verify the data
    const feedbackCount = await Feedback.countDocuments({ subject: targetSubjectId });
    console.log(`\n📊 Total feedback for Engineering Physics: ${feedbackCount}`);
    
    mongoose.disconnect();
    console.log('\n✅ Test data creation completed');
    
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });