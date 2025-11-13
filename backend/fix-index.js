// Script to fix database index issue
const mongoose = require('mongoose');

async function fixDatabaseIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/student-feedback-system');
    console.log('📡 Connected to MongoDB');

    // Get the feedbacks collection
    const db = mongoose.connection.db;
    const collection = db.collection('feedbacks');

    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('📊 Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Drop the problematic index if it exists
    try {
      await collection.dropIndex({ student: 1, subject: 1, feedbackType: 1, term: 1 });
      console.log('✅ Dropped old index with term field');
    } catch (err) {
      console.log('ℹ️  Old index may not exist:', err.message);
    }

    // Create new index without term
    await collection.createIndex({ student: 1, subject: 1, feedbackType: 1 }, { unique: true });
    console.log('✅ Created new index without term field');

    // Verify new indexes
    const newIndexes = await collection.indexes();
    console.log('📊 New indexes:', newIndexes.map(idx => ({ name: idx.name, key: idx.key })));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixDatabaseIndex();