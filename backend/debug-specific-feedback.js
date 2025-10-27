const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student_feedback')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
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
    
    const targetSubjectId = '68fa88476c656cd19f0a077d';
    console.log(`\n🔍 Searching for feedback with subject ID: ${targetSubjectId}`);
    
    Feedback.find({ subject: targetSubjectId }).then(feedbacks => {
      console.log(`Found ${feedbacks.length} feedback records for subject ${targetSubjectId}`);
      
      if (feedbacks.length > 0) {
        console.log('📋 Feedback details:');
        feedbacks.forEach((f, i) => {
          console.log(`${i+1}. Rating: ${f.averageRating}, Answers: ${f.answers.length}, ID: ${f._id}`);
        });
      } else {
        console.log('❌ No feedback found for this subject');
        
        // Let's check all feedback to see subject IDs
        Feedback.find().then(allFeedback => {
          console.log('\n📋 All feedback subject IDs:');
          const subjectIds = [...new Set(allFeedback.map(f => f.subject.toString()))];
          subjectIds.forEach(id => {
            const count = allFeedback.filter(f => f.subject.toString() === id).length;
            console.log(`- ${id}: ${count} feedback(s)`);
          });
          mongoose.disconnect();
        });
      }
      
      if (feedbacks.length > 0) {
        mongoose.disconnect();
      }
    }).catch(err => {
      console.error('❌ Error querying feedback:', err);
      mongoose.disconnect();
    });
    
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });