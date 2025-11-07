// src/routes/authRoutes.ts
import express, { Request, Response } from 'express';
import { bulkRegisterStudents, login, register, resetPassword, updateProfile, getMe, initializeAdmin } from '../controllers/authController';
import { protect, isAdmin } from '../middleware/authMiddleware';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/authController';
import User from '../models/User';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Debug route - create test accounts (only in development)
if (process.env.NODE_ENV !== 'production') {
  router.get('/setup-test-accounts', async (req, res) => {
    try {
      // First, remove any existing test accounts to start fresh
      await User.deleteMany({ email: { $in: ['admin@test.com', 'student@test.com', 'hod@test.com'] } });
      
      // Create the accounts normally (let mongoose middleware handle hashing)
      const adminPassword = 'admin123';
      const studentPassword = 'student123';
      const hodPassword = 'hod123';
      
      const admin = await User.create({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: adminPassword, // Mongoose will hash this
        role: 'admin',
        passwordResetRequired: false
      });
      
      const student = await User.create({
        name: 'Test Student',
        email: 'student@test.com',
        rollNumber: 'ST12345',
        branch: 'MCA Regular',
        password: studentPassword, // Mongoose will hash this
        role: 'student',
        passwordResetRequired: false
      });

      const hod = await User.create({
        name: 'Test HOD',
        email: 'hod@test.com',
        branch: 'MCA Regular',
        password: hodPassword, // Mongoose will hash this
        role: 'hod',
        passwordResetRequired: false
      });


      
      const results = {
        admin: { 
          email: 'admin@test.com', 
          password: adminPassword,
          role: 'admin'
        },
        student: { 
          email: 'student@test.com', 
          password: studentPassword,
          role: 'student'
        },
        hod: { 
          email: 'hod@test.com', 
          password: hodPassword,
          role: 'hod'
        }
      };
      
      res.json({ 
        message: 'Test accounts setup complete', 
        accounts: results
      });
    } catch (error) {
      console.error('Error setting up test accounts:', error);
      res.status(500).json({ message: 'Error creating test accounts' });
    }
  });
}

// router.get('/users', protect, isAdmin, getAllUsers);
router.post('/users', protect, isAdmin, createUser);
router.put('/users/:id', protect, isAdmin, updateUser);
router.delete('/users/:id', protect, isAdmin, deleteUser);


router.post('/login', login);
router.post('/register', protect, isAdmin, register);
router.get('/users', protect, isAdmin, getAllUsers);

// Initialization endpoint - no auth required for creating first admin
router.post('/init-admin', initializeAdmin);

// Health check endpoint is now in server.ts

router.post('/reset-password', resetPassword);

router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);


router.post('/register/bulk', protect, isAdmin, bulkRegisterStudents);

export default router;