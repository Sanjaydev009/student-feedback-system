import express from 'express';
import {
  createFeedbackPeriod,
  getAllFeedbackPeriods,
  getActiveFeedbackPeriods,
  updateFeedbackPeriod,
  toggleFeedbackPeriod,
  deleteFeedbackPeriod,
  getFeedbackPeriodStats
} from '../controllers/feedbackPeriodController';
import { protect, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Admin routes for managing feedback periods
router.post('/', protect, isAdmin, createFeedbackPeriod);
router.get('/admin', protect, isAdmin, getAllFeedbackPeriods);
router.put('/:id', protect, isAdmin, updateFeedbackPeriod);
router.patch('/:id/toggle', protect, isAdmin, toggleFeedbackPeriod);
router.delete('/:id', protect, isAdmin, deleteFeedbackPeriod);
router.get('/:id/stats', protect, isAdmin, getFeedbackPeriodStats);

// Student routes for accessing active periods
router.get('/active', protect, getActiveFeedbackPeriods);

export default router;