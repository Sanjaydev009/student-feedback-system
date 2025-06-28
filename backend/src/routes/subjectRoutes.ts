import express from 'express';
import { getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject } from '../controllers/subjectController';
import { protect, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getSubjects);         // Protected route
router.get('/:id', protect, getSubjectById);
router.post('/', protect, isAdmin, createSubject);   // Protected route
router.put('/:id', protect, isAdmin, updateSubject);   // Protected route
router.delete('/:id', protect, isAdmin, deleteSubject);   // Protected route

export default router;