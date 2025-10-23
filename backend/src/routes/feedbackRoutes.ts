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
import { submitFeedback, getAllFeedback, getMyFeedback, getStudentFeedback, getDashboardStats, getRecentFeedback, getFeedbackSummary, getRecentActivities, getReports } from '../controllers/feedbackController';
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
router.get('/summary/:subjectId', protect, isAdmin, getFeedbackSummary);

// Student feedback routes
router.get('/my-submissions', protect, getMyFeedback); // Get current user's feedback submissions
router.get('/student/me', protect, getMyFeedback); // Get current user's feedback
router.get('/student/:id', protect, getStudentFeedback); // Get specific student's feedback (admin/hod can access others)

export default router;