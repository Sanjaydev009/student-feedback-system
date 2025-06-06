import express from 'express';
import { getSubjects, getSubjectById } from '../controllers/subjectController';

const router = express.Router();

// GET /api/subjects
router.route('/')
  .get(getSubjects);

// GET /api/subjects/:id
router.route('/:id')
  .get(getSubjectById);

export default router;