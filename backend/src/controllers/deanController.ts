import { Request, Response } from 'express';
import User from '../models/User';
import Subject from '../models/Subject';
import Feedback from '../models/Feedback';

// GET /api/dean/dashboard-stats
export const getDEANDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const deanUser = await User.findById(req.user?.id);
    if (!deanUser || deanUser.role !== 'dean') {
      res.status(403).json({ message: 'Access denied. DEAN role required.' });
      return;
    }

    // DEAN can see all branches - institution-wide stats
    const studentsCount = await User.countDocuments({ role: 'student' });
    const facultyCount = await User.countDocuments({ role: 'faculty' });
    const hodCount = await User.countDocuments({ role: 'hod' });
    const subjectsCount = await Subject.countDocuments({});
    const totalFeedback = await Feedback.countDocuments({});

    // Get recent feedback submissions (last 10)
    const recentFeedback = await Feedback.find()
      .populate('student', 'name rollNumber branch')
      .populate('subject', 'name code instructor branch')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get branch-wise statistics
    const branchStats = await User.aggregate([
      {
        $match: { role: 'student' }
      },
      {
        $group: {
          _id: '$branch',
          studentsCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          pipeline: [
            { $match: { role: 'faculty' } },
            { $group: { _id: '$branch', facultyCount: { $sum: 1 } } }
          ],
          as: 'facultyData'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          pipeline: [
            { $group: { _id: '$branch', subjectsCount: { $sum: 1 } } }
          ],
          as: 'subjectsData'
        }
      }
    ]);

    // Get overall ratings by branch
    const branchRatings = await Feedback.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $group: {
          _id: { $arrayElemAt: ['$studentInfo.branch', 0] },
          averageRating: { $avg: '$averageRating' },
          totalFeedbacks: { $sum: 1 }
        }
      },
      {
        $sort: { averageRating: -1 }
      }
    ]);

    // Get top performing subjects across all branches
    const topSubjects = await Feedback.aggregate([
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      {
        $group: {
          _id: '$subject',
          averageRating: { $avg: '$averageRating' },
          totalFeedbacks: { $sum: 1 },
          subjectName: { $first: { $arrayElemAt: ['$subjectInfo.name', 0] } },
          subjectCode: { $first: { $arrayElemAt: ['$subjectInfo.code', 0] } },
          instructor: { $first: { $arrayElemAt: ['$subjectInfo.instructor', 0] } },
          branch: { $first: { $arrayElemAt: ['$subjectInfo.branch', 0] } }
        }
      },
      {
        $match: { totalFeedbacks: { $gte: 3 } } // At least 3 feedbacks
      },
      {
        $sort: { averageRating: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      stats: {
        studentsCount,
        facultyCount,
        hodCount,
        subjectsCount,
        totalFeedback
      },
      recentFeedback,
      branchStats,
      branchRatings,
      topSubjects
    });
  } catch (error: any) {
    console.error('DEAN Dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/dean/branches
export const getAllBranches = async (req: Request, res: Response): Promise<void> => {
  try {
    const deanUser = await User.findById(req.user?.id);
    if (!deanUser || deanUser.role !== 'dean') {
      res.status(403).json({ message: 'Access denied. DEAN role required.' });
      return;
    }

    const branches = await User.distinct('branch', { branch: { $ne: null } });
    
    const branchDetails = await Promise.all(
      branches.map(async (branch) => {
        const studentsCount = await User.countDocuments({ role: 'student', branch });
        const facultyCount = await User.countDocuments({ role: 'faculty', branch });
        const hodCount = await User.countDocuments({ role: 'hod', branch });
        const subjectsCount = await Subject.countDocuments({ branch });
        
        const feedbackCount = await Feedback.aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'student',
              foreignField: '_id',
              as: 'studentInfo'
            }
          },
          {
            $match: { 'studentInfo.branch': branch }
          },
          {
            $count: 'total'
          }
        ]);

        return {
          branch,
          studentsCount,
          facultyCount,
          hodCount,
          subjectsCount,
          feedbackCount: feedbackCount[0]?.total || 0
        };
      })
    );

    res.json(branchDetails);
  } catch (error: any) {
    console.error('Get all branches error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/dean/users
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const deanUser = await User.findById(req.user?.id);
    if (!deanUser || deanUser.role !== 'dean') {
      res.status(403).json({ message: 'Access denied. DEAN role required.' });
      return;
    }

    const { role, branch, search, page = 1, limit = 20 } = req.query;

    let filter: any = {};
    
    if (role && role !== 'all') {
      filter.role = role;
    }
    
    if (branch && branch !== 'all') {
      filter.branch = branch;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ role: 1, name: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        hasNext: Number(page) * Number(limit) < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error: any) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/dean/subjects
export const getAllSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const deanUser = await User.findById(req.user?.id);
    if (!deanUser || deanUser.role !== 'dean') {
      res.status(403).json({ message: 'Access denied. DEAN role required.' });
      return;
    }

    const { branch, term } = req.query;

    let filter: any = {};
    
    if (branch && branch !== 'all') {
      filter.branch = branch;
    }
    
    if (term && term !== 'all') {
      filter.term = Number(term);
    }

    const subjects = await Subject.find(filter).sort({ branch: 1, term: 1, name: 1 });

    res.json(subjects);
  } catch (error: any) {
    console.error('Get all subjects error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/dean/reports
export const getDEANReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const deanUser = await User.findById(req.user?.id);
    if (!deanUser || deanUser.role !== 'dean') {
      res.status(403).json({ message: 'Access denied. DEAN role required.' });
      return;
    }

    const { branch, subject, term, startDate, endDate, groupBy } = req.query;

    // Build aggregation pipeline
    let pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      }
    ];

    // Add filters
    let matchConditions: any = {};

    if (branch && branch !== 'all') {
      matchConditions['studentInfo.branch'] = branch;
    }

    if (subject && subject !== 'all') {
      matchConditions['subjectInfo._id'] = subject;
    }

    if (term && term !== 'all') {
      matchConditions['subjectInfo.term'] = Number(term);
    }

    if (startDate || endDate) {
      let dateMatch: any = {};
      if (startDate) dateMatch.$gte = new Date(startDate as string);
      if (endDate) dateMatch.$lte = new Date(endDate as string);
      matchConditions.createdAt = dateMatch;
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Group based on groupBy parameter
    let groupId: any;
    switch (groupBy) {
      case 'branch':
        groupId = { $arrayElemAt: ['$studentInfo.branch', 0] };
        break;
      case 'subject':
        groupId = {
          subject: '$subject',
          subjectName: { $arrayElemAt: ['$subjectInfo.name', 0] },
          subjectCode: { $arrayElemAt: ['$subjectInfo.code', 0] },
          instructor: { $arrayElemAt: ['$subjectInfo.instructor', 0] },
          branch: { $arrayElemAt: ['$subjectInfo.branch', 0] }
        };
        break;
      case 'instructor':
        groupId = { $arrayElemAt: ['$subjectInfo.instructor', 0] };
        break;
      default:
        groupId = {
          subject: '$subject',
          subjectName: { $arrayElemAt: ['$subjectInfo.name', 0] },
          subjectCode: { $arrayElemAt: ['$subjectInfo.code', 0] },
          instructor: { $arrayElemAt: ['$subjectInfo.instructor', 0] },
          branch: { $arrayElemAt: ['$subjectInfo.branch', 0] }
        };
    }

    pipeline.push(
      {
        $group: {
          _id: groupId,
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$averageRating' },
          ratings: { $push: '$averageRating' },
          minRating: { $min: '$averageRating' },
          maxRating: { $max: '$averageRating' }
        }
      },
      {
        $sort: { averageRating: -1 }
      }
    );

    const reports = await Feedback.aggregate(pipeline);

    res.json(reports);
  } catch (error: any) {
    console.error('Get DEAN reports error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/dean/feedback/:subjectId
export const getSubjectFeedbackDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const deanUser = await User.findById(req.user?.id);
    if (!deanUser || deanUser.role !== 'dean') {
      res.status(403).json({ message: 'Access denied. DEAN role required.' });
      return;
    }

    const { subjectId } = req.params;

    const feedback = await Feedback.find({ subject: subjectId })
      .populate('student', 'name rollNumber branch')
      .populate('subject', 'name code instructor branch')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error: any) {
    console.error('Get subject feedback details error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/dean/analytics
export const getDEANAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const deanUser = await User.findById(req.user?.id);
    if (!deanUser || deanUser.role !== 'dean') {
      res.status(403).json({ message: 'Access denied. DEAN role required.' });
      return;
    }

    const { timeRange = '6months' } = req.query;
    
    // Calculate date range based on timeRange parameter
    const endDate = new Date();
    const startDate = new Date();
    
    switch(timeRange) {
      case '1month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case '6months':
      default:
        startDate.setMonth(endDate.getMonth() - 6);
    }
    
    // Get overview statistics
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalSubjects = await Subject.countDocuments({});
    const totalFeedback = await Feedback.countDocuments({ 
      createdAt: { $gte: startDate, $lte: endDate } 
    });
    
    // Calculate overall average rating
    const ratingResult = await Feedback.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lte: endDate } }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$averageRating' }
        }
      }
    ]);
    
    const averageRating = ratingResult.length > 0 ? ratingResult[0].averageRating : 0;
    
    // Calculate response rate
    const totalPossibleFeedback = totalStudents * totalSubjects;
    const responseRate = totalPossibleFeedback > 0 ? (totalFeedback / totalPossibleFeedback) * 100 : 0;
    
    // Get branch statistics
    const branchStats = await Subject.aggregate([
      {
        $group: {
          _id: '$branch',
          subjects: { $sum: 1 },
          branches: { $addToSet: { 
            name: '$branch',
            code: '$branch' // Using branch as code as well for simplicity
          }}
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { branch: '$_id' },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $eq: ['$branch', '$$branch'] },
                    { $eq: ['$role', 'student'] }
                  ]
                }
              }
            },
            { $count: 'count' }
          ],
          as: 'studentsInfo'
        }
      },
      {
        $lookup: {
          from: 'feedbacks',
          let: { branch: '$_id' },
          pipeline: [
            {
              $lookup: {
                from: 'subjects',
                localField: 'subject',
                foreignField: '_id',
                as: 'subjectInfo'
              }
            },
            { 
              $match: { 
                $expr: { 
                  $eq: [{ $arrayElemAt: ['$subjectInfo.branch', 0] }, '$$branch']
                },
                createdAt: { $gte: startDate, $lte: endDate }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                averageRating: { $avg: '$averageRating' }
              }
            }
          ],
          as: 'feedbackInfo'
        }
      },
      {
        $project: {
          _id: 0,
          branch: {
            _id: '$_id',
            name: { $arrayElemAt: ['$branches.name', 0] },
            code: { $arrayElemAt: ['$branches.code', 0] },
          },
          students: { $ifNull: [{ $arrayElemAt: ['$studentsInfo.count', 0] }, 0] },
          subjects: '$subjects',
          feedback: { $ifNull: [{ $arrayElemAt: ['$feedbackInfo.count', 0] }, 0] },
          averageRating: { $ifNull: [{ $arrayElemAt: ['$feedbackInfo.averageRating', 0] }, 0] },
          responseRate: {
            $let: {
              vars: {
                students: { $ifNull: [{ $arrayElemAt: ['$studentsInfo.count', 0] }, 0] },
                subjects: '$subjects',
                feedbackCount: { $ifNull: [{ $arrayElemAt: ['$feedbackInfo.count', 0] }, 0] },
              },
              in: {
                $cond: {
                  if: { $gt: [{ $multiply: ['$$students', '$$subjects'] }, 0] },
                  then: { $multiply: [{ $divide: ['$$feedbackCount', { $multiply: ['$$students', '$$subjects'] }] }, 100] },
                  else: 0
                }
              }
            }
          }
        }
      },
      {
        $sort: { 'averageRating': -1 }
      }
    ]);

    // Get rating trends by month
    const ratingTrends = await Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          averageRating: { $avg: '$averageRating' },
          totalFeedback: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' }, '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' }
                }
              }
            ]
          },
          averageRating: 1,
          totalFeedback: 1
        }
      }
    ]);
    
    // Get top performing subjects
    const topPerformingSubjects = await Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      {
        $group: {
          _id: '$subject',
          averageRating: { $avg: '$averageRating' },
          totalFeedback: { $sum: 1 },
          subjectDetails: { $first: { $arrayElemAt: ['$subjectInfo', 0] } }
        }
      },
      {
        $match: {
          totalFeedback: { $gte: 3 } // At least 3 feedbacks
        }
      },
      {
        $sort: { averageRating: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          subject: {
            _id: '$_id',
            name: '$subjectDetails.name',
            code: '$subjectDetails.code',
          },
          faculty: {
            name: '$subjectDetails.instructor'
          },
          averageRating: 1,
          totalFeedback: 1
        }
      }
    ]);
    
    // Get feedback distribution by rating
    const feedbackDistribution = await Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $and: [{ $gte: ['$averageRating', 0] }, { $lt: ['$averageRating', 1] }] }, then: 1 },
                { case: { $and: [{ $gte: ['$averageRating', 1] }, { $lt: ['$averageRating', 2] }] }, then: 1 },
                { case: { $and: [{ $gte: ['$averageRating', 2] }, { $lt: ['$averageRating', 3] }] }, then: 2 },
                { case: { $and: [{ $gte: ['$averageRating', 3] }, { $lt: ['$averageRating', 4] }] }, then: 3 },
                { case: { $and: [{ $gte: ['$averageRating', 4] }, { $lte: ['$averageRating', 5] }] }, then: 4 }
              ],
              default: 5
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          rating: '$_id',
          count: 1
        }
      }
    ]);
    
    // Transform feedback distribution to the expected format
    const distributionMap = feedbackDistribution.reduce((acc, item) => {
      acc[item.rating] = item.count;
      return acc;
    }, {} as Record<string, number>);
    
    const formattedDistribution = {
      1: distributionMap[1] || 0,
      2: distributionMap[2] || 0,
      3: distributionMap[3] || 0,
      4: distributionMap[4] || 0,
      5: distributionMap[5] || 0,
    };

    // Return data in the format expected by the frontend
    res.json({
      overview: {
        totalStudents,
        totalFaculty,
        totalSubjects,
        totalFeedback,
        averageRating,
        responseRate
      },
      branchStats,
      ratingTrends,
      topPerformingSubjects,
      feedbackDistribution: formattedDistribution
    });
  } catch (error: any) {
    console.error('Get DEAN analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};
