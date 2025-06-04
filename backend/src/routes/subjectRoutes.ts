import express from 'express';
import { getSubjects, createSubject } from '../controllers/subjectController';

const router = express.Router();

router.route('/')
  .get(getSubjects)
  .post(createSubject);

export default router;