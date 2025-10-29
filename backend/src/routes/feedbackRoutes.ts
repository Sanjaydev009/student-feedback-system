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

export default router;