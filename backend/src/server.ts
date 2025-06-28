import 'dotenv/config';
import express from 'express';
import connectDB from './config/db';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import subjectRoutes from './routes/subjectRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import hodRoutes from './routes/hodRoutes';
import deanRoutes from './routes/deanRoutes';
import settingsRoutes from './routes/settingsRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// DB Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/dean', deanRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
 
// Test routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Development only - endpoint to create test accounts
if (process.env.NODE_ENV !== 'production') {
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
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});