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
import User from '../models/User';
import Subject from '../models/Subject';


export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  const { student, subject, answers, feedbackType, term, academicYear, comments } = req.body;

  if (!student || !subject || !Array.isArray(answers) || answers.length < 5) {
    res.status(400).json({ message: 'All fields including minimum 5 questions are required' });
    return;
  }

  if (!feedbackType || !['midterm', 'endterm'].includes(feedbackType)) {
    res.status(400).json({ message: 'Valid feedbackType (midterm or endterm) is required' });
    return;
  }
  
  try {
    // Check if a feedback already exists for this student, subject, and feedback type
    const existingFeedback = await Feedback.findOne({ 
      student, 
      subject, 
      feedbackType,
      term: term || 1
    });
    
    if (existingFeedback) {
      res.status(409).json({ 
        message: `You have already submitted ${feedbackType} feedback for this subject`,
        existingFeedback
      });
      return;
    }
    
    // Calculate average rating from rating-type questions only
    const ratingAnswers = answers.filter((ans: any) => ans.type === 'rating' && ans.answer > 0);
    const totalRating = ratingAnswers.reduce((sum: number, ans: any) => sum + ans.answer, 0);
    const averageRating = ratingAnswers.length > 0 ? totalRating / ratingAnswers.length : 0;
    
    // Create new feedback with enhanced structure
    const newFeedback = await Feedback.create({ 
      student, 
      subject, 
      feedbackType,
      term: term || 1,
      academicYear: academicYear || '2024-25',
      answers,
      comments: comments || {},
      averageRating: parseFloat(averageRating.toFixed(1))
    });
    
    console.log(`✅ ${feedbackType} feedback submitted successfully for subject: ${subject}`);
    res.status(201).json(newFeedback);
  } catch (err: any) {
    // Handle duplicate key error from MongoDB (fallback if check above fails)
    if (err.code === 11000) {
      res.status(409).json({ message: `You have already submitted ${feedbackType} feedback for this subject` });
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

export const getFeedbackSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    
    // Get all feedback for the specific subject
    const feedbacks = await Feedback.find({ subject: subjectId })
      .populate('student', 'name rollNumber branch')
      .populate('subject', 'name code instructor branch');
    
    if (feedbacks.length === 0) {
      res.status(404).json({ message: 'No feedback found for this subject' });
      return;
    }
    
    const subject = feedbacks[0].subject as any;
    
    // Calculate average rating
    const totalRating = feedbacks.reduce((sum, feedback) => sum + (feedback.averageRating || 0), 0);
    const averageRating = feedbacks.length > 0 ? totalRating / feedbacks.length : 0;
    
    // Process categories and questions
    const categories: { [key: string]: { average: number; questions: { question: string; average: number; }[] } } = {};
    
    // Group answers by question
    const questionStats: { [question: string]: number[] } = {};
    
    feedbacks.forEach(feedback => {
      feedback.answers.forEach((answer: any) => {
        const questionText = answer.question || `Question ${answer._id}`;
        if (!questionStats[questionText]) {
          questionStats[questionText] = [];
        }
        questionStats[questionText].push(answer.answer || 0);
      });
    });
    
    // Calculate averages for each question and organize by categories
    const generalCategory = {
      average: 0,
      questions: [] as { question: string; average: number; }[]
    };
    
    let totalQuestionAverage = 0;
    let questionCount = 0;
    
    Object.entries(questionStats).forEach(([question, answers]) => {
      const questionAverage = answers.length > 0 ? answers.reduce((sum, ans) => sum + ans, 0) / answers.length : 0;
      generalCategory.questions.push({
        question,
        average: questionAverage
      });
      totalQuestionAverage += questionAverage;
      questionCount++;
    });
    
    generalCategory.average = questionCount > 0 ? totalQuestionAverage / questionCount : 0;
    categories['General'] = generalCategory;
    
    const summary = {
      subjectId: subject._id,
      subjectName: subject.name,
      subjectCode: subject.code,
      instructor: subject.instructor,
      feedbackCount: feedbacks.length,
      averageRating: averageRating,
      categories: categories
    };
    
    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching feedback summary:', error);
    res.status(500).json({ message: 'Failed to fetch feedback summary', error: error.message });
  }
};

export const getRecentActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get recent feedback submissions
    const recentFeedback = await Feedback.find()
      .populate('student', 'name')
      .populate('subject', 'name')
      .sort({ createdAt: -1 })
      .limit(3);
    
    // Get recent user registrations
    const recentUsers = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(2);
    
    // Get recent subject additions
    const recentSubjects = await Subject.find()
      .sort({ createdAt: -1 })
      .limit(2);
    
    const activities: any[] = [];
    
    // Add feedback activities
    recentFeedback.forEach((feedback: any) => {
      const timeDiff = Date.now() - new Date(feedback.createdAt).getTime();
      const minutesAgo = Math.floor(timeDiff / (1000 * 60));
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      let timeString = '';
      if (minutesAgo < 60) {
        timeString = `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`;
      } else if (hoursAgo < 24) {
        timeString = `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
      } else {
        timeString = `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
      }
      
      activities.push({
        id: `feedback-${feedback._id}`,
        type: 'feedback',
        message: `New feedback submitted for ${feedback.subject?.name || 'Unknown Subject'}`,
        time: timeString,
        timestamp: new Date(feedback.createdAt),
        icon: '📝',
        iconBg: 'from-blue-500 to-blue-600'
      });
    });
    
    // Add user activities
    recentUsers.forEach((user: any) => {
      const timeDiff = Date.now() - new Date(user.createdAt).getTime();
      const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      
      let timeString = '';
      if (hoursAgo < 24) {
        timeString = `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
      } else {
        timeString = `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
      }
      
      activities.push({
        id: `user-${user._id}`,
        type: 'student',
        message: `New student ${user.name} registered`,
        time: timeString,
        timestamp: new Date(user.createdAt),
        icon: '👥',
        iconBg: 'from-green-500 to-green-600'
      });
    });
    
    // Add subject activities
    recentSubjects.forEach((subject: any) => {
      const timeDiff = Date.now() - new Date(subject.createdAt).getTime();
      const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      
      let timeString = '';
      if (hoursAgo < 24) {
        timeString = `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
      } else {
        timeString = `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
      }
      
      activities.push({
        id: `subject-${subject._id}`,
        type: 'subject',
        message: `Subject ${subject.name} was added`,
        time: timeString,
        timestamp: new Date(subject.createdAt),
        icon: '📚',
        iconBg: 'from-purple-500 to-purple-600'
      });
    });
    
    // Sort activities by creation time (most recent first)
    activities.sort((a: any, b: any) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    res.json(activities.slice(0, 5));
  } catch (err: any) {
    console.error('Error getting recent activities:', err.message);
    res.status(500).json({ message: 'Server error while getting recent activities' });
  }
};

// Get feedback reports for all subjects
export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const reports = await Feedback.aggregate([
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $unwind: '$subject'
      },
      {
        $group: {
          _id: '$subject._id',
          subject: { $first: '$subject' },
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$averageRating' },
          ratings: { $push: '$averageRating' }
        }
      },
      {
        $project: {
          subject: {
            _id: '$subject._id',
            name: '$subject.name',
            code: '$subject.code',
            instructor: '$subject.instructor',
            department: '$subject.department'
          },
          totalFeedback: 1,
          averageRating: { $round: ['$averageRating', 1] },
          ratingDistribution: {
            $map: {
              input: [1, 2, 3, 4, 5],
              as: 'rating',
              in: {
                rating: '$$rating',
                count: {
                  $size: {
                    $filter: {
                      input: '$ratings',
                      cond: {
                        $and: [
                          { $gte: ['$$this', { $subtract: ['$$rating', 0.5] }] },
                          { $lt: ['$$this', { $add: ['$$rating', 0.5] }] }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $sort: { 'subject.name': 1 }
      }
    ]);

    res.json(reports);
  } catch (err: any) {
    console.error('Error getting reports:', err);
    res.status(500).json({ message: 'Server error while getting reports' });
  }
};

// Get section-wise statistics
export const getSectionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, term, branch } = req.query;
    
    // Build match conditions
    const matchConditions: any = {};
    if (year && year !== 'all') matchConditions['student.year'] = parseInt(year as string);
    if (term && term !== 'all') matchConditions.term = parseInt(term as string);
    if (branch && branch !== 'all') matchConditions['student.branch'] = branch;
    
    // Aggregate feedback data by student sections
    const sectionStats = await Feedback.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $unwind: '$subject'
      },
      ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []),
      {
        $group: {
          _id: '$student.section',
          section: { $first: '$student.section' },
          studentCount: { $addToSet: '$student._id' },
          feedbackCount: { $sum: 1 },
          subjects: { $addToSet: '$subject._id' },
          averageRating: { $avg: '$averageRating' }
        }
      },
      {
        $project: {
          _id: 0,
          section: '$section',
          studentCount: { $size: '$studentCount' },
          feedbackCount: 1,
          subjects: { $size: '$subjects' },
          averageRating: { $round: ['$averageRating', 2] }
        }
      },
      {
        $sort: { section: 1 }
      }
    ]);
    
    res.json(sectionStats);
  } catch (err: any) {
    console.error('Error getting section stats:', err);
    res.status(500).json({ message: 'Server error while getting section statistics' });
  }
};

// Get cumulative subject performance data
export const getCumulativeSubjectData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, term, branch, section } = req.query;
    
    // Build match conditions for filtering
    const matchConditions: any = {};
    
    if (year && year !== 'all') {
      matchConditions['subject.year'] = parseInt(year as string);
    }
    
    if (term && term !== 'all') {
      matchConditions['subject.term'] = parseInt(term as string);
    }
    
    if (branch && branch !== 'all') {
      matchConditions['subject.branch'] = { $in: [branch] };
    }
    
    if (section && section !== 'all') {
      matchConditions['student.section'] = section;
    }

    const cumulativeData = await Feedback.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $unwind: '$subject'
      },
      ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []),
      {
        $group: {
          _id: '$subject._id',
          subjectId: { $first: '$subject._id' },
          subjectName: { $first: '$subject.name' },
          subjectCode: { $first: '$subject.code' },
          instructor: { $first: '$subject.instructor' },
          branch: { $first: '$subject.branch' },
          year: { $first: '$subject.year' },
          term: { $first: '$subject.term' },
          section: { $first: '$student.section' },
          feedbackCount: { $sum: 1 },
          averageRating: { $avg: '$averageRating' }
        }
      },
      {
        $project: {
          _id: 0,
          subjectId: 1,
          subjectName: 1,
          subjectCode: 1,
          instructor: 1,
          branch: 1,
          year: 1,
          term: 1,
          section: 1,
          feedbackCount: 1,
          averageRating: { $round: ['$averageRating', 2] }
        }
      },
      {
        $sort: { averageRating: -1 }
      }
    ]);
    
    res.json(cumulativeData);
  } catch (err: any) {
    console.error('Error getting cumulative subject data:', err);
    res.status(500).json({ message: 'Server error while getting cumulative data' });
  }
};

// Get cumulative question-wise analysis across all subjects
export const getCumulativeQuestionData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, term, branch, section } = req.query;
    
    // Build match conditions for filtering
    const matchConditions: any = {};
    
    if (year && year !== 'all') {
      matchConditions['subject.year'] = parseInt(year as string);
    }
    
    if (term && term !== 'all') {
      matchConditions['subject.term'] = parseInt(term as string);
    }
    
    if (branch && branch !== 'all') {
      matchConditions['subject.branch'] = { $in: [branch] };
    }
    
    if (section && section !== 'all') {
      matchConditions['student.section'] = section;
    }

    const questionData = await Feedback.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $unwind: '$subject'
      },
      ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []),
      {
        $unwind: '$answers'
      },
      {
        $match: {
          'answers.type': 'rating',
          'answers.answer': { $gte: 1, $lte: 5 }
        }
      },
      {
        $group: {
          _id: {
            question: '$answers.question',
            subjectId: '$subject._id'
          },
          question: { $first: '$answers.question' },
          subjectId: { $first: '$subject._id' },
          subjectName: { $first: '$subject.name' },
          subjectCode: { $first: '$subject.code' },
          instructor: { $first: '$subject.instructor' },
          responseCount: { $sum: 1 },
          averageRating: { $avg: '$answers.answer' },
          ratings: { $push: '$answers.answer' }
        }
      },
      {
        $group: {
          _id: '$question',
          question: { $first: '$question' },
          totalResponses: { $sum: '$responseCount' },
          overallAverage: { $avg: '$averageRating' },
          subjectBreakdown: {
            $push: {
              subjectId: '$subjectId',
              subjectName: '$subjectName',
              subjectCode: '$subjectCode',
              instructor: '$instructor',
              responseCount: '$responseCount',
              averageRating: '$averageRating'
            }
          },
          bestPerformingSubject: {
            $max: {
              subject: {
                $concat: ['$subjectName', ' (', '$subjectCode', ')']
              },
              rating: '$averageRating'
            }
          },
          worstPerformingSubject: {
            $min: {
              subject: {
                $concat: ['$subjectName', ' (', '$subjectCode', ')']
              },
              rating: '$averageRating'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          question: 1,
          totalResponses: 1,
          overallAverage: { $round: ['$overallAverage', 2] },
          subjectBreakdown: {
            $map: {
              input: '$subjectBreakdown',
              as: 'subject',
              in: {
                subjectId: '$$subject.subjectId',
                subjectName: '$$subject.subjectName',
                subjectCode: '$$subject.subjectCode',
                instructor: '$$subject.instructor',
                responseCount: '$$subject.responseCount',
                averageRating: { $round: ['$$subject.averageRating', 2] }
              }
            }
          },
          performanceRange: {
            highest: { $max: '$subjectBreakdown.averageRating' },
            lowest: { $min: '$subjectBreakdown.averageRating' }
          },
          subjectCount: { $size: '$subjectBreakdown' }
        }
      },
      {
        $sort: { overallAverage: -1 }
      }
    ]);
    
    // Calculate additional statistics
    const questionStats = questionData.map(item => {
      const ratings = item.subjectBreakdown.map((s: any) => s.averageRating);
      const variance = ratings.length > 1 ? 
        ratings.reduce((sum: number, rating: number) => sum + Math.pow(rating - item.overallAverage, 2), 0) / (ratings.length - 1) : 0;
      const standardDeviation = Math.sqrt(variance);
      
      return {
        ...item,
        statistics: {
          variance: Math.round(variance * 100) / 100,
          standardDeviation: Math.round(standardDeviation * 100) / 100,
          consistency: standardDeviation < 0.5 ? 'High' : standardDeviation < 1.0 ? 'Medium' : 'Low'
        },
        performanceRange: {
          highest: Math.round(Math.max(...ratings) * 100) / 100,
          lowest: Math.round(Math.min(...ratings) * 100) / 100,
          range: Math.round((Math.max(...ratings) - Math.min(...ratings)) * 100) / 100
        }
      };
    });
    
    res.json(questionStats);
  } catch (err: any) {
    console.error('Error getting cumulative question data:', err);
    res.status(500).json({ message: 'Server error while getting cumulative question data' });
  }
};