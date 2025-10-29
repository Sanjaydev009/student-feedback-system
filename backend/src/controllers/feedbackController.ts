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

  if (!student || !subject || !Array.isArray(answers) || answers.length < 8) {
    res.status(400).json({ message: 'All fields including minimum 8 questions are required' });
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
    const { id: studentId } = req.params;
    const { subject, type } = req.query;

    // Build query conditions
    const query: any = { student: studentId };
    
    if (subject) {
      query.subject = subject;
    }
    
    if (type) {
      query.feedbackType = type;
    }

    const feedbacks = await Feedback.find(query).populate('subject', 'name instructor code');

    res.json(feedbacks);
  } catch (err: any) {
    console.error('Error fetching student feedback:', err.message);
    res.status(500).json({ message: 'Server error while fetching student feedback' });
  }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, term, branch, section } = req.query;
    
    // Build match conditions for filtering
    const matchConditions: any = {};
    
    // Build aggregation pipeline to filter by student and subject criteria
    const pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentData'
        }
      },
      {
        $unwind: '$studentData'
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectData'
        }
      },
      {
        $unwind: '$subjectData'
      }
    ];
    
    // Add filtering conditions
    const filterConditions: any = {};
    
    if (year && year !== 'all') {
      filterConditions['subjectData.year'] = parseInt(year as string);
    }
    
    if (term && term !== 'all') {
      filterConditions['subjectData.term'] = parseInt(term as string);
    }
    
    if (branch && branch !== 'all') {
      filterConditions['subjectData.branch'] = branch;
    }
    
    if (section && section !== 'all') {
      filterConditions['studentData.section'] = section;
    }
    
    // Add match stage if there are filters
    if (Object.keys(filterConditions).length > 0) {
      pipeline.push({ $match: filterConditions });
    }
    
    // Get filtered feedback data
    const feedbacks = await Feedback.aggregate(pipeline);
    
    console.log(`📊 [DASHBOARD STATS] Found ${feedbacks.length} feedbacks with filters:`, {
      year, term, branch, section
    });
    
    // Calculate average rating
    const totalRating = feedbacks.reduce((sum, item) => sum + (item.averageRating || 0), 0);
    const averageRating = feedbacks.length > 0 ? totalRating / feedbacks.length : 0;
    
    // Get unique subjects with feedback
    const subjectsWithFeedback = new Set(feedbacks.map(f => f.subject.toString())).size;
    
    // Calculate faculty ratings
    const facultyRatings: { [key: string]: number } = {};
    const facultyFeedbackCount: { [key: string]: number } = {};
    
    feedbacks.forEach(feedback => {
      const instructor = feedback.subjectData?.instructor;
      if (instructor) {
        if (!facultyRatings[instructor]) {
          facultyRatings[instructor] = 0;
          facultyFeedbackCount[instructor] = 0;
        }
        facultyRatings[instructor] += feedback.averageRating || 0;
        facultyFeedbackCount[instructor]++;
      }
    });
    
    // Calculate average ratings for each faculty
    Object.keys(facultyRatings).forEach(instructor => {
      facultyRatings[instructor] = facultyRatings[instructor] / facultyFeedbackCount[instructor];
    });
    
    // Get total counts (without filters for context)
    const [totalStudents, totalFaculty, totalSubjects] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
      Subject.countDocuments()
    ]);
    
    res.json({
      // Main stats that respect filters
      totalFeedbacks: feedbacks.length,
      averageRating: parseFloat(averageRating.toFixed(1)),
      subjectsWithFeedback: subjectsWithFeedback,
      facultyRatings: facultyRatings,
      
      // Context stats (total counts)
      totalStudents: totalStudents,
      totalFaculty: totalFaculty,
      totalSubjects: totalSubjects,
      
      // Calculate feedback completion rate
      feedbackCompletion: totalStudents > 0 ? Math.round((feedbacks.length / totalStudents) * 100) : 0,
      
      // Additional info
      appliedFilters: { year, term, branch, section }
    });
    
  } catch (err: any) {
    console.error('Error getting dashboard stats:', err.message);
    res.status(500).json({ message: 'Server error while getting dashboard statistics' });
  }
};

