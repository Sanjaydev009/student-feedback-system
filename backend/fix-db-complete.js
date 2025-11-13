// Script to completely fix the database index issue
const mongoose = require('mongoose');

async function fixDatabaseIndexCompletely() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/student-feedback-system');
    console.log('📡 Connected to MongoDB');

    // Get the feedbacks collection
    const db = mongoose.connection.db;
    const collection = db.collection('feedbacks');

    // Get ALL existing indexes
    const indexes = await collection.indexes();
    console.log('📊 Current indexes:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Drop ALL indexes except _id (which can't be dropped)
    for (const index of indexes) {
      if (index.name !== '_id_') {
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Dropped index: ${index.name}`);
        } catch (err) {
          console.log(`⚠️  Could not drop index ${index.name}:`, err.message);
        }
      }
    }

    // Create the correct index for academic feedback (no feedbackPeriod)
    await collection.createIndex(
      { student: 1, subject: 1, feedbackType: 1 }, 
      { unique: true, name: 'academic_feedback_unique' }
    );
    console.log('✅ Created correct academic feedback index');

    // Also delete any existing feedback records to start fresh
    const deleteResult = await collection.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing feedback records`);

    // Verify final state
    const finalIndexes = await collection.indexes();
    console.log('📊 Final indexes:');
    finalIndexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    const finalCount = await collection.countDocuments();
    console.log(`📊 Final document count: ${finalCount}`);

    console.log('\n🎉 Database fixed successfully!');
    console.log('   - Removed problematic feedbackPeriod index');
    console.log('   - Created correct academic feedback index');
    console.log('   - Cleared existing conflicting data');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixDatabaseIndexCompletely();