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

  if (!student || !subject || !Array.isArray(answers) || answers.length < 10) {
    res.status(400).json({ message: 'All fields including 10 questions are required' });
    return;
  }
  
  try {
    // Check if a feedback already exists for this student and subject
    const existingFeedback = await Feedback.findOne({ student, subject });
    
    if (existingFeedback) {
      res.status(409).json({ 
        message: 'You have already submitted feedback for this subject',
        existingFeedback
      });
      return;
    }
    
    // Calculate average rating
    const totalRating = answers.reduce((sum, ans) => sum + ans.answer, 0);
    const averageRating = answers.length > 0 ? totalRating / answers.length : 0;
    
    // Create new feedback with average rating
    const newFeedback = await Feedback.create({ 
      student, 
      subject, 
      answers,
      averageRating: parseFloat(averageRating.toFixed(1))
    });
    
    res.status(201).json(newFeedback);
  } catch (err: any) {
    // Handle duplicate key error from MongoDB (fallback if check above fails)
    if (err.code === 11000) {
      res.status(409).json({ message: 'You have already submitted feedback for this subject' });
      return;
    }
    
    console.error('Feedback submission error:', err);
    res.status(500).json({ message: err.message });
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

// GET /api/feedback/me
export const getMyFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const feedbacks = await Feedback.find({ student: req.user?.id }).populate('subject', 'name instructor code');
    res.json(feedbacks);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getStudentFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const feedbacks = await Feedback.find({ student: studentId }).populate('subject', 'name instructor code');

    if (!feedbacks.length) {
      res.status(404).json({ message: 'No feedback found for this student' });
      return;
    }

    res.json(feedbacks);
  } catch (err: any) {
    console.error('Error fetching feedback:', err.message);
    res.status(500).json({ message: 'Server error while fetching feedback' });
  }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Import User model
    const User = require('../models/User').default;
    const Subject = require('../models/Subject').default;
    
    // Get feedback statistics
    const feedbacks = await Feedback.find();
    
    // Calculate average rating
    const totalRating = feedbacks.reduce((sum, item) => sum + (item.averageRating || 0), 0);
    const averageRating = feedbacks.length > 0 ? 
      (totalRating / feedbacks.length).toFixed(1) : '0.0';
    
    // Get counts of users by role
    const [students, faculty, subjects] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
      Subject.countDocuments()
    ]);
    
    // Calculate feedback completion rate
    const potentialTotal = students * subjects;
    const feedbackCompletion = potentialTotal > 0 ? 
      Math.round((feedbacks.length / potentialTotal) * 100) : 0;
    
    res.json({
      totalStudents: students,
      totalFaculty: faculty,
      totalSubjects: subjects,
      totalFeedbacks: feedbacks.length,
      averageRating: parseFloat(averageRating),
      feedbackCompletion: feedbackCompletion
    });
    
  } catch (err: any) {
    console.error('Error getting dashboard stats:', err.message);
    res.status(500).json({ message: 'Server error while getting dashboard statistics' });
  }
};

export const getRecentFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get recent feedback with populated fields
    const recentFeedback = await Feedback.find()
      .populate('student', 'name email')
      .populate('subject', 'name instructor code')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json(recentFeedback);
  } catch (err: any) {
    console.error('Error getting recent feedback:', err.message);
    res.status(500).json({ message: 'Server error while getting recent feedback' });
  }
};