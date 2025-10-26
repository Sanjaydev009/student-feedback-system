import express from 'express';
import { getSubjects, getSubjectsForStudent, getSubjectById, createSubject, updateSubject, deleteSubject, getSubjectStats, bulkDeleteSubjects } from '../controllers/subjectController';
import { protect, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getSubjects);         // Protected route for all subjects (admin use)
router.get('/stats', protect, isAdmin, getSubjectStats); // Get subject statistics
router.get('/student', protect, getSubjectsForStudent); // Protected route for student-specific subjects
router.get('/:id', protect, getSubjectById);
router.post('/', protect, isAdmin, createSubject);   // Protected route
router.put('/:id', protect, isAdmin, updateSubject);   // Protected route
router.delete('/', protect, isAdmin, bulkDeleteSubjects); // Bulk delete subjects
router.delete('/:id', protect, isAdmin, deleteSubject);   // Protected route

export default router;