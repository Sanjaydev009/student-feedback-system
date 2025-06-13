// src/controllers/authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';


export const registerStudent = async (req: Request, res: Response): Promise<void> => {
  const { name, rollNumber, email, password } = req.body;

  try {
    const studentExists = await User.findOne({ email });
    if (studentExists) {
      res.status(400).json({ message: 'Student already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await User.create({
      name,
      rollNumber,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: student._id, role: student.role },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    res.status(201).json({ token });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const loginStudent = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const student = await User.findOne({ email });
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: student._id, role: student.role },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    res.json({ token });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find(); // Make sure model is imported
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });
    res.status(201).json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  try {
    const updated = await User.findByIdAndUpdate(id, { name, email, role }, { new: true });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
  }
}



// export const login = async (req: Request, res: Response) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     const payload = {
//       id: user._id,
//       role: user.role
//     };

//     const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1d' });
//     res.json({ token });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = {
      id: user._id,
      role: user.role,
      branch: user.branch
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1d' });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};
