import 'dotenv/config';
import express from 'express';
import connectDB from './config/db';
import cors from 'cors';
import { emailService } from './services/emailService';

import authRoutes from './routes/authRoutes';
import subjectRoutes from './routes/subjectRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import hodRoutes from './routes/hodRoutes';
import deanRoutes from './routes/deanRoutes';
import settingsRoutes from './routes/settingsRoutes';
import adminRoutes from './routes/adminRoutes';
import testRoutes from './routes/testRoutes';
import testEmailRoutes from './routes/testEmailRoutes';
import feedbackPeriodRoutes from './routes/feedbackPeriodRoutes';

const app = express();

// Middleware
app.use(express.json());

// For debugging CORS requests
app.use((req, res, next) => {
  console.log(`[CORS DEBUG] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// CORS configuration - completely permissive for development
const corsOptions = {
  origin: '*', // Allow any origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin', 'X-Auth-Token', 
                  'Cache-Control', 'Pragma', 'Expires', 'Content-Length', 'X-FP-API-KEY'], 
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 204,
  preflightContinue: false // Don't continue to the next handler for preflight
};

// Apply CORS to all routes using the cors package
app.use(cors(corsOptions));

// Custom middleware function to ensure all responses have CORS headers
const corsMiddleware = (req: any, res: any, next: any) => {
  // Add CORS headers to every response
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, X-Auth-Token, Cache-Control, Pragma, Expires');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    // Send response for OPTIONS preflight request
    return res.status(204).end();
  }
  
  next();
};

// Apply the custom CORS middleware
app.use(corsMiddleware);

// DB Connection
connectDB();

// Initialize email service with production guidance
emailService.verifyConnection().then(isReady => {
  if (isReady) {
    console.log('✅ Email service initialized successfully');
  } else {
    console.log('⚠️  Email service not configured properly.');
    
    // Provide production guidance
    if (process.env.NODE_ENV === 'production') {
      console.log('📧 PRODUCTION EMAIL GUIDANCE:');
      console.log('   • Hosting platforms (Render, Heroku) often block SMTP');
      console.log('   • Consider using SendGrid for reliable email delivery');
      console.log('   • Set EMAIL_SERVICE=sendgrid and SENDGRID_API_KEY in environment');
      console.log('   • Alternative: Email will be logged to console for manual delivery');
    } else {
      console.log('💡 Check your EMAIL_USER and EMAIL_PASSWORD environment variables');
    }
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/dean', deanRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/test', testRoutes);
app.use('/api/email-test', testEmailRoutes);
app.use('/api/feedback-periods', feedbackPeriodRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Cache-Control, Pragma, Expires');
  
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001
  });
});

// API Health check endpoint  
app.get('/api/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Cache-Control, Pragma, Expires');
  
  res.status(200).json({ 
    status: 'ok', 
    message: 'API is healthy', 
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    environment: process.env.NODE_ENV || 'development'
  });
});
 
// Test routes
app.get('/', (req, res) => {
  // Add explicit CORS headers for root endpoint too
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, X-Auth-Token, Cache-Control, Pragma, Expires');
  
  res.send('API is running with CORS support...');
});

// Development only - public endpoints for testing (no auth required)
if (process.env.NODE_ENV !== 'production') {
  // Public endpoint for testing subjects (no auth needed) - supports filtering
  app.get('/api/test/subjects', async (req, res) => {
    try {
      const Subject = require('./models/Subject').default;
      const { year, term, branch } = req.query;
      
      let filter: any = {};
      if (year && year !== 'all') filter.year = parseInt(year as string);
      if (term && term !== 'all') filter.term = parseInt(term as string);
      if (branch && branch !== 'all') filter.branch = { $in: [branch] };
      
      const subjects = await Subject.find(filter);
      res.json(subjects);
    } catch (error: any) {
      console.error('Error fetching test subjects:', error);
      res.status(500).json({ message: 'Error fetching subjects', error: error.message });
    }
  });

  // Public endpoint for testing feedback stats (no auth needed) - supports filtering
  app.get('/api/test/feedback/stats', async (req, res) => {
    try {
      const Feedback = require('./models/Feedback').default;
      const Subject = require('./models/Subject').default;
      const User = require('./models/User').default;
      
      const { year, term, branch } = req.query;
      
      // Build subject filter
      let subjectFilter: any = {};
      if (year && year !== 'all') subjectFilter.year = parseInt(year as string);
      if (term && term !== 'all') subjectFilter.term = parseInt(term as string);
      if (branch && branch !== 'all') subjectFilter.branch = { $in: [branch] };
      
      // Get filtered subjects
      const filteredSubjects = await Subject.find(subjectFilter);
      const subjectIds = filteredSubjects.map((s: any) => s._id);
      
      // Build feedback filter
      let feedbackFilter: any = {};
      if (subjectIds.length > 0) {
        feedbackFilter.subject = { $in: subjectIds };
      }
      
      const totalFeedback = await Feedback.countDocuments(feedbackFilter);
      const totalSubjects = filteredSubjects.length;
      const totalStudents = await User.countDocuments({ role: 'student' });
      
      // Calculate average rating for filtered feedback
      const averageRating = await Feedback.aggregate([
        { $match: feedbackFilter },
        { $group: { _id: null, avg: { $avg: '$averageRating' } } }
      ]);
      
      // Calculate faculty ratings for filtered subjects
      const facultyRatings: { [key: string]: number } = {};
      for (const subject of filteredSubjects) {
        const subjectFeedbacks = await Feedback.find({ subject: subject._id });
        if (subjectFeedbacks.length > 0) {
          const avgRating = subjectFeedbacks.reduce((sum: number, f: any) => sum + (f.averageRating || 0), 0) / subjectFeedbacks.length;
          facultyRatings[subject.instructor] = parseFloat(avgRating.toFixed(2));
        }
      }
      
      res.json({
        totalFeedback,
        totalSubjects,
        totalStudents,
        averageRating: averageRating[0]?.avg || 0,
        subjectsWithFeedback: Object.keys(facultyRatings).length,
        facultyRatings
      });
    } catch (error: any) {
      console.error('Error fetching test feedback stats:', error);
      res.status(500).json({ message: 'Error fetching feedback stats', error: error.message });
    }
  });

  // Public endpoint for cumulative subject data (no auth needed) - for reports
  app.get('/api/test/feedback/cumulative', async (req, res) => {
    try {
      const { year, term, branch, section } = req.query;
      const Feedback = require('./models/Feedback').default;
      const Subject = require('./models/Subject').default;
      const User = require('./models/User').default;
      
      // Build match conditions for filtering
      let subjectFilter: any = {};
      if (year && year !== 'all') subjectFilter.year = parseInt(year as string);
      if (term && term !== 'all') subjectFilter.term = parseInt(term as string);
      if (branch && branch !== 'all') subjectFilter.branch = { $in: [branch] };
      
      // Get filtered subjects
      const filteredSubjects = await Subject.find(subjectFilter);
      const subjectIds = filteredSubjects.map((s: any) => s._id);
      
      // Build feedback filter
      let feedbackFilter: any = {};
      if (subjectIds.length > 0) {
        feedbackFilter.subject = { $in: subjectIds };
      }
      
      // Get cumulative data
      const cumulativeData = await Feedback.aggregate([
        { $match: feedbackFilter },
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
        // Apply section filter if needed
        ...(section && section !== 'all' ? [{ $match: { 'student.section': section } }] : []),
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
    } catch (error: any) {
      console.error('Error getting cumulative subject data:', error);
      res.status(500).json({ message: 'Server error while getting cumulative data', error: error.message });
    }
  });

  // Public endpoint for testing cumulative question data (no auth needed)
  app.get('/api/test/feedback/cumulative-questions', async (req: any, res: any) => {
    try {
      const { year, term, branch, section } = req.query;
      const Feedback = require('./models/Feedback').default;
      const Subject = require('./models/Subject').default;
      
      // Build subject filter
      let subjectFilter: any = {};
      if (year && year !== 'all') subjectFilter.year = parseInt(year as string);
      if (term && term !== 'all') subjectFilter.term = parseInt(term as string);
      if (branch && branch !== 'all') subjectFilter.branch = { $in: [branch] };
      
      // Get filtered subjects
      const filteredSubjects = await Subject.find(subjectFilter);
      const subjectIds = filteredSubjects.map((s: any) => s._id);
      
      // Build feedback filter
      let feedbackFilter: any = {};
      if (subjectIds.length > 0) {
        feedbackFilter.subject = { $in: subjectIds };
      }

      const questionData = await Feedback.aggregate([
        { $match: feedbackFilter },
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
        // Apply section filter if needed
        ...(section && section !== 'all' ? [{ $match: { 'student.section': section } }] : []),
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
            subjectCount: { $size: '$subjectBreakdown' }
          }
        },
        {
          $sort: { overallAverage: -1 }
        }
      ]);
      
      // Calculate additional statistics
      const questionStats = questionData.map((item: any) => {
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
    } catch (error: any) {
      console.error('Error getting cumulative question data:', error);
      res.status(500).json({ message: 'Server error while getting cumulative question data', error: error.message });
    }
  });

  // Public endpoint for testing feedback summary (no auth needed) - enhanced with categories
  app.get('/api/test/feedback/summary/:subjectId', async (req: any, res: any) => {
    try {
      const { subjectId } = req.params;
      const Feedback = require('./models/Feedback').default;
      const Subject = require('./models/Subject').default;
      
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({ message: 'Subject not found' });
      }
      
      const feedbacks = await Feedback.find({ subject: subjectId });
      const feedbackCount = feedbacks.length;
      
      if (feedbackCount === 0) {
        return res.json({
          subjectId,
          subjectName: subject.name,
          subjectCode: subject.code,
          instructor: subject.instructor,
          feedbackCount: 0,
          averageRating: 0,
          categories: {}
        });
      }
      
      // Calculate overall average rating
      const averageRating = feedbacks.reduce((sum: number, f: any) => sum + (f.averageRating || 0), 0) / feedbackCount;
      
      // Process feedback answers by categories
      const categories: any = {
        'Teaching Quality': {
          average: 0,
          questions: [
            { question: 'How would you rate the instructor\'s teaching methods?', average: 0 },
            { question: 'How clear were the instructor\'s explanations?', average: 0 },
            { question: 'How well did the instructor engage the class?', average: 0 }
          ]
        },
        'Course Content': {
          average: 0,
          questions: [
            { question: 'How relevant was the course content?', average: 0 },
            { question: 'How well-organized was the course material?', average: 0 },
            { question: 'How appropriate was the course difficulty?', average: 0 }
          ]
        },
        'Assessment': {
          average: 0,
          questions: [
            { question: 'How fair were the assignments and exams?', average: 0 },
            { question: 'How timely was the feedback on assignments?', average: 0 }
          ]
        },
        'Overall Experience': {
          average: 0,
          questions: [
            { question: 'How would you rate your overall learning experience?', average: 0 },
            { question: 'Would you recommend this course to other students?', average: 0 }
          ]
        }
      };
      
      // Calculate averages for each category and question
      // For demo purposes, we'll generate realistic ratings based on the overall average
      Object.keys(categories).forEach(categoryName => {
        const category = categories[categoryName];
        category.questions.forEach((q: any, index: number) => {
          // Generate a realistic rating within ±0.5 of the overall average
          const variation = (Math.random() - 0.5) * 1.0; // ±0.5 variation
          q.average = Math.max(1, Math.min(5, averageRating + variation));
          q.average = parseFloat(q.average.toFixed(2));
        });
        
        // Calculate category average from questions
        category.average = category.questions.reduce((sum: number, q: any) => sum + q.average, 0) / category.questions.length;
        category.average = parseFloat(category.average.toFixed(2));
      });
      
      res.json({
        subjectId,
        subjectName: subject.name,
        subjectCode: subject.code,
        instructor: subject.instructor,
        feedbackCount,
        averageRating: parseFloat(averageRating.toFixed(2)),
        categories
      });
    } catch (error: any) {
      console.error('Error fetching test feedback summary:', error);
      res.status(500).json({ message: 'Error fetching feedback summary', error: error.message });
    }
  });

  // Development only - endpoint to create sample data for testing reports
  app.post('/api/dev/create-sample-data', async (req, res) => {
    try {
      const Subject = require('./models/Subject').default;
      const Feedback = require('./models/Feedback').default;
      const User = require('./models/User').default;
      
      // Create sample subjects if they don't exist
      const sampleSubjects = [
        {
          name: 'Data Structures and Algorithms',
          code: 'CS101',
          year: 2,
          term: 3,
          department: 'Computer Science',
          instructor: 'Dr. Rajesh Kumar',
          branch: ['Computer Science', 'Information Technology'],
          questions: ['Teaching Quality', 'Course Content', 'Assessment']
        },
        {
          name: 'Database Management Systems',
          code: 'CS201',
          year: 2,
          term: 4,
          department: 'Computer Science',
          instructor: 'Dr. Priya Sharma',
          branch: ['Computer Science'],
          questions: ['Teaching Quality', 'Course Content', 'Assessment']
        },
        {
          name: 'Web Development',
          code: 'CS301',
          year: 3,
          term: 1,
          department: 'Computer Science',
          instructor: 'Prof. Amit Singh',
          branch: ['Computer Science', 'Information Technology'],
          questions: ['Teaching Quality', 'Course Content', 'Assessment']
        },
        {
          name: 'Machine Learning',
          code: 'CS401',
          year: 4,
          term: 3,
          department: 'Computer Science',
          instructor: 'Dr. Neha Patel',
          branch: ['Computer Science'],
          questions: ['Teaching Quality', 'Course Content', 'Assessment']
        },
        {
          name: 'Advanced Java Programming',
          code: 'MCA101',
          year: 1,
          term: 1,
          department: 'Computer Science',
          instructor: 'Prof. Sunita Sharma',
          branch: ['MCA Regular'],
          questions: ['Teaching Quality', 'Course Content', 'Assessment']
        },
        {
          name: 'Data Science Fundamentals',
          code: 'MCA201',
          year: 1,
          term: 2,
          department: 'Computer Science',
          instructor: 'Dr. Vikram Singh',
          branch: ['MCA DS'],
          questions: ['Teaching Quality', 'Course Content', 'Assessment']
        }
      ];
      
      const createdSubjects = [];
      for (const subjectData of sampleSubjects) {
        const existingSubject = await Subject.findOne({ code: subjectData.code });
        if (!existingSubject) {
          const subject = await Subject.create(subjectData);
          createdSubjects.push(subject);
        } else {
          createdSubjects.push(existingSubject);
        }
      }
      
      // Create sample students if they don't exist
      const sampleStudents = [
        { name: 'Student One', email: 'student1@test.com', password: 'password123', role: 'student' },
        { name: 'Student Two', email: 'student2@test.com', password: 'password123', role: 'student' },
        { name: 'Student Three', email: 'student3@test.com', password: 'password123', role: 'student' },
        { name: 'Student Four', email: 'student4@test.com', password: 'password123', role: 'student' },
        { name: 'Student Five', email: 'student5@test.com', password: 'password123', role: 'student' }
      ];
      
      const createdStudents = [];
      for (const studentData of sampleStudents) {
        const existingStudent = await User.findOne({ email: studentData.email });
        if (!existingStudent) {
          const student = await User.create(studentData);
          createdStudents.push(student);
        } else {
          createdStudents.push(existingStudent);
        }
      }
      
      // Create sample feedback
      let feedbackCreated = 0;
      for (const subject of createdSubjects) {
        for (const student of createdStudents) {
          // Create feedback for some subjects (not all to simulate realistic data)
          if (Math.random() > 0.3) { // 70% chance of feedback
            const existingFeedback = await Feedback.findOne({ 
              student: student._id, 
              subject: subject._id 
            });
            
            if (!existingFeedback) {
              const answers = [
                { question: 'How would you rate the instructor\'s teaching methods?', answer: Math.floor(Math.random() * 2) + 4 }, // 4-5
                { question: 'How clear were the instructor\'s explanations?', answer: Math.floor(Math.random() * 3) + 3 }, // 3-5
                { question: 'How well did the instructor engage the class?', answer: Math.floor(Math.random() * 2) + 4 }, // 4-5
                { question: 'How relevant was the course content?', answer: Math.floor(Math.random() * 3) + 3 }, // 3-5
                { question: 'How well-organized was the course material?', answer: Math.floor(Math.random() * 2) + 4 }, // 4-5
                { question: 'How appropriate was the course difficulty?', answer: Math.floor(Math.random() * 3) + 3 }, // 3-5
                { question: 'How fair were the assignments and exams?', answer: Math.floor(Math.random() * 2) + 4 }, // 4-5
                { question: 'How timely was the feedback on assignments?', answer: Math.floor(Math.random() * 3) + 3 }, // 3-5
                { question: 'How would you rate your overall learning experience?', answer: Math.floor(Math.random() * 2) + 4 }, // 4-5
                { question: 'Would you recommend this course to other students?', answer: Math.floor(Math.random() * 3) + 3 } // 3-5
              ];
              
              const averageRating = answers.reduce((sum, a) => sum + a.answer, 0) / answers.length;
              
              await Feedback.create({
                student: student._id,
                subject: subject._id,
                answers,
                averageRating
              });
              feedbackCreated++;
            }
          }
        }
      }
      
      res.json({ 
        message: 'Sample data created successfully',
        subjects: createdSubjects.length,
        students: createdStudents.length,
        feedback: feedbackCreated
      });
    } catch (error: any) {
      console.error('Error creating sample data:', error);
      res.status(500).json({ message: 'Error creating sample data', error: error.message });
    }
  });

  // Development only - endpoint to test midterm feedback system with existing subjects
  app.post('/api/dev/test-midterm-system', async (req: any, res: any) => {
    try {
      const Subject = require('./models/Subject').default;
      const User = require('./models/User').default;
      const Feedback = require('./models/Feedback').default;
      
      // Get existing subjects and users
      const existingSubjects = await Subject.find().limit(3);
      const existingStudents = await User.find({ role: 'student' }).limit(2);
      
      if (existingSubjects.length === 0) {
        return res.status(404).json({ 
          message: 'No subjects found. Please create some subjects first through the admin interface.',
          suggestion: 'Go to Admin Dashboard → Subjects → Add Subject'
        });
      }
      
      if (existingStudents.length === 0) {
        return res.status(404).json({ 
          message: 'No students found. Please create some student accounts first.',
          suggestion: 'Go to Admin Dashboard → User Management → Add User'
        });
      }
      
      // Test the midterm feedback system
      let testResults = {
        subjectsAvailable: existingSubjects.length,
        studentsAvailable: existingStudents.length,
        midtermFeedbackCount: 0,
        subjects: existingSubjects.map((s: any) => ({
          id: s._id,
          name: s.name,
          code: s.code,
          instructor: s.instructor,
          hasQuestions: s.questions && s.questions.length > 0
        }))
      };
      
      // Count existing midterm feedback
      const midtermFeedbackCount = await Feedback.countDocuments({ feedbackType: 'midterm' });
      testResults.midtermFeedbackCount = midtermFeedbackCount;
      
      res.json({ 
        message: 'Midterm feedback system ready to test with existing data',
        data: testResults,
        instructions: {
          forStudents: 'Students can now submit midterm feedback by going to Subjects → Select Subject → Submit Feedback',
          forAdmins: 'Admins can view midterm feedback in the reports section',
          note: 'The new system supports both midterm and endterm feedback types'
        }
      });
    } catch (error: any) {
      console.error('Error testing midterm system:', error);
      res.status(500).json({ message: 'Error testing midterm system', error: error.message });
    }
  });

  // Development only - endpoint to create test accounts
  app.post('/api/dev/create-test-accounts', async (req, res) => {
    try {
      const User = require('./models/User').default;
      
      // Create admin user
      const adminExists = await User.findOne({ email: 'sanju.admin@gmail.com' });
      if (!adminExists) {
        await User.create({
          name: 'Sanju Admin',
          email: 'sanju.admin@gmail.com',
          password: 'admin123',
          role: 'admin'
        });
        console.log('Test admin created: sanju.admin@gmail.com / admin123');
      }
      
      // Create student user
      const studentExists = await User.findOne({ email: 'student@test.com' });
      if (!studentExists) {
        await User.create({
          name: 'Test Student',
          email: 'student@test.com',
          password: 'student123',
          role: 'student',
          rollNumber: 'ST001',
          branch: 'Computer Science',
          passwordResetRequired: false
        });
        console.log('Test student created: student@test.com / student123');
      }
      
      res.json({ 
        message: 'Test accounts created successfully',
        accounts: {
          admin: { email: 'sanju.admin@gmail.com', password: 'admin123' },
          student: { email: 'student@test.com', password: 'student123' }
        }
      });
    } catch (error: any) {
      console.error('Error creating test accounts:', error);
      res.status(500).json({ message: 'Error creating test accounts', error: error.message });
    }
  });

  // Debug endpoint to check users
  app.get('/api/dev/check-users', async (req, res) => {
    try {
      const User = require('./models/User').default;
      const users = await User.find({}, { password: 0 }); // exclude password field
      res.json(users);
    } catch (error: any) {
      console.error('Error checking users:', error);
      res.status(500).json({ message: 'Error checking users', error: error.message });
    }
  });

  // Debug endpoint to test password comparison
  app.post('/api/dev/test-login', async (req: any, res: any) => {
    try {
      const { email, password } = req.body;
      const User = require('./models/User').default;
      const bcrypt = require('bcryptjs');
      
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        return res.json({ error: 'User not found' });
      }
      
      console.log('User found:', { email: user.email, hasPassword: !!user.password });
      console.log('Password from DB (first 20 chars):', user.password.substring(0, 20));
      console.log('Password provided:', password);
      
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password match result:', isMatch);
      
      res.json({
        userExists: true,
        passwordProvided: password,
        passwordHashPrefix: user.password.substring(0, 20),
        isMatch: isMatch
      });
    } catch (error: any) {
      console.error('Debug login error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create a fresh test admin with proper password
  app.post('/api/dev/create-fresh-admin', async (req, res) => {
    try {
      const User = require('./models/User').default;
      const bcrypt = require('bcryptjs');
      
      // Delete existing admin
      await User.deleteOne({ email: 'admin@test.com' });
      
      // Manually hash the password
      const password = '123456';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      console.log('Creating admin with manually hashed password');
      console.log('Plain password:', password);
      console.log('Hashed password:', hashedPassword);
      
      // Create admin without triggering the pre-save hook by setting password directly
      const admin = new User({
        name: 'Fresh Test Admin',
        email: 'admin@test.com',
        role: 'admin',
        passwordResetRequired: false
      });
      
      // Set password directly to bypass pre-save hook
      admin.password = hashedPassword;
      await admin.save({ validateBeforeSave: false });
      
      // Test the password immediately
      const testUser = await User.findOne({ email: 'admin@test.com' }).select('+password');
      const isMatch = await bcrypt.compare(password, testUser.password);
      
      res.json({ 
        message: 'Fresh admin created',
        email: 'admin@test.com',
        password: '123456',
        hashWorks: isMatch
      });
    } catch (error: any) {
      console.error('Error creating fresh admin:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create test data for better demo
  app.post('/api/dev/create-test-data', async (req, res) => {
    try {
      const User = require('./models/User').default;
      const Subject = require('./models/Subject').default;
      const Feedback = require('./models/Feedback').default;
      
      // Create a few test students
      const students = [];
      for (let i = 1; i <= 5; i++) {
        const student = await User.create({
          name: `Test Student ${i}`,
          email: `student${i}@test.com`,
          password: '123456',
          role: 'student',
          rollNumber: `ST00${i}`,
          branch: i % 2 === 0 ? 'MCA Regular' : 'MCA DS',
          passwordResetRequired: false
        });
        students.push(student);
      }
      
      // Create a few test subjects
      const subjects = [];
      const subjectData = [
        { name: 'Advanced Database Systems', code: 'ADS101', instructor: 'Dr. Smith' },
        { name: 'Machine Learning', code: 'ML101', instructor: 'Prof. Johnson' },
        { name: 'Web Development', code: 'WD101', instructor: 'Dr. Brown' },
        { name: 'Data Structures', code: 'DS101', instructor: 'Prof. Davis' }
      ];
      
      for (const subData of subjectData) {
        const subject = await Subject.create(subData);
        subjects.push(subject);
      }
      
      // Create some test feedback
      const feedbackSamples = [];
      for (let i = 0; i < 10; i++) {
        const student = students[i % students.length];
        const subject = subjects[i % subjects.length];
        
        const rating = Math.floor(Math.random() * 5) + 1; // 1-5 rating
        const answers = Array(10).fill(null).map((_, index) => ({
          question: `Question ${index + 1}`,
          answer: Math.floor(Math.random() * 5) + 1
        }));
        
        const feedback = await Feedback.create({
          student: student._id,
          subject: subject._id,
          answers: answers,
          averageRating: rating
        });
        feedbackSamples.push(feedback);
      }
      
      res.json({
        message: 'Test data created successfully',
        data: {
          students: students.length,
          subjects: subjects.length,
          feedbacks: feedbackSamples.length
        }
      });
    } catch (error: any) {
      console.error('Error creating test data:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Public dean test endpoints (no auth needed for development)
  app.get('/api/test/dean/reports', async (req, res) => {
    try {
      const Subject = require('./models/Subject').default;
      const Feedback = require('./models/Feedback').default;
      const User = require('./models/User').default;
      
      const { year, term, branch } = req.query;
      
      // Build subject filter
      let subjectFilter: any = {};
      if (year && year !== 'all') subjectFilter.year = parseInt(year as string);
      if (term && term !== 'all') subjectFilter.term = parseInt(term as string);
      if (branch && branch !== 'all') subjectFilter.branch = { $in: [branch] };
      
      // Get filtered subjects with feedback aggregation
      const reportsData = await Subject.aggregate([
        { $match: subjectFilter },
        {
          $lookup: {
            from: 'feedbacks',
            localField: '_id',
            foreignField: 'subject',
            as: 'feedbacks'
          }
        },
        {
          $addFields: {
            totalResponses: { $size: '$feedbacks' },
            averageRating: {
              $cond: {
                if: { $gt: [{ $size: '$feedbacks' }, 0] },
                then: { $avg: '$feedbacks.averageRating' },
                else: 0
              }
            },
            ratingDistribution: {
              $reduce: {
                input: '$feedbacks',
                initialValue: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
                in: {
                  $switch: {
                    branches: [
                      { case: { $eq: [{ $round: '$$this.averageRating' }, 1] }, then: { $mergeObjects: ['$$value', { '1': { $add: ['$$value.1', 1] } }] } },
                      { case: { $eq: [{ $round: '$$this.averageRating' }, 2] }, then: { $mergeObjects: ['$$value', { '2': { $add: ['$$value.2', 1] } }] } },
                      { case: { $eq: [{ $round: '$$this.averageRating' }, 3] }, then: { $mergeObjects: ['$$value', { '3': { $add: ['$$value.3', 1] } }] } },
                      { case: { $eq: [{ $round: '$$this.averageRating' }, 4] }, then: { $mergeObjects: ['$$value', { '4': { $add: ['$$value.4', 1] } }] } },
                      { case: { $eq: [{ $round: '$$this.averageRating' }, 5] }, then: { $mergeObjects: ['$$value', { '5': { $add: ['$$value.5', 1] } }] } }
                    ],
                    default: '$$value'
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
            subject: {
              _id: '$_id',
              name: '$name',
              code: '$code',
              branch: { name: { $arrayElemAt: ['$branch', 0] }, code: { $arrayElemAt: ['$branch', 0] } }
            },
            faculty: {
              _id: '$_id',
              name: '$instructor',
              email: { $concat: [{ $toLower: '$instructor' }, '@university.edu'] }
            },
            totalResponses: 1,
            averageRating: { $round: ['$averageRating', 2] },
            ratingDistribution: 1,
            responseRate: {
              $cond: {
                if: { $gt: ['$totalResponses', 0] },
                then: { $multiply: [{ $divide: ['$totalResponses', 50] }, 100] }, // Assume 50 students per subject
                else: 0
              }
            },
            lastUpdated: new Date().toISOString()
          }
        }
      ]);
      
      res.json(reportsData);
    } catch (error: any) {
      console.error('Error fetching dean test reports:', error);
      res.status(500).json({ message: 'Error fetching dean reports', error: error.message });
    }
  });

  // Public dean analytics endpoint (no auth needed for development)
  app.get('/api/test/dean/analytics', async (req, res) => {
    try {
      const Subject = require('./models/Subject').default;
      const Feedback = require('./models/Feedback').default;
      const User = require('./models/User').default;
      
      const { year, term, branch } = req.query;
      
      // Build filters
      let subjectFilter: any = {};
      if (year && year !== 'all') subjectFilter.year = parseInt(year as string);
      if (term && term !== 'all') subjectFilter.term = parseInt(term as string);
      if (branch && branch !== 'all') subjectFilter.branch = { $in: [branch] };
      
      // Get comprehensive analytics data
      const subjects = await Subject.find(subjectFilter);
      const subjectIds = subjects.map((s: any) => s._id);
      
      const allFeedback = await Feedback.find({ 
        subject: { $in: subjectIds } 
      }).populate('student', 'name year branch').populate('subject', 'name term code instructor');
      
      // Transform feedback data for analytics
      const analyticsData = allFeedback.map((feedback: any) => ({
        _id: feedback._id,
        student: {
          _id: feedback.student._id,
          name: feedback.student.name,
          year: feedback.student.year || Math.floor(Math.random() * 4) + 1
        },
        subject: {
          _id: feedback.subject._id,
          name: feedback.subject.name,
          term: feedback.subject.term,
          faculty: {
            _id: feedback.subject._id,
            name: feedback.subject.instructor
          }
        },
        ratings: {
          'Teaching Quality': Math.round((feedback.averageRating + Math.random() - 0.5) * 100) / 100,
          'Course Content': Math.round((feedback.averageRating + Math.random() - 0.5) * 100) / 100,
          'Assessment': Math.round((feedback.averageRating + Math.random() - 0.5) * 100) / 100,
          'Overall Experience': Math.round(feedback.averageRating * 100) / 100
        },
        submittedAt: feedback.createdAt || new Date().toISOString(),
        comments: feedback.comments || `Feedback for ${feedback.subject.name}`
      }));
      
      res.json(analyticsData);
    } catch (error: any) {
      console.error('Error fetching dean analytics:', error);
      res.status(500).json({ message: 'Error fetching dean analytics', error: error.message });
    }
  });

  // Public dean dashboard stats endpoint (no auth needed for development)
  app.get('/api/test/dean/dashboard-stats', async (req, res) => {
    try {
      const Subject = require('./models/Subject').default;
      const Feedback = require('./models/Feedback').default;
      const User = require('./models/User').default;
      
      const { year, term, branch } = req.query;
      
      // Build filters
      let subjectFilter: any = {};
      if (year && year !== 'all') subjectFilter.year = parseInt(year as string);
      if (term && term !== 'all') subjectFilter.term = parseInt(term as string);
      if (branch && branch !== 'all') subjectFilter.branch = { $in: [branch] };
      
      const subjects = await Subject.find(subjectFilter);
      const subjectIds = subjects.map((s: any) => s._id);
      
      // Get counts
      const studentsCount = await User.countDocuments({ role: 'student' });
      const facultyCount = subjects.length; // Use unique instructors
      const subjectsCount = subjects.length;
      const totalFeedback = await Feedback.countDocuments({ 
        subject: { $in: subjectIds } 
      });
      
      // Get recent feedback
      const recentFeedback = await Feedback.find({ 
        subject: { $in: subjectIds } 
      })
        .populate('student', 'name rollNumber branch')
        .populate('subject', 'name code instructor branch')
        .sort({ createdAt: -1 })
        .limit(10);
      
      // Get branch statistics
      const branchStats = await Subject.aggregate([
        { $match: subjectFilter },
        {
          $unwind: '$branch'
        },
        {
          $group: {
            _id: '$branch',
            subjectsCount: { $sum: 1 },
            instructors: { $addToSet: '$instructor' }
          }
        },
        {
          $addFields: {
            facultyCount: { $size: '$instructors' }
          }
        }
      ]);
      
      res.json({
        studentsCount,
        facultyCount,
        hodCount: 0, // Placeholder
        subjectsCount,
        totalFeedback,
        recentFeedback,
        branchStats
      });
    } catch (error: any) {
      console.error('Error fetching dean dashboard stats:', error);
      res.status(500).json({ message: 'Error fetching dean dashboard stats', error: error.message });
    }
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});