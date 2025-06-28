import { Request, Response } from 'express';
import User from '../models/User';
import Subject from '../models/Subject';
import Feedback from '../models/Feedback';

// GET /api/hod/dashboard-stats
export const getHODDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const hodUser = await User.findById(req.user?.id);
    if (!hodUser || hodUser.role !== 'hod') {
      res.status(403).json({ message: 'Access denied. HOD role required.' });
      return;
    }

    const hodBranch = hodUser.branch;

    // Get students count in HOD's branch
    const studentsCount = await User.countDocuments({ 
      role: 'student', 
      branch: hodBranch 
    });

    // Get faculty count in HOD's branch
    const facultyCount = await User.countDocuments({ 
      role: 'faculty', 
      branch: hodBranch 
    });

    // Get subjects count in HOD's branch
    const subjectsCount = await Subject.countDocuments({ branch: hodBranch });

    // Get total feedback submissions for HOD's branch
    const totalFeedback = await Feedback.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $match: {
          'studentInfo.branch': hodBranch
        }
      },
      {
        $count: 'total'
      }
    ]);

    // Get recent feedback submissions (last 5)
    const recentFeedback = await Feedback.find()
      .populate({
        path: 'student',
        match: { branch: hodBranch },
        select: 'name rollNumber branch'
      })
      .populate('subject', 'name code instructor')
      .sort({ createdAt: -1 })
      .limit(5);

    // Filter out null students (from populate match)
    const filteredRecentFeedback = recentFeedback.filter(f => f.student);

    // Get average ratings by subject for HOD's branch
    const subjectRatings = await Feedback.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $match: {
          'studentInfo.branch': hodBranch
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
          totalFeedbacks: { $sum: 1 },
          subjectName: { $first: { $arrayElemAt: ['$subjectInfo.name', 0] } },
          subjectCode: { $first: { $arrayElemAt: ['$subjectInfo.code', 0] } },
          instructor: { $first: { $arrayElemAt: ['$subjectInfo.instructor', 0] } }
        }
      },
      {
        $sort: { averageRating: -1 }
      }
    ]);

    res.json({
      stats: {
        studentsCount,
        facultyCount,
        subjectsCount,
        totalFeedback: totalFeedback[0]?.total || 0
      },
      recentFeedback: filteredRecentFeedback,
      subjectRatings,
      branch: hodBranch
    });
  } catch (error: any) {
    console.error('HOD Dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/hod/students
export const getHODStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const hodUser = await User.findById(req.user?.id);
    if (!hodUser || hodUser.role !== 'hod') {
      res.status(403).json({ message: 'Access denied. HOD role required.' });
      return;
    }

    const { search, page = 1, limit = 10 } = req.query;
    const hodBranch = hodUser.branch;

    let filter: any = { role: 'student', branch: hodBranch };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(filter)
      .select('-password')
      .sort({ name: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      students,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        hasNext: Number(page) * Number(limit) < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error: any) {
    console.error('Get HOD students error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/hod/faculty
export const getHODFaculty = async (req: Request, res: Response): Promise<void> => {
  try {
    const hodUser = await User.findById(req.user?.id);
    if (!hodUser || hodUser.role !== 'hod') {
      res.status(403).json({ message: 'Access denied. HOD role required.' });
      return;
    }

    const hodBranch = hodUser.branch;
    
    const faculty = await User.find({ 
      role: 'faculty', 
      branch: hodBranch 
    }).select('-password');

    res.json(faculty);
  } catch (error: any) {
    console.error('Get HOD faculty error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/hod/subjects
export const getHODSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const hodUser = await User.findById(req.user?.id);
    if (!hodUser || hodUser.role !== 'hod') {
      res.status(403).json({ message: 'Access denied. HOD role required.' });
      return;
    }

    const hodBranch = hodUser.branch;
    
    const subjects = await Subject.find({ branch: hodBranch });

    res.json(subjects);
  } catch (error: any) {
    console.error('Get HOD subjects error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/hod/reports
export const getHODReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const hodUser = await User.findById(req.user?.id);
    if (!hodUser || hodUser.role !== 'hod') {
      res.status(403).json({ message: 'Access denied. HOD role required.' });
      return;
    }

    const { subject, semester, startDate, endDate } = req.query;
    const hodBranch = hodUser.branch;

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
      },
      {
        $match: {
          'studentInfo.branch': hodBranch
        }
      }
    ];

    // Add filters
    if (subject) {
      pipeline.push({
        $match: { 'subjectInfo._id': subject }
      });
    }

    if (semester) {
      pipeline.push({
        $match: { 'subjectInfo.semester': Number(semester) }
      });
    }

    if (startDate || endDate) {
      let dateMatch: any = {};
      if (startDate) dateMatch.$gte = new Date(startDate as string);
      if (endDate) dateMatch.$lte = new Date(endDate as string);
      pipeline.push({
        $match: { createdAt: dateMatch }
      });
    }

    // Group and calculate statistics
    pipeline.push(
      {
        $group: {
          _id: {
            subject: '$subject',
            subjectName: { $arrayElemAt: ['$subjectInfo.name', 0] },
            subjectCode: { $arrayElemAt: ['$subjectInfo.code', 0] },
            instructor: { $arrayElemAt: ['$subjectInfo.instructor', 0] }
          },
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$averageRating' },
          ratings: { $push: '$averageRating' }
        }
      },
      {
        $sort: { '_id.subjectName': 1 }
      }
    );

    const reports = await Feedback.aggregate(pipeline);

    res.json(reports);
  } catch (error: any) {
    console.error('Get HOD reports error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/hod/feedback/:subjectId
export const getSubjectFeedbackDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const hodUser = await User.findById(req.user?.id);
    if (!hodUser || hodUser.role !== 'hod') {
      res.status(403).json({ message: 'Access denied. HOD role required.' });
      return;
    }

    const { subjectId } = req.params;
    const hodBranch = hodUser.branch;

    const feedback = await Feedback.find({ subject: subjectId })
      .populate({
        path: 'student',
        match: { branch: hodBranch },
        select: 'name rollNumber branch'
      })
      .populate('subject', 'name code instructor')
      .sort({ createdAt: -1 });

    // Filter out feedback from students not in HOD's branch
    const filteredFeedback = feedback.filter(f => f.student);

    res.json(filteredFeedback);
  } catch (error: any) {
    console.error('Get subject feedback details error:', error);
    res.status(500).json({ message: error.message });
  }
};
