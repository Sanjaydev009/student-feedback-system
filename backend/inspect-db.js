// Script to inspect the current state and find the source of feedbackPeriod
const mongoose = require('mongoose');

async function inspectDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/student-feedback-system');
    console.log('📡 Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📊 All collections in database:');
    collections.forEach(col => {
      console.log(`   - ${col.name} (type: ${col.type})`);
    });

    // Check the feedbacks collection specifically
    const collection = db.collection('feedbacks');
    
    // Get current indexes
    const indexes = await collection.indexes();
    console.log('\n📊 Current feedbacks collection indexes:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`);
    });

    // Check if there are any documents
    const count = await collection.countDocuments();
    console.log(`\n📊 Total documents in feedbacks: ${count}`);

    if (count > 0) {
      const docs = await collection.find({}).limit(5).toArray();
      console.log('\n📄 Sample documents:');
      docs.forEach((doc, i) => {
        console.log(`   ${i + 1}. ${JSON.stringify(doc, null, 2)}`);
      });
    }

    // Try to create a test document to see what happens
    console.log('\n🧪 Testing document creation...');
    try {
      const testDoc = {
        student: new mongoose.Types.ObjectId(),
        subject: new mongoose.Types.ObjectId(),
        feedbackType: 'midterm',
        term: 1,
        academicYear: '2025-26',
        answers: [],
        comments: {},
        averageRating: 0
      };
      
      const result = await collection.insertOne(testDoc);
      console.log('✅ Test document created successfully:', result.insertedId);
      
      // Clean up test document
      await collection.deleteOne({ _id: result.insertedId });
      console.log('🗑️  Test document cleaned up');
    } catch (err) {
      console.log('❌ Test document creation failed:', err.message);
      if (err.code === 11000) {
        console.log('   Key pattern:', err.keyPattern);
        console.log('   Key value:', err.keyValue);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

inspectDatabase();