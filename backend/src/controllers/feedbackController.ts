// // src/controllers/feedbackController.ts
// import { Request, Response } from 'express';
// import Feedback from '../models/Feedback';

// export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
//   const { student, subject, ratings, comments } = req.body;

//   try {
//     const feedback = await Feedback.create({
//       student,
//       subject,
//       ratings,
//       comments,
//     });

//     res.status(201).json(feedback);
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getFeedbackByStudent = async (req: Request, res: Response): Promise<void> => {
//   const { studentId } = req.params;

//   try {
//     const feedbacks = await Feedback.find({ student: studentId }).populate('subject');
//     res.json(feedbacks);
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getAllFeedback = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const feedbacks = await Feedback.find().populate('student subject');
//     res.json(feedbacks);
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// };

import { Request, Response } from 'express';
import Feedback from '../models/Feedback';


export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  const { student, subject, answers } = req.body;

  if (!student || !subject || !answers || answers.length < 10) {
    res.status(400).json({ message: 'All fields are required.' });
    return;
  }

  try {
    const existing = await Feedback.findOne({ student, subject });

    if (existing) {
      res.status(400).json({ message: 'Feedback already submitted for this subject' });
      return;
    }

    const newFeedback = await Feedback.create({
      student,
      subject,
      answers
    });

    res.status(201).json(newFeedback);
  } catch (err: any) {
    console.error('Error submitting feedback:', err.message);
    res.status(500).json({ message: 'Server error. Failed to submit feedback.' });
  }
};

export const getAllFeedback = async (req: Request, res: Response) => {
  try {
    const feedbacks = await Feedback.find().populate('subject');
    res.json(feedbacks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentFeedback = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params; // This is student ID
  const { subject } = req.query; // Optional: filter by subject

  try {
    let query: any = { student: id };
    if (subject) {
      query.subject = subject;
    }

    const feedbacks = await Feedback.find(query).populate('subject', 'name code instructor');

    res.json(feedbacks);
  } catch (err: any) {
    console.error('Error fetching feedback:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};