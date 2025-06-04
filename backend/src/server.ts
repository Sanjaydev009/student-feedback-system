import 'dotenv/config';
import express from 'express';
import connectDB from './config/db';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import subjectRoutes from './routes/subjectRoutes';
import feedbackRoutes from './routes/feedbackRoutes';

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
 
// Test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});