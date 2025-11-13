// // src/routes/feedbackRoutes.ts
// import express from 'express';
// import { submitFeedback, getFeedbackByStudent, getAllFeedback } from '../controllers/feedbackController';

// const router = express.Router();

// router.route('/')
//   .get(getAllFeedback)
//   .post(submitFeedback);

// router.get('/student/:studentId', getFeedbackByStudent);

// export default router;

import express from 'express';
import { submitFeedback, getAllFeedback, getMyFeedback, getStudentFeedback, getDashboardStats, getRecentFeedback, getFeedbackSummary, getRecentActivities, getReports, getSectionStats, getCumulativeSubjectData, getCumulativeQuestionData, getFeedbackCSVData, exportFeedbackAsCSV, exportAnonymousFacultyReport, batchCheckFeedbackAvailability, checkFeedbackAvailability, debugFeedbackStructure, exportDetailedStudentResponses } from '../controllers/feedbackController';
import { protect, isAdmin } from '../middleware/authMiddleware';
import Feedback from '../models/Feedback';

const router = express.Router();

// Create and get all feedback routes
router.post('/', protect, submitFeedback);
router.get('/', protect, isAdmin, getAllFeedback);

// Admin dashboard routes
router.get('/stats', protect, isAdmin, getDashboardStats);
router.get('/recent', protect, isAdmin, getRecentFeedback);
router.get('/activities', protect, isAdmin, getRecentActivities);

// Reports routes
router.get('/reports', protect, isAdmin, getReports);
router.get('/section-stats', protect, isAdmin, getSectionStats);
router.get('/cumulative', protect, isAdmin, getCumulativeSubjectData);
router.get('/cumulative-questions', protect, isAdmin, getCumulativeQuestionData);
router.get('/summary/:subjectId', protect, isAdmin, getFeedbackSummary);
router.get('/csv/:subjectId', protect, isAdmin, getFeedbackCSVData);
router.post('/batch-check', protect, isAdmin, batchCheckFeedbackAvailability);
router.get('/check/:subjectId', protect, isAdmin, checkFeedbackAvailability);
router.get('/export-csv/:subjectId', protect, isAdmin, exportFeedbackAsCSV);
router.get('/faculty-report/:subjectId', protect, isAdmin, exportAnonymousFacultyReport);
router.get('/detailed-responses/:subjectId', protect, isAdmin, exportDetailedStudentResponses);
router.get('/debug/:subjectId', protect, isAdmin, debugFeedbackStructure);

// Student feedback routes
router.get('/my-submissions', protect, getMyFeedback); // Get current user's feedback submissions
router.get('/student/me', protect, getMyFeedback); // Get current user's feedback
router.get('/student/:id', protect, getStudentFeedback); // Get specific student's feedback (admin/hod can access others)

// Database maintenance route (admin only) - Fix feedback index issue
router.post('/fix-db-index', protect, isAdmin, async (req: any, res: any) => {
  try {
    console.log('🔧 Admin requested database index fix...');
    
    // Get the mongoose connection
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const collection = db.collection('feedbacks');
    
    // Get all current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map((idx: any) => ({ name: idx.name, key: idx.key })));
    
    // Find problematic index (student + subject without feedbackType)
    const oldIndex = indexes.find((idx: any) => 
      idx.key && 
      idx.key.student === 1 && 
      idx.key.subject === 1 && 
      !idx.key.feedbackType
    );
    
    let actions = [];
    
    if (oldIndex) {
      console.log('🚨 Found problematic index:', oldIndex.name);
      actions.push(`Found problematic index: ${oldIndex.name}`);
      
      // Drop the old index
      await collection.dropIndex(oldIndex.name);
      console.log('✅ Old index dropped');
      actions.push('Dropped old problematic index');
    } else {
      console.log('✅ No problematic index found');
      actions.push('No problematic index found');
    }
    
    // Ensure correct index exists
    try {
      await collection.createIndex(
        { student: 1, subject: 1, feedbackType: 1 }, 
        { unique: true, name: 'student_1_subject_1_feedbackType_1' }
      );
      console.log('✅ Correct index created/verified');
      actions.push('Created correct compound index with feedbackType');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('✅ Correct index already exists');
        actions.push('Correct index already exists');
      } else {
        throw error;
      }
    }
    
    // Verify final state
    const finalIndexes = await collection.indexes();
    const correctIndex = finalIndexes.find((idx: any) => 
      idx.key && 
      idx.key.student === 1 && 
      idx.key.subject === 1 && 
      idx.key.feedbackType === 1
    );
    
    if (correctIndex) {
      actions.push('✅ Verification successful: Correct index is active');
    }
    
    res.json({
      success: true,
      message: 'Database index fix completed successfully',
      actions: actions,
      finalIndexes: finalIndexes.map((idx: any) => ({ name: idx.name, key: idx.key })),
      note: 'Students can now submit both midterm and endterm feedback for each subject'
    });
    
  } catch (error: any) {
    console.error('❌ Error fixing database index:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix database index',
      error: error.message
    });
  }
});

export default router;