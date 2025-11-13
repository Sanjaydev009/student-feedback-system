// Script to check and clean up existing feedback records
const mongoose = require('mongoose');

async function checkFeedbackRecords() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/student-feedback-system');
    console.log('📡 Connected to MongoDB');

    // Get the feedbacks collection
    const db = mongoose.connection.db;
    const collection = db.collection('feedbacks');

    // Count total feedback records
    const count = await collection.countDocuments();
    console.log(`📊 Total feedback records: ${count}`);

    if (count > 0) {
      // Get all feedback records
      const feedbacks = await collection.find({}).toArray();
      
      console.log('\n📋 All existing feedback records:');
      feedbacks.forEach((fb, index) => {
        console.log(`  ${index + 1}. Student: ${fb.student}, Subject: ${fb.subject}, Type: ${fb.feedbackType}, Term: ${fb.term}, Year: ${fb.academicYear}, Created: ${fb.createdAt}`);
      });

      // Group by student to see potential conflicts
      const byStudent = {};
      feedbacks.forEach(fb => {
        if (!byStudent[fb.student]) byStudent[fb.student] = [];
        byStudent[fb.student].push(fb);
      });

      console.log('\n👥 Feedback by student:');
      Object.entries(byStudent).forEach(([studentId, studentFeedbacks]) => {
        console.log(`  Student ${studentId}: ${studentFeedbacks.length} feedback(s)`);
        studentFeedbacks.forEach(fb => {
          console.log(`    - Subject: ${fb.subject}, Type: ${fb.feedbackType}, Term: ${fb.term}`);
        });
      });

      // Check for potential duplicates (same student + subject + feedbackType)
      console.log('\n🔍 Checking for potential duplicates...');
      const duplicates = [];
      for (let i = 0; i < feedbacks.length; i++) {
        for (let j = i + 1; j < feedbacks.length; j++) {
          const fb1 = feedbacks[i];
          const fb2 = feedbacks[j];
          if (fb1.student.toString() === fb2.student.toString() && 
              fb1.subject.toString() === fb2.subject.toString() && 
              fb1.feedbackType === fb2.feedbackType) {
            duplicates.push({ fb1, fb2 });
          }
        }
      }

      if (duplicates.length > 0) {
        console.log(`🚨 Found ${duplicates.length} potential duplicate(s):`);
        duplicates.forEach((dup, index) => {
          console.log(`  ${index + 1}. Same student+subject+type:`);
          console.log(`    - Record 1: ${dup.fb1._id} (${dup.fb1.createdAt})`);
          console.log(`    - Record 2: ${dup.fb2._id} (${dup.fb2.createdAt})`);
        });
      } else {
        console.log('✅ No duplicates found');
      }
    }

    // Ask if user wants to clear all feedback (for testing)
    console.log('\n🗑️  To clear all feedback for testing, run:');
    console.log('   node -e "require(\'mongoose\').connect(\'mongodb://localhost:27017/student-feedback-system\').then(() => require(\'mongoose\').connection.db.collection(\'feedbacks\').deleteMany({})).then(() => { console.log(\'✅ All feedback cleared\'); process.exit(0); })"');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkFeedbackRecords();