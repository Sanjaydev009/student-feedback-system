// Script to fix the feedback database index to support separate midterm and endterm feedback
const mongoose = require('mongoose');

async function fixFeedbackIndex() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    
    // Connect to MongoDB (use the same connection string as your app)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-feedback');
    
    console.log('✅ Connected to MongoDB');
    
    // Get the feedbacks collection
    const db = mongoose.connection.db;
    const collection = db.collection('feedbacks');
    
    console.log('🔍 Checking existing indexes...');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Find the problematic index (student_1_subject_1 without feedbackType)
    const oldIndex = indexes.find(idx => 
      idx.key && 
      idx.key.student === 1 && 
      idx.key.subject === 1 && 
      !idx.key.feedbackType
    );
    
    if (oldIndex) {
      console.log('🚨 Found problematic index:', oldIndex.name);
      console.log('   Key pattern:', oldIndex.key);
      
      // Drop the old index
      console.log('🗑️  Dropping old index...');
      await collection.dropIndex(oldIndex.name);
      console.log('✅ Old index dropped successfully');
    } else {
      console.log('✅ No problematic index found');
    }
    
    // Create the correct index (student + subject + feedbackType)
    console.log('🔧 Creating new compound index with feedbackType...');
    
    try {
      await collection.createIndex(
        { student: 1, subject: 1, feedbackType: 1 }, 
        { unique: true, name: 'student_1_subject_1_feedbackType_1' }
      );
      console.log('✅ New compound index created successfully');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Correct index already exists');
      } else {
        throw error;
      }
    }
    
    // Verify the new indexes
    console.log('🔍 Verifying updated indexes...');
    const updatedIndexes = await collection.indexes();
    console.log('Updated indexes:', updatedIndexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Check for the correct index
    const correctIndex = updatedIndexes.find(idx => 
      idx.key && 
      idx.key.student === 1 && 
      idx.key.subject === 1 && 
      idx.key.feedbackType === 1
    );
    
    if (correctIndex) {
      console.log('✅ Verification successful: Correct index is in place');
      console.log('   Index name:', correctIndex.name);
      console.log('   Key pattern:', correctIndex.key);
    } else {
      console.log('❌ Verification failed: Correct index not found');
    }
    
    console.log('🎉 Database index fix completed successfully!');
    console.log('📝 Students can now submit both midterm and endterm feedback for the same subject');
    
  } catch (error) {
    console.error('❌ Error fixing feedback index:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the script if called directly
if (require.main === module) {
  fixFeedbackIndex()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = fixFeedbackIndex;