export const getRecentFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    
    // Get recent feedback with populated fields
    const recentFeedback = await Feedback.find()
      .populate('student', 'name email')
      .populate('subject', 'name instructor code')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    // Transform the data to include rating
    const transformedFeedback = recentFeedback.map(feedback => ({
      _id: feedback._id,
      student: feedback.student,
      subject: feedback.subject,
      rating: feedback.averageRating || 0,
      comments: feedback.comments,
      createdAt: feedback.createdAt
    }));
    
    res.json(transformedFeedback);
  } catch (err: any) {
    console.error('Error getting recent feedback:', err.message);
    res.status(500).json({ message: 'Server error while getting recent feedback' });
  }
};

export const getFeedbackCSVData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const { type } = req.query; // Optional: filter by feedback type (midterm/endterm)
    
    console.log(`📊 [CSV EXPORT] Generating CSV data for subject ID: ${subjectId}`);
    
    // First check if the subject exists
    const subjectDoc = await Subject.findById(subjectId);
    
    if (!subjectDoc) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }
    
    // Build query filter
    const query: any = { subject: subjectId };
    if (type && ['midterm', 'endterm'].includes(type as string)) {
      query.feedbackType = type;
    }
    
    // Get all feedback for the specific subject with populated data
    const feedbacks = await Feedback.find(query)
      .populate('student', 'name rollNumber branch section year')
      .populate('subject', 'name code instructor branch year term')
      .sort({ createdAt: -1 });
    
    console.log(`📊 [CSV EXPORT] Found ${feedbacks.length} feedback records for export`);
    
    if (feedbacks.length === 0) {
      res.status(200).json({
        subject: {
          _id: subjectDoc._id,
          name: subjectDoc.name,
          code: subjectDoc.code,
          instructor: subjectDoc.instructor
        },
        csvData: [],
        message: 'No feedback data available for export'
      });
      return;
    }
    
    // Prepare CSV data with complete information including comments
    const csvData = feedbacks.map((feedback: any, index: number) => {
      const student = feedback.student || {};
      const subject = feedback.subject || {};
      
      // Extract rating questions and comments separately
      const ratingAnswers = feedback.answers?.filter((ans: any) => ans.type === 'rating') || [];
      const commentAnswers = feedback.answers?.filter((ans: any) => ans.type === 'comment') || [];
      
      // Calculate individual ratings
      const ratings: any = {};
      ratingAnswers.forEach((ans: any, i: number) => {
        ratings[`Q${i + 1}_Rating`] = ans.answer || 0;
        ratings[`Q${i + 1}_Question`] = ans.question || '';
      });
      
      // Extract comments
      const comments: any = {};
      commentAnswers.forEach((ans: any, i: number) => {
        comments[`Comment${i + 1}_Question`] = ans.question || '';
        comments[`Comment${i + 1}_Response`] = ans.comment || '';
      });
      
      return {
        // Basic Information
        SNo: index + 1,
        StudentName: student.name || 'Unknown',
        RollNumber: student.rollNumber || 'N/A',
        Branch: student.branch || 'N/A',
        Section: student.section || 'N/A',
        Year: student.year || 'N/A',
        
        // Subject Information
        SubjectName: subject.name || 'Unknown',
        SubjectCode: subject.code || 'N/A',
        Instructor: subject.instructor || 'N/A',
        Term: subject.term || 'N/A',
        
        // Feedback Information
        FeedbackType: feedback.feedbackType || 'midterm',
        AverageRating: feedback.averageRating || 0,
        SubmissionDate: feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : 'N/A',
        
        // Individual Ratings (Q1, Q2, Q3, etc.)
        ...ratings,
        
        // Comments (Full text responses)
        ...comments,
        
        // Additional metadata
        AcademicYear: feedback.academicYear || '2024-25'
      };
    });
    
    res.json({
      subject: {
        _id: subjectDoc._id,
        name: subjectDoc.name,
        code: subjectDoc.code,
        instructor: subjectDoc.instructor
      },
      totalRecords: feedbacks.length,
      csvData: csvData,
      exportInfo: {
        generatedAt: new Date().toISOString(),
        feedbackType: type || 'all',
        includesComments: true
      }
    });
    
  } catch (err: any) {
    console.error('Error generating CSV data:', err);
    res.status(500).json({ message: 'Failed to generate CSV data', error: err.message });
  }
};

export const getFeedbackSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    
    console.log(`🔍 [FEEDBACK SUMMARY] Querying feedback for subject ID: ${subjectId}`);
    // Fixed variable naming conflict
    
    // First check if the subject exists
    const subjectDoc = await Subject.findById(subjectId);
    
    if (!subjectDoc) {
      console.log(`❌ [FEEDBACK SUMMARY] Subject ${subjectId} not found`);
      res.status(404).json({ message: 'Subject not found' });
      return;
    }
    
    // Get all feedback for the specific subject
    const feedbacks = await Feedback.find({ subject: subjectId })
      .populate('student', 'name rollNumber branch')
      .populate('subject', 'name code instructor branch');
    
    console.log(`🔍 [FEEDBACK SUMMARY] Found ${feedbacks.length} feedback records for subject ${subjectId}`);
    
    if (feedbacks.length === 0) {
      console.log(`❌ [FEEDBACK SUMMARY] No feedback found for subject ${subjectId}`);
      // Return empty data structure with actual subject info for consistency
      res.status(200).json({
        subject: {
          _id: subjectDoc._id,
          name: subjectDoc.name,
          code: subjectDoc.code,
          instructor: subjectDoc.instructor,
          branch: subjectDoc.branch
        },
        totalFeedbacks: 0,
        averageRating: 0,
        categories: {},
        lastUpdated: new Date()
      });
      return;
    }
    
    const subjectInfo = feedbacks[0].subject as any;
    
    // Calculate average rating
    const totalRating = feedbacks.reduce((sum, feedback) => sum + (feedback.averageRating || 0), 0);
    const averageRating = feedbacks.length > 0 ? totalRating / feedbacks.length : 0;
    
    // Process categories and questions
    const categories: { [key: string]: { average: number; questions: { question: string; average: number; }[] } } = {};
    
    // Group answers by question and category
    const questionStats: { [question: string]: { answers: number[]; category: string } } = {};
    
    feedbacks.forEach(feedback => {
      feedback.answers.forEach((answer: any) => {
        if (answer.type === 'rating') { // Only process rating questions for statistics
          const questionText = answer.question || `Question ${answer._id}`;
          if (!questionStats[questionText]) {
            questionStats[questionText] = {
              answers: [],
              category: answer.category || 'General'
            };
          }
          questionStats[questionText].answers.push(answer.answer || 0);
        }
      });
    });
    
    // Calculate averages for each question and organize by categories
    Object.entries(questionStats).forEach(([question, data]) => {
      const questionAverage = data.answers.length > 0 ? data.answers.reduce((sum, ans) => sum + ans, 0) / data.answers.length : 0;
      const category = data.category;
      
      if (!categories[category]) {
        categories[category] = {
          average: 0,
          questions: []
        };
      }
      
      categories[category].questions.push({
        question,
        average: questionAverage
      });
    });
    
    // Calculate category averages
    Object.keys(categories).forEach(categoryName => {
      const categoryQuestions = categories[categoryName].questions;
      if (categoryQuestions.length > 0) {
        const categoryTotal = categoryQuestions.reduce((sum, q) => sum + q.average, 0);
        categories[categoryName].average = categoryTotal / categoryQuestions.length;
      }
    });
    
    const summary = {
      subjectId: subjectInfo._id,
      subjectName: subjectInfo.name,
      subjectCode: subjectInfo.code,
      instructor: subjectInfo.instructor,
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
    const activities: any[] = [];
    
    // Get recent feedback submissions
    const recentFeedback = await Feedback.find()
      .populate({
        path: 'student',
        select: 'name role',
        strictPopulate: false // Allow null values
      })
      .populate({
        path: 'subject', 
        select: 'name',
        strictPopulate: false // Allow null values
      })
      .sort({ createdAt: -1 })
      .limit(3);
    
    // Add feedback activities with null checks
    recentFeedback.forEach((feedback: any) => {
      const studentName = feedback.student?.name || 'Unknown Student';
      const subjectName = feedback.subject?.name || 'Unknown Subject';
      const userRole = feedback.student?.role || 'student';
      
      activities.push({
        _id: `feedback-${feedback._id}`,
        type: 'feedback',
        user: {
          _id: feedback.student?._id || 'unknown',
          name: studentName,
          role: userRole
        },
        description: `Submitted feedback for ${subjectName}`,
        timestamp: feedback.createdAt
      });
    });
    
    // Get recent user registrations
    const recentUsers = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(2);
    
    // Add user registration activities
    recentUsers.forEach((user: any) => {
      activities.push({
        _id: `register-${user._id}`,
        type: 'register',
        user: {
          _id: user._id,
          name: user.name || 'Unknown User',
          role: user.role || 'student'
        },
        description: `New student registered in the system`,
        timestamp: user.createdAt
      });
    });
    
    // Get recent subject additions
    const recentSubjects = await Subject.find()
      .sort({ createdAt: -1 })
      .limit(2);
    
    // Add subject creation activities (by admin)
    recentSubjects.forEach((subject: any) => {
      activities.push({
        _id: `subject-${subject._id}`,
        type: 'update',
        user: {
          _id: 'admin-system',
          name: 'System Admin',
          role: 'admin'
        },
        description: `Added new subject: ${subject.name || 'Unknown Subject'}`,
        timestamp: subject.createdAt
      });
    });
    
    // Sort activities by timestamp (most recent first)
    activities.sort((a: any, b: any) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    console.log(`✅ Returning ${activities.length} activities`);
    
    // Return only the most recent 5 activities
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

// Export feedback data as CSV - Anonymous version only (no student data)
export const exportFeedbackAsCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const { feedbackType = 'midterm' } = req.query;

    // Get subject details
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }

    // Get feedback for this subject (no student population needed)
    const feedbacks = await Feedback.find({ 
      subject: subjectId,
      feedbackType: feedbackType 
    });

    if (feedbacks.length === 0) {
      res.status(404).json({ 
        message: `No ${feedbackType} feedback found for this subject`,
        subjectName: subject.name,
        subjectCode: subject.code,
        instructor: subject.instructor,
        feedbackType: feedbackType,
        suggestion: `${feedbackType} feedback has not been submitted yet by any student for this subject. Please check back after students have completed their feedback submissions.`
      });
      return;
    }

    // Prepare anonymous CSV content
    let csvContent = '';
    
    // CSV Headers - Anonymous format with overall statistics
    csvContent += 'ANONYMOUS FEEDBACK SUMMARY REPORT\n';
    csvContent += `Subject: ${subject.name} (${subject.code})\n`;
    csvContent += `Instructor: ${subject.instructor}\n`;
    csvContent += `Feedback Type: ${feedbackType}\n`;
    csvContent += `Total Responses: ${feedbacks.length}\n`;
    csvContent += `Generated: ${new Date().toLocaleDateString()}\n\n`;

    // Calculate overall average
    const allRatings = feedbacks.map(f => f.averageRating || 0).filter(r => r > 0);
    const overallAverage = allRatings.length > 0 ? 
      (allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length).toFixed(2) : '0.00';

    csvContent += `Overall Average Rating: ${overallAverage}/5.0\n\n`;

    // Question-wise analysis
    csvContent += 'Question Analysis:\n';
    csvContent += 'Question,Average Rating,Total Responses\n';

    // Calculate question averages
    const questionStats: { [question: string]: { total: number; count: number; } } = {};
    
    feedbacks.forEach(feedback => {
      feedback.answers.forEach((answer: any) => {
        if (answer.type === 'rating' && answer.answer > 0) {
          const question = answer.question || 'Unknown Question';
          if (!questionStats[question]) {
            questionStats[question] = { total: 0, count: 0 };
          }
          questionStats[question].total += answer.answer || 0;
          questionStats[question].count += 1;
        }
      });
    });

    // Add question statistics
    Object.entries(questionStats).forEach(([question, stats]) => {
      const average = stats.count > 0 ? (stats.total / stats.count).toFixed(2) : '0.00';
      const escapedQuestion = question.includes(',') ? `"${question.replace(/"/g, '""')}"` : question;
      csvContent += `${escapedQuestion},${average}/5,${stats.count}\n`;
    });

    csvContent += '\n';

    // Anonymous comments section
    csvContent += 'Anonymous Comments:\n';
    csvContent += 'Comment\n';

    // Extract all comments anonymously
    let commentCount = 0;
    feedbacks.forEach(feedback => {
      feedback.answers.forEach((answer: any) => {
        if (answer.type === 'comment' && answer.comment && answer.comment.trim()) {
          const comment = answer.comment.trim();
          
          // Escape CSV special characters
          const escapeCSV = (text: string) => {
            if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
              return `"${text.replace(/"/g, '""')}"`;
            }
            return text;
          };
          
          csvContent += `${escapeCSV(comment)}\n`;
          commentCount++;
        }
      });
    });

    if (commentCount === 0) {
      csvContent += 'No comments provided\n';
    }

    csvContent += '\n';
    csvContent += 'NOTE: This is an anonymous report. No student identification data is included.\n';

    // Set response headers for CSV download
    const safeName = subject.name ? subject.name.replace(/[^a-z0-9]/gi, '_') : 'Unknown_Subject';
    const filename = `${subject.code}_${safeName}_Anonymous_${feedbackType}_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Send CSV content
    res.send(csvContent);
    
  } catch (err: any) {
    console.error('Error exporting feedback as CSV:', err);
    res.status(500).json({ message: 'Error exporting feedback data', error: err.message });
  }
};

// New endpoint for anonymous faculty feedback reports
export const exportAnonymousFacultyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const { feedbackType = 'midterm' } = req.query;

    // Get subject details
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      res.status(404).json({ 
        message: `No ${feedbackType} feedback found for this subject`,
        subjectName: 'Unknown Subject',
        subjectCode: 'N/A',
        instructor: 'N/A',
        feedbackType: feedbackType,
        suggestion: `${feedbackType} feedback has not been submitted yet by any student for this subject. Please check back after students have completed their feedback submissions.`
      });
      return;
    }

    // Get feedback for this subject (no student population needed for anonymous report)
    const feedbacks = await Feedback.find({ 
      subject: subjectId,
      feedbackType: feedbackType 
    });

    if (feedbacks.length === 0) {
      res.status(404).json({ 
        message: `No ${feedbackType} feedback found for this subject`,
        subjectName: subject.name,
        subjectCode: subject.code,
        instructor: subject.instructor,
        feedbackType: feedbackType,
        suggestion: `${feedbackType} feedback has not been submitted yet by any student for this subject. Please check back after students have completed their feedback submissions.`
      });
      return;
    }

    // Create anonymous faculty feedback report with only aggregate data
    let csvContent = '';
    
    // Header section with subject information only
    csvContent += 'ANONYMOUS FACULTY FEEDBACK REPORT\n';
    csvContent += `Subject: ${subject.name} (${subject.code})\n`;
    csvContent += `Instructor: ${subject.instructor}\n`;
    csvContent += `Department: ${subject.department || 'N/A'}\n`;
    csvContent += `Academic Year: ${subject.year || 'N/A'} - Term ${subject.term || 'N/A'}\n`;
    csvContent += `Feedback Type: ${feedbackType}\n`;
    csvContent += `Total Responses: ${feedbacks.length}\n`;
    csvContent += `Report Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    // Calculate overall average rating across all feedback
    const allRatings = feedbacks.map(f => f.averageRating || 0).filter(r => r > 0);
    const overallAverage = allRatings.length > 0 ? 
      (allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length).toFixed(2) : '0.00';
    
    csvContent += 'OVERALL PERFORMANCE SUMMARY\n';
    csvContent += `Overall Average Rating: ${overallAverage}/5.0\n`;
    csvContent += `Response Rate: ${feedbacks.length} students participated\n\n`;
    
    // Rating Questions Analysis (aggregate data only)
    csvContent += 'QUESTION-WISE ANALYSIS\n';
    csvContent += 'Question,Average Rating,Response Count,Performance Level\n';
    
    // Calculate averages for rating questions
    const questionStats: { [question: string]: { total: number; count: number; } } = {};
    
    feedbacks.forEach(feedback => {
      feedback.answers.forEach((answer: any) => {
        if (answer.type === 'rating' && answer.answer > 0) {
          const question = answer.question || 'Unknown Question';
          if (!questionStats[question]) {
            questionStats[question] = { total: 0, count: 0 };
          }
          questionStats[question].total += answer.answer || 0;
          questionStats[question].count += 1;
        }
      });
    });
    
    // Add rating summary to CSV
    Object.entries(questionStats).forEach(([question, stats]) => {
      const average = stats.count > 0 ? (stats.total / stats.count).toFixed(2) : '0.00';
      const performance = parseFloat(average) >= 4.0 ? 'Excellent' : 
                         parseFloat(average) >= 3.5 ? 'Good' : 
                         parseFloat(average) >= 3.0 ? 'Satisfactory' : 'Needs Improvement';
      
      // Escape CSV special characters
      const escapedQuestion = question.includes(',') ? `"${question.replace(/"/g, '""')}"` : question;
      csvContent += `${escapedQuestion},${average}/5,${stats.count},${performance}\n`;
    });
    
    csvContent += '\n';
    
    // Comments Section (completely anonymous)
    csvContent += 'ANONYMOUS STUDENT COMMENTS\n';
    csvContent += 'Comment Category,Student Feedback\n';
    
    // Collect all comments without any student identification
    let hasComments = false;
    feedbacks.forEach(feedback => {
      feedback.answers.forEach((answer: any) => {
        if (answer.type === 'comment' && answer.comment && answer.comment.trim()) {
          const category = answer.category || 'General Feedback';
          const comment = answer.comment.trim();
          
          // Escape CSV special characters
          const escapeCSV = (text: string) => {
            if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
              return `"${text.replace(/"/g, '""')}"`;
            }
            return text;
          };
          
          csvContent += `${escapeCSV(category)},${escapeCSV(comment)}\n`;
          hasComments = true;
        }
      });
    });
    
    // If no comments found
    if (!hasComments) {
      csvContent += 'General Feedback,No written feedback provided by students\n';
    }
    
    csvContent += '\n';
    
    // Summary statistics
    csvContent += 'RATING DISTRIBUTION SUMMARY\n';
    csvContent += 'Rating Range,Number of Responses,Percentage\n';
    
    const ratingRanges = [
      { range: '4.5 - 5.0 (Excellent)', min: 4.5, max: 5.0 },
      { range: '3.5 - 4.4 (Good)', min: 3.5, max: 4.4 },
      { range: '2.5 - 3.4 (Satisfactory)', min: 2.5, max: 3.4 },
      { range: '1.5 - 2.4 (Poor)', min: 1.5, max: 2.4 },
      { range: '1.0 - 1.4 (Very Poor)', min: 1.0, max: 1.4 }
    ];
    
    ratingRanges.forEach(({ range, min, max }) => {
      const count = allRatings.filter(rating => rating >= min && rating <= max).length;
      const percentage = allRatings.length > 0 ? ((count / allRatings.length) * 100).toFixed(1) : '0.0';
      csvContent += `${range},${count},${percentage}%\n`;
    });
    
    csvContent += '\n';
    csvContent += 'NOTE: This report contains only aggregated data to maintain student anonymity.\n';
    csvContent += 'Individual student responses and identities are not included in this report.\n';

    // Set response headers for CSV download
    const safeName = subject.name ? subject.name.replace(/[^a-z0-9]/gi, '_') : 'Unknown_Subject';
    const filename = `${subject.code}_${safeName}_Anonymous_Faculty_Report_${feedbackType}_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Send CSV content
    res.send(csvContent);
    
  } catch (err: any) {
    console.error('Error exporting anonymous faculty report:', err);
    res.status(500).json({ message: 'Error exporting faculty report', error: err.message });
  }
};

// Batch check feedback availability for multiple subjects
export const batchCheckFeedbackAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectIds } = req.body;
    const { feedbackType = 'midterm' } = req.query;

    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      res.status(400).json({ message: 'subjectIds array is required' });
      return;
    }

    // Get all subjects in one query
    const subjects = await Subject.find({ _id: { $in: subjectIds } });
    const subjectMap = new Map(subjects.map(s => [s._id.toString(), s]));

    // Get feedback counts for all subjects in one aggregation
    const feedbackCounts = await Feedback.aggregate([
      {
        $match: {
          subject: { $in: subjectIds.map((id: string) => id) },
          feedbackType: feedbackType
        }
      },
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 }
        }
      }
    ]);

    // Build response map
    const result: { [key: string]: any } = {};
    
    for (const subjectId of subjectIds) {
      const subject = subjectMap.get(subjectId);
      const feedbackData = feedbackCounts.find(fc => fc._id.toString() === subjectId);
      const count = feedbackData ? feedbackData.count : 0;

      result[subjectId] = {
        subjectName: subject?.name || 'Unknown Subject',
        subjectCode: subject?.code || 'N/A',
        instructor: subject?.instructor || 'N/A',
        feedbackType: feedbackType,
        feedbackCount: count,
        available: count > 0
      };
    }

    res.json(result);
  } catch (err: any) {
    console.error('Error batch checking feedback availability:', err);
    res.status(500).json({ message: 'Error checking feedback availability', error: err.message });
  }
};

// Check if feedback exists for a subject without downloading
export const checkFeedbackAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const { feedbackType = 'midterm' } = req.query;

    // Get subject details
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }

    // Count feedback for this subject
    const feedbackCount = await Feedback.countDocuments({ 
      subject: subjectId,
      feedbackType: feedbackType 
    });

    if (feedbackCount === 0) {
      res.status(404).json({ 
        message: `No ${feedbackType} feedback found for this subject`,
        subjectName: subject.name,
        subjectCode: subject.code,
        instructor: subject.instructor,
        feedbackType: feedbackType,
        feedbackCount: 0,
        suggestion: `${feedbackType} feedback has not been submitted yet by any student for this subject. Please check back after students have completed their feedback submissions.`
      });
      return;
    }

    res.json({
      message: `${feedbackType} feedback is available`,
      subjectName: subject.name,
      subjectCode: subject.code,
      instructor: subject.instructor,
      feedbackType: feedbackType,
      feedbackCount: feedbackCount,
      available: true
    });
  } catch (err: any) {
    console.error('Error checking feedback availability:', err);
    res.status(500).json({ message: 'Error checking feedback availability', error: err.message });
  }
};

// Debug endpoint to check feedback structure
export const debugFeedbackStructure = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const { feedbackType = 'midterm' } = req.query;

    const feedbacks = await Feedback.find({ 
      subject: subjectId,
      feedbackType: feedbackType 
    }).populate('student', 'name rollNumber');

    const debugData = feedbacks.map(feedback => ({
      id: feedback._id,
      studentName: (feedback.student as any)?.name || 'Unknown',
      totalAnswers: feedback.answers?.length || 0,
      ratingAnswers: feedback.answers?.filter((ans: any) => ans.type === 'rating')?.length || 0,
      commentAnswers: feedback.answers?.filter((ans: any) => ans.type === 'comment')?.length || 0,
      answers: feedback.answers?.map((ans: any) => ({
        question: ans.question,
        type: ans.type,
        answer: ans.answer,
        comment: ans.comment,
        hasComment: !!ans.comment
      })) || []
    }));

    res.json({
      message: 'Debug feedback structure',
      subjectId,
      feedbackType,
      totalFeedbacks: feedbacks.length,
      feedbacks: debugData
    });
  } catch (err: any) {
    console.error('Error debugging feedback:', err);
    res.status(500).json({ message: 'Error debugging feedback', error: err.message });
  }
};

// Export detailed student responses for a specific subject with timestamps
export const exportDetailedStudentResponses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const feedbackTypeParam = req.query.feedbackType;
    const feedbackType = (typeof feedbackTypeParam === 'string' ? feedbackTypeParam : 'midterm') as 'midterm' | 'endterm';

    console.log(`🔍 Generating detailed student responses report for subject: ${subjectId}, type: ${feedbackType}`);

    // Validate subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      res.status(404).json({ 
        message: 'Subject not found',
        subjectId 
      });
      return;
    }

    // Get all feedback for this subject and feedback type with student details
    const feedbacks = await Feedback.find({ 
      subject: subjectId, 
      feedbackType 
    })
    .populate('student', 'name email rollNumber branch section year')
    .populate('subject', 'name code instructor')
    .sort({ createdAt: -1 }); // Most recent first

    if (!feedbacks || feedbacks.length === 0) {
      res.status(404).json({ 
        message: `No ${feedbackType} feedback available for subject: ${subject.name}`,
        subjectName: subject.name,
        subjectCode: subject.code,
        instructor: subject.instructor,
        feedbackType,
        totalResponses: 0
      });
      return;
    }

    console.log(`📊 Found ${feedbacks.length} feedback responses for detailed report`);

    // Prepare CSV content with detailed student responses
    let csvContent = '';
    
    // Header information
    csvContent += `DETAILED STUDENT FEEDBACK RESPONSES REPORT\n`;
    csvContent += `Subject: ${subject.name} (${subject.code})\n`;
    csvContent += `Instructor: ${subject.instructor}\n`;
    csvContent += `Feedback Type: ${feedbackType.toUpperCase()}\n`;
    csvContent += `Total Responses: ${feedbacks.length}\n`;
    csvContent += `Generated On: ${new Date().toLocaleString()}\n`;
    csvContent += `\n`;

    // Warning about data sensitivity
    csvContent += `⚠️  CONFIDENTIAL DATA - HANDLE WITH CARE\n`;
    csvContent += `This report contains individual student responses and should be handled according to privacy policies.\n`;
    csvContent += `\n`;

    // CSV Headers
    const headers = [
      'Response #',
      'Student Name',
      'Roll Number',
      'Email',
      'Branch',
      'Section', 
      'Year',
      'Submission Date',
      'Submission Time',
      'Time Since Submission',
      'Question #',
      'Question Category',
      'Question Text',
      'Question Type',
      'Rating (1-5)',
      'Comment/Response',
      'Average Rating (All Questions)'
    ];
    
    csvContent += headers.join(',') + '\n';

    // Process each feedback response
    feedbacks.forEach((feedback: any, responseIndex: number) => {
      const student = feedback.student;
      const submissionDate = new Date(feedback.createdAt);
      const timeSinceSubmission = getTimeSinceSubmission(submissionDate);
      
      // Process each answer in the feedback
      feedback.answers.forEach((answer: any, questionIndex: number) => {
        const row = [
          responseIndex + 1,
          `"${student?.name || 'Anonymous'}"`,
          `"${student?.rollNumber || 'N/A'}"`,
          `"${student?.email || 'N/A'}"`,
          `"${student?.branch || 'N/A'}"`,
          `"${student?.section || 'N/A'}"`,
          student?.year || 'N/A',
          submissionDate.toLocaleDateString(),
          submissionDate.toLocaleTimeString(),
          `"${timeSinceSubmission}"`,
          questionIndex + 1,
          `"${answer.category || 'General'}"`,
          `"${answer.question?.replace(/"/g, '""') || 'N/A'}"`,
          answer.type || 'rating',
          answer.type === 'rating' ? (answer.answer || 0) : 'N/A',
          `"${answer.type === 'comment' ? (answer.comment?.replace(/"/g, '""') || 'No comment') : (answer.answer ? `${answer.answer}/5` : 'No rating')}"`,
          feedback.averageRating?.toFixed(2) || 'N/A'
        ];
        
        csvContent += row.join(',') + '\n';
      });
      
      // Add empty row between different students for better readability
      csvContent += '\n';
    });

    // Summary statistics
    csvContent += '\n';
    csvContent += 'SUMMARY STATISTICS\n';
    csvContent += `Total Students Responded: ${feedbacks.length}\n`;
    
    // Calculate overall statistics
    const allRatings = feedbacks.flatMap((f: any) => 
      f.answers.filter((a: any) => a.type === 'rating' && a.answer > 0).map((a: any) => a.answer)
    );
    
    if (allRatings.length > 0) {
      const overallAverage = allRatings.reduce((sum: number, rating: number) => sum + rating, 0) / allRatings.length;
      csvContent += `Overall Average Rating: ${overallAverage.toFixed(2)}/5\n`;
      csvContent += `Total Rating Responses: ${allRatings.length}\n`;
      csvContent += `Highest Rating Given: ${Math.max(...allRatings)}\n`;
      csvContent += `Lowest Rating Given: ${Math.min(...allRatings)}\n`;
    }

    // Count comments
    const totalComments = feedbacks.reduce((count: number, f: any) => 
      count + f.answers.filter((a: any) => a.type === 'comment' && a.comment?.trim()).length, 0
    );
    csvContent += `Total Comments Provided: ${totalComments}\n`;

    // Response time analysis
    const submissionTimes = feedbacks.map((f: any) => new Date(f.createdAt));
    const firstSubmission = new Date(Math.min(...submissionTimes.map(t => t.getTime())));
    const lastSubmission = new Date(Math.max(...submissionTimes.map(t => t.getTime())));
    
    csvContent += `First Response: ${firstSubmission.toLocaleString()}\n`;
    csvContent += `Last Response: ${lastSubmission.toLocaleString()}\n`;
    csvContent += `Response Period: ${getTimeBetween(firstSubmission, lastSubmission)}\n`;

    csvContent += '\n';
    csvContent += 'NOTE: This report contains sensitive student data and should be handled according to institutional privacy policies.\n';
    csvContent += 'Individual student responses are provided for detailed analysis and should remain confidential.\n';

    // Set response headers for CSV download
    const safeName = subject.name ? subject.name.replace(/[^a-z0-9]/gi, '_') : 'Unknown_Subject';
    const filename = `${subject.code}_${safeName}_Detailed_Student_Responses_${feedbackType}_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Send CSV content
    res.send(csvContent);
    
  } catch (err: any) {
    console.error('Error generating detailed student responses report:', err);
    res.status(500).json({ 
      message: 'Error generating detailed student responses report', 
      error: err.message 
    });
  }
};

// Helper function to calculate time since submission
function getTimeSinceSubmission(submissionDate: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - submissionDate.getTime();
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days} day(s), ${hours} hour(s) ago`;
  } else if (hours > 0) {
    return `${hours} hour(s), ${minutes} minute(s) ago`;
  } else {
    return `${minutes} minute(s) ago`;
  }
}

// Helper function to calculate time between two dates
function getTimeBetween(startDate: Date, endDate: Date): string {
  const diffMs = endDate.getTime() - startDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} day(s), ${hours} hour(s)`;
  } else if (hours > 0) {
    return `${hours} hour(s)`;
  } else {
    const minutes = Math.floor(diffMs / (1000 * 60));
    return `${minutes} minute(s)`;
  }
};