const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student_feedback')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
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
    
    // Get all subjects
    const subjects = await Subject.find();
    console.log(`📚 Found ${subjects.length} subjects`);
    
    // Get feedback subject IDs
    const feedbacks = await Feedback.find();
    const feedbackSubjectIds = [...new Set(feedbacks.map(f => f.subject.toString()))];
    console.log(`💬 Found feedback for ${feedbackSubjectIds.length} subjects`);
    
    // Find subjects with no feedback
    const subjectsWithNoFeedback = subjects.filter(subject => 
      !feedbackSubjectIds.includes(subject._id.toString())
    );
    
    console.log(`\n📊 Subjects with NO feedback:`);
    subjectsWithNoFeedback.forEach(s => {
      console.log(`- ${s.name} (${s.code}) - ID: ${s._id}`);
    });
    
    if (subjectsWithNoFeedback.length > 0) {
      console.log(`\n🎯 Test subject for empty response: ${subjectsWithNoFeedback[0]._id}`);
    }
    
    mongoose.disconnect();
    
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });