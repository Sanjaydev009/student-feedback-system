// src/controllers/authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const getDefaultPassword = (role: string): string => {
  switch (role) {
    case 'student':
      return 'student@123';
    case 'faculty':
      return 'faculty@123';
    case 'hod':
      return 'hod@123';
    case 'admin':
      return 'admin@123';
    case 'dean':
      return 'dean@123';
    default:
      return 'default@123';
  }
};



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

// export const getAllUsers = async (req: Request, res: Response) => {
//   try {
//     const users = await User.find(); // Make sure model is imported
//     res.json(users);
//   } catch (err: any) {
//     res.status(500).json({ message: err.message });
//   }
// };


// Add this helper function for generating random passwords
function generateRandomPassword(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Update the create user method
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }
    
    // Generate random password for new user
    const generatedPassword = generateRandomPassword();
    
    // We don't need to explicitly hash the password here anymore
    // The User model's pre-save middleware will handle the hashing
    
    // Admin users don't need to reset password on first login,
    // all other users (students, faculty, etc.) do need to reset
    const passwordResetRequired = role === 'admin' ? false : true;
    
    // Create new user with generated password
    const user = new User({
      name,
      email,
      password: generatedPassword, // Mongoose middleware will hash this
      role,
      passwordResetRequired: passwordResetRequired
    });
    
    await user.save();
    
    // Return the temporary password (only time it's visible in plain text)
    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      generatedPassword, // Include the plain text password in the response
      passwordResetRequired // Include this info in the response
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const bulkRegisterStudents = async (req: Request, res: Response): Promise<void> => {
  const { students } = req.body;

  if (!students || !Array.isArray(students) || students.length === 0) {
    res.status(400).json({ message: 'No student data provided' });
    return;
  }

  try {
    const results = {
      success: 0,
      failed: 0,
      failures: [] as { email: string; reason: string }[]
    };

    // Generate default password for students
    const defaultPassword = getDefaultPassword('student');

    // Process each student
    for (const student of students) {
      const { name, rollNumber, email, branch } = student;
      
      // Validate required fields
      if (!name || !email || !rollNumber || !branch) {
        results.failed++;
        results.failures.push({ 
          email: email || 'Unknown', 
          reason: 'Missing required fields' 
        });
        continue;
      }
      
      try {
        // Check if student already exists
        const existingStudent = await User.findOne({ email });
        if (existingStudent) {
          results.failed++;
          results.failures.push({ 
            email, 
            reason: 'Email already exists' 
          });
          continue;
        }
        
        // Create new student with default password
        // Let the mongoose middleware handle password hashing
        
        // Students should always be required to reset their password on first login
        await User.create({
          name,
          rollNumber,
          email,
          branch,
          password: defaultPassword, // Mongoose middleware will hash this
          role: 'student',
          passwordResetRequired: true // Force password reset for students
        });
        
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.failures.push({ 
          email, 
          reason: error.message || 'Unknown error' 
        });
      }
    }
    
    res.status(201).json({
      message: `Processed ${students.length} students. ${results.success} added successfully, ${results.failed} failed.`,
      results
    });
    
  } catch (error: any) {
    console.error('Bulk registration error:', error);
    res.status(500).json({ 
      message: 'Server error during bulk registration',
      error: error.message
    });
  }
};


// Add password reset endpoint
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id; // From auth middleware
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }
    
    // Update password and reset flag
    user.password = newPassword; // Mongoose middleware will hash this
    user.passwordResetRequired = false;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


// GET /api/auth/users
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Debug - check if the request contains valid data
    if (!email || !password) {
      console.error('Missing email or password in request');
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // For admin users, we don't enforce password reset requirement
    const passwordResetRequired = user.role === 'admin' ? false : user.passwordResetRequired;

    // Include passwordResetRequired flag in the payload (for non-admin users)
    const payload = {
      id: user._id,
      name: user.name,
      role: user.role,
      branch: user.branch,
      passwordResetRequired: passwordResetRequired
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1d' });

    res.json({ token });
  } catch (err: any) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, branch, rollNumber } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email already taken' });
      return;
    }

    // No need to hash password here, mongoose middleware will do it
    const actualPassword = password || 'student@123';

    // For manual registration, determine if password reset is required
    // Admins don't need to reset, students do if using default password
    const isAdmin = (role || 'student') === 'admin';
    const usingDefaultPassword = !password;
    const passwordResetRequired = isAdmin ? false : usingDefaultPassword;
    
    const newUser = await User.create({
      name,
      email,
      password: actualPassword, // Mongoose middleware will hash this
      role: role || 'student',
      branch: branch || 'MCA Regular',
      rollNumber,
      passwordResetRequired: passwordResetRequired
    });

    const token = jwt.sign(
      {
        id: newUser._id,
        name: newUser.name,
        role: newUser.role,
        branch: newUser.branch,
        defaultPasswordUsed: !password
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err: any) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/auth/me
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;
  
  if (!req.user?.id) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // If updating password, set passwordResetRequired to false
    if (password) {
      user.passwordResetRequired = false;
      user.password = password; // Mongoose middleware will hash this
      await user.save();
    }

    res.json({ message: 'Password updated successfully!' });
  } catch (err: any) {
    console.error('Password update error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};