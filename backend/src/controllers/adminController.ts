import { Request, Response } from 'express';
import User from '../models/User';
import Subject from '../models/Subject';
import Feedback from '../models/Feedback';

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get total counts
    const [totalStudents, totalFaculty, totalSubjects, totalFeedbacks] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
      Subject.countDocuments(),
      Feedback.countDocuments()
    ]);

    // Calculate average rating
    const ratingAggregation = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$averageRating' }
        }
      }
    ]);

    const averageRating = ratingAggregation.length > 0 ? ratingAggregation[0].averageRating : 0;

    // Calculate feedback completion rate (assuming each student should give feedback for each subject)
    const expectedFeedbacks = totalStudents * totalSubjects;
    const feedbackCompletion = expectedFeedbacks > 0 ? Math.round((totalFeedbacks / expectedFeedbacks) * 100) : 0;

    res.json({
      totalStudents,
      totalFaculty,
      totalSubjects,
      totalFeedbacks,
      averageRating: Number(averageRating.toFixed(1)),
      feedbackCompletion: Math.min(feedbackCompletion, 100) // Cap at 100%
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
};

// Get analytics data
export const getAnalyticsData = async (req: Request, res: Response): Promise<void> => {
  try {
    // Department-wise statistics
    const departmentStats = await Subject.aggregate([
      {
        $lookup: {
          from: 'feedbacks',
          localField: '_id',
          foreignField: 'subject',
          as: 'feedbacks'
        }
      },
      {
        $group: {
          _id: '$department',
          totalSubjects: { $sum: 1 },
          totalFeedbacks: { $sum: { $size: '$feedbacks' } },
          averageRating: { 
            $avg: { 
              $avg: '$feedbacks.averageRating' 
            } 
          }
        }
      },
      {
        $project: {
          department: '$_id',
          totalSubjects: 1,
          totalFeedbacks: 1,
          averageRating: { $round: ['$averageRating', 1] },
          satisfactionRate: { 
            $round: [
              { $multiply: [{ $divide: ['$averageRating', 5] }, 100] }, 
              1
            ] 
          }
        }
      }
    ]);

    // Semester-wise statistics
    const semesterStats = await Subject.aggregate([
      {
        $lookup: {
          from: 'feedbacks',
          localField: '_id',
          foreignField: 'subject',
          as: 'feedbacks'
        }
      },
      {
        $group: {
          _id: '$semester',
          totalSubjects: { $sum: 1 },
          totalFeedbacks: { $sum: { $size: '$feedbacks' } },
          averageRating: { 
            $avg: { 
              $avg: '$feedbacks.averageRating' 
            } 
          }
        }
      },
      {
        $project: {
          semester: '$_id',
          totalSubjects: 1,
          totalFeedbacks: 1,
          averageRating: { $round: ['$averageRating', 1] }
        }
      },
      { $sort: { semester: 1 } }
    ]);

    // Instructor performance
    const instructorPerformance = await Subject.aggregate([
      {
        $lookup: {
          from: 'feedbacks',
          localField: '_id',
          foreignField: 'subject',
          as: 'feedbacks'
        }
      },
      {
        $group: {
          _id: '$instructor',
          subjects: { $sum: 1 },
          department: { $first: '$department' },
          totalFeedbacks: { $sum: { $size: '$feedbacks' } },
          averageRating: { 
            $avg: { 
              $avg: '$feedbacks.averageRating' 
            } 
          }
        }
      },
      {
        $project: {
          instructor: '$_id',
          subjects: 1,
          department: 1,
          totalFeedbacks: 1,
          averageRating: { $round: ['$averageRating', 1] }
        }
      },
      { $sort: { averageRating: -1 } }
    ]);

    // Trend data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trendData = await Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$averageRating' }
        }
      },
      {
        $project: {
          month: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month'
                }
              }
            }
          },
          totalFeedbacks: 1,
          averageRating: { $round: ['$averageRating', 1] },
          responseRate: { $multiply: ['$totalFeedbacks', 0.1] } // Mock response rate
        }
      },
      { $sort: { month: 1 } }
    ]);

    res.json({
      departmentWiseStats: departmentStats,
      semesterWiseStats: semesterStats,
      instructorPerformance: instructorPerformance,
      trendData: trendData
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
};
