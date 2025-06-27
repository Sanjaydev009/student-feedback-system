import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getDEANDashboardStats,
  getAllBranches,
  getAllUsers,
  getAllSubjects,
  getDEANReports,
  getSubjectFeedbackDetails,
  getDEANAnalytics
} from '../controllers/deanController';

const router = express.Router();

// Middleware to ensure only DEAN can access these routes
const isDEAN = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'dean') {
    return res.status(403).json({ message: 'Access denied. DEAN role required.' });
  }
  next();
};

// DEAN Dashboard
router.get('/dashboard-stats', protect, isDEAN, getDEANDashboardStats);

// DEAN Branches Overview
router.get('/branches', protect, isDEAN, getAllBranches);

// DEAN Users Management (all users across institution)
router.get('/users', protect, isDEAN, getAllUsers);

// DEAN Subjects (all subjects across institution)
router.get('/subjects', protect, isDEAN, getAllSubjects);

// DEAN Reports (institution-wide)
router.get('/reports', protect, isDEAN, getDEANReports);

// DEAN Subject Feedback Details
router.get('/feedback/:subjectId', protect, isDEAN, getSubjectFeedbackDetails);

// DEAN Analytics
router.get('/analytics', protect, isDEAN, getDEANAnalytics);

export default router;
