import express from 'express';
import { getSystemSettings, updateSystemSettings, getUserSettings, updateUserSettings } from '../controllers/settingsController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// System settings (admin-only)
router.get('/system', protect, getSystemSettings);
router.put('/system', protect, updateSystemSettings);

// User settings (for HODs)
router.get('/user', protect, getUserSettings);
router.put('/user', protect, updateUserSettings);

export default router;
