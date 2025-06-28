import express from 'express';
import { getDashboardStats, getAnalyticsData } from '../controllers/adminController';
import { protect, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Dashboard statistics route
router.get('/dashboard/stats', protect, isAdmin, getDashboardStats);

// Analytics data route
router.get('/analytics', protect, isAdmin, getAnalyticsData);

export default router;
