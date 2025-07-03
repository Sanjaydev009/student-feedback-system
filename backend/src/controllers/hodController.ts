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
    // Validate user is HOD
    const hodUser = await User.findById(req.user?.id);
    if (!hodUser || hodUser.role !== 'hod') {
      res.status(403).json({ message: 'Access denied. HOD role required.' });
      return;
    }
    
    // Log incoming request for debugging purposes
    console.log(`HOD Reports request from ${hodUser.name}, branch: ${hodUser.branch}`, {
      filters: req.query
    });

    const { subject, term, startDate, endDate } = req.query;
    const hodBranch = hodUser.branch;

    console.log(`Processing HOD reports for branch: ${hodBranch}`);
    
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
        // Make sure we only process records where student lookup returned results
        $match: {
          'studentInfo': { $ne: [] }
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
        // Make sure we only process records where subject lookup returned results
        $match: {
          'subjectInfo': { $ne: [] }
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

    if (term) {
      pipeline.push({
        $match: { 'subjectInfo.term': Number(term) }
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

    try {
      const reports = await Feedback.aggregate(pipeline);
      console.log(`Retrieved ${reports.length} feedback reports for branch ${hodBranch}`);
      
      // Log the first report for debugging (if any)
      if (reports.length > 0) {
        console.log('Sample report:', JSON.stringify(reports[0], null, 2));
      } else {
        console.log('No reports found with current filters');
      }
      
      res.json(reports);
    } catch (aggregateError: any) {
      console.error('Aggregation error:', aggregateError);
      res.status(500).json({ 
        message: 'Error processing feedback reports',
        error: aggregateError.message 
      });
    }
  } catch (error: any) {
    console.error('Get HOD reports error:', error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

// GET /api/hod/feedback-status
export const getFeedbackStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const hodUser = await User.findById(req.user?.id);
    if (!hodUser || hodUser.role !== 'hod') {
      res.status(403).json({ message: 'Access denied. HOD role required.' });
      return;
    }

    const hodBranch = hodUser.branch;
    
    // Get all subjects in the HOD's branch
    const subjects = await Subject.find({ branch: hodBranch });
    
    // Get all students in the HOD's branch
    const students = await User.find({ 
      role: 'student',
      branch: hodBranch
    }).select('_id name email rollNumber year');
    
    // Get all feedbacks for these students
    const feedbacks = await Feedback.find({
      student: { $in: students.map(s => s._id) }
    }).select('student subject createdAt updatedAt');
    
    // Map of student+subject to feedback status
    const feedbackMap = new Map();
    feedbacks.forEach(feedback => {
      const key = `${feedback.student.toString()}-${feedback.subject.toString()}`;
      feedbackMap.set(key, {
        submitted: true,
        submittedAt: feedback.createdAt
      });
    });
    
    // Generate complete status report
    const feedbackStatus = [];
    
    for (const subject of subjects) {
      // Find students who should give feedback for this subject
      // Usually students in same year as the subject term
      const eligibleStudents = students.filter(
        student => Math.ceil(subject.term / 2) === student.year
      );
      
      for (const student of eligibleStudents) {
        const key = `${student._id.toString()}-${subject._id.toString()}`;
        const status = feedbackMap.get(key) || { submitted: false, submittedAt: null };
        
        feedbackStatus.push({
          student: {
            _id: student._id,
            name: student.name,
            email: student.email,
            rollNumber: student.rollNumber,
            year: student.year,
            branch: student.branch // Add branch information
          },
          subject: {
            _id: subject._id,
            name: subject.name,
            code: subject.code,
            instructor: subject.instructor,
            term: subject.term,
            branch: subject.branch
          },
          submitted: status.submitted,
          submittedAt: status.submittedAt
        });
      }
    }
    
    res.json(feedbackStatus);
  } catch (error: any) {
    console.error('Get feedback status error:', error);
    res.status(500).json({ message: error.message });
  }
};
