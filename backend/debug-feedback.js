const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student_feedback')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Query subjects
    const Subject = mongoose.model('Subject', {
      name: String,
      code: String,
      instructor: String,
      branch: String,
      semester: String,
      year: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    // Query feedback
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
    
    // Get counts
    Promise.all([
      Subject.countDocuments(),
      Feedback.countDocuments(),
      Subject.find().limit(5),
      Feedback.find().limit(5)
    ]).then(([subjectCount, feedbackCount, subjects, feedbacks]) => {
      console.log(`\n📊 Database Status:`);
      console.log(`Subjects: ${subjectCount}`);
      console.log(`Feedback: ${feedbackCount}`);
      
      console.log(`\n📚 Sample Subjects:`);
      subjects.forEach(s => console.log(`- ${s.name} (${s.code}) - ID: ${s._id}`));
      
      console.log(`\n💬 Sample Feedback:`);
      feedbacks.forEach(f => console.log(`- Subject: ${f.subject}, Rating: ${f.averageRating}, ID: ${f._id}`));
      
      mongoose.disconnect();
    }).catch(err => {
      console.error('❌ Error querying database:', err);
      mongoose.disconnect();
    });
    
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });