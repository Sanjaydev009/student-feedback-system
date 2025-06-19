import express from 'express';
import { getSubjects, getSubjectById, createSubject } from '../controllers/subjectController';
import { protect, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getSubjects);         // Protected route
router.get('/:id', protect, getSubjectById);
router.post('/', protect, isAdmin, createSubject);   // Protected route

export default router;