// src/routes/authRoutes.ts
import express from 'express';
import { registerStudent, loginStudent, getMe } from '../controllers/authController';
import { protect, isAdmin } from '../middleware/authMiddleware';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/authController';

const router = express.Router();

router.get('/users', protect, isAdmin, getAllUsers);
router.post('/users', protect, isAdmin, createUser);
router.put('/users/:id', protect, isAdmin, updateUser);
router.delete('/users/:id', protect, isAdmin, deleteUser);


router.post('/register', registerStudent);
router.post('/login', loginStudent);

router.get('/me', protect, getMe);

export default router;