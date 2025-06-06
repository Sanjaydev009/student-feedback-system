// // src/routes/feedbackRoutes.ts
// import express from 'express';
// import { submitFeedback, getFeedbackByStudent, getAllFeedback } from '../controllers/feedbackController';

// const router = express.Router();

// router.route('/')
//   .get(getAllFeedback)
//   .post(submitFeedback);

// router.get('/student/:studentId', getFeedbackByStudent);

// export default router;

import express from 'express';
import { submitFeedback } from '../controllers/feedbackController';
import { getAllFeedback } from '../controllers/feedbackController';
import { protect, isAdmin } from '../middleware/authMiddleware';
import { getStudentFeedback } from '../controllers/feedbackController';

const router = express.Router();

router.post('/', protect, submitFeedback);
router.get('/', protect, isAdmin, getAllFeedback);
router.get('/student/:id', protect, getStudentFeedback);

export default router;