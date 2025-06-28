import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getHODDashboardStats,
  getHODStudents,
  getHODFaculty,
  getHODSubjects,
  getHODReports,
  getSubjectFeedbackDetails
} from '../controllers/hodController';

const router = express.Router();

// Middleware to ensure only HOD can access these routes
const isHOD = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'hod') {
    return res.status(403).json({ message: 'Access denied. HOD role required.' });
  }
  next();
};

// HOD Dashboard
router.get('/dashboard-stats', protect, isHOD, getHODDashboardStats);

// HOD Students Management
router.get('/students', protect, isHOD, getHODStudents);

// HOD Faculty Management
router.get('/faculty', protect, isHOD, getHODFaculty);

// HOD Subjects
router.get('/subjects', protect, isHOD, getHODSubjects);

// HOD Reports
router.get('/reports', protect, isHOD, getHODReports);

// HOD Subject Feedback Details
router.get('/feedback/:subjectId', protect, isHOD, getSubjectFeedbackDetails);

export default router;
