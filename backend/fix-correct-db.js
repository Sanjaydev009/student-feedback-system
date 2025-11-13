// Script to fix the correct database (student-feedback instead of student-feedback-system)
const mongoose = require('mongoose');

async function fixCorrectDatabase() {
  try {
    // Connect to the CORRECT database (student-feedback)
    await mongoose.connect('mongodb://localhost:27017/student-feedback');
    console.log('📡 Connected to MongoDB (student-feedback database)');

    const db = mongoose.connection.db;
    const collection = db.collection('feedbacks');

    // Get ALL existing indexes
    const indexes = await collection.indexes();
    console.log('📊 Current indexes in student-feedback database:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`);
    });

    // Drop the problematic feedbackPeriod index
    try {
      await collection.dropIndex('student_1_feedbackPeriod_1');
      console.log('✅ Dropped problematic index: student_1_feedbackPeriod_1');
    } catch (err) {
      console.log('⚠️  Could not drop index student_1_feedbackPeriod_1:', err.message);
    }

    // Drop any other problematic indexes
    for (const index of indexes) {
      if (index.name !== '_id_' && index.name.includes('feedbackPeriod')) {
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Dropped feedbackPeriod index: ${index.name}`);
        } catch (err) {
          console.log(`⚠️  Could not drop index ${index.name}:`, err.message);
        }
      }
    }

    // Create the correct index for academic feedback
    try {
      await collection.createIndex(
        { student: 1, subject: 1, feedbackType: 1 }, 
        { unique: true, name: 'academic_feedback_unique' }
      );
      console.log('✅ Created correct academic feedback index');
    } catch (err) {
      console.log('⚠️  Could not create new index:', err.message);
    }

    // Check document count and show existing docs
    const count = await collection.countDocuments();
    console.log(`\n📊 Total documents: ${count}`);

    if (count > 0) {
      const docs = await collection.find({}).toArray();
      console.log('\n📄 Existing documents:');
      docs.forEach((doc, i) => {
        console.log(`   ${i + 1}. Student: ${doc.student}, Subject: ${doc.subject}, Type: ${doc.feedbackType}, Term: ${doc.term}, ID: ${doc._id}`);
      });
    }

    // Verify final state
    const finalIndexes = await collection.indexes();
    console.log('\n📊 Final indexes:');
    finalIndexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`);
    });

    console.log('\n🎉 Database fixed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixCorrectDatabase();