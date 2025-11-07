// src/controllers/authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { emailService } from '../services/emailService';
import mongoose from 'mongoose';

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
    const { name, email, role, rollNumber, department, branch, year } = req.body;
    
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
    
    // Create user data object
    const userData: any = {
      name,
      email,
      password: generatedPassword, // Mongoose middleware will hash this
      role,
      passwordResetRequired: passwordResetRequired
    };
    
    // Add role-specific fields
    if (role === 'student') {
      if (rollNumber) userData.rollNumber = rollNumber;
      if (department) userData.department = department;
      if (branch) userData.branch = branch;
      if (year) userData.year = parseInt(year.toString());
    } else if (role === 'faculty' || role === 'hod') {
      if (department) userData.department = department;
      if (branch) userData.branch = branch; // For faculty/hod, branch represents specialization
    }
    
    // Create new user with all fields
    const user = new User(userData);
    
    await user.save();
    
    // Send welcome email with password
    const emailSent = await emailService.sendPasswordEmail(user, generatedPassword);
    
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
      passwordResetRequired, // Include this info in the response
      emailSent // Include email status
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role, rollNumber, department, branch, year, passwordResetRequired } = req.body;

  try {
    // Create update data object
    const updateData: any = { name, email, role };
    
    // Add role-specific fields
    if (role === 'student') {
      if (rollNumber !== undefined) updateData.rollNumber = rollNumber;
      if (department !== undefined) updateData.department = department;
      if (branch !== undefined) updateData.branch = branch;
      if (year !== undefined) updateData.year = parseInt(year.toString());
    } else if (role === 'faculty' || role === 'hod') {
      if (department !== undefined) updateData.department = department;
      if (branch !== undefined) updateData.branch = branch; // For faculty/hod, branch represents specialization
    }
    
    // Add passwordResetRequired if provided
    if (passwordResetRequired !== undefined) {
      updateData.passwordResetRequired = passwordResetRequired;
    }
    
    const updated = await User.findByIdAndUpdate(id, updateData, { new: true });
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
      failures: [] as { email: string; reason: string }[],
      createdUsers: [] as any[]
    };

    // Process each student
    for (const student of students) {
      const { name, rollNumber, email, department, branch, section, year } = student;
      
      // Validate required fields - these match the same validation as individual user creation
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!rollNumber) missingFields.push('rollNumber');
      if (!branch) missingFields.push('branch');
      if (!year) missingFields.push('year');
      
      if (missingFields.length > 0) {
        results.failed++;
        results.failures.push({ 
          email: email || 'Unknown', 
          reason: `Missing required fields: ${missingFields.join(', ')}` 
        });
        continue;
      }
      
      try {
        // Check if student already exists by email
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          results.failed++;
          results.failures.push({ 
            email, 
            reason: 'Email already exists' 
          });
          continue;
        }
        
        // Check if roll number is already taken
        const existingRoll = await User.findOne({ rollNumber });
        if (existingRoll) {
          results.failed++;
          results.failures.push({ 
            email, 
            reason: 'Roll number already exists' 
          });
          continue;
        }
        
        // Get default password for students
        const defaultPassword = getDefaultPassword('student'); // Using 'student@123'
        
        // Create user data object - similar to createUser function
        const userData: any = {
          name,
          email,
          rollNumber,
          branch,
          password: defaultPassword, // Mongoose middleware will hash this
          role: 'student',
          passwordResetRequired: true // Force password reset for students
        };
        
        // Add additional fields if provided
        if (department) userData.department = department;
        if (section) userData.section = section;
        if (year) userData.year = parseInt(year.toString());
        
        // Create new student
        const newStudent = new User(userData);
        await newStudent.save();
        
        // Send welcome email with password (don't wait for it to complete)
        emailService.sendPasswordEmail(newStudent, defaultPassword).catch(emailError => {
          console.error(`Failed to send email to ${email}:`, emailError);
        });
        
        // Add to successful registrations
        results.success++;
        results.createdUsers.push({
          _id: newStudent._id,
          name: newStudent.name,
          email: newStudent.email,
          rollNumber: newStudent.rollNumber,
          branch: newStudent.branch,
          section: newStudent.section,
          year: newStudent.year
        });
      } catch (error: any) {
        results.failed++;
        results.failures.push({ 
          email, 
          reason: error.message || 'Unknown error' 
        });
      }
    }
    
    // Send bulk registration summary to admin (if emails are configured)
    if (results.success > 0) {
      try {
        const adminUser = await User.findById(req.user?.id);
        if (adminUser?.email) {
          emailService.sendBulkRegistrationSummary(
            adminUser.email, 
            results, 
            students.length
          ).catch(emailError => {
            console.error('Failed to send bulk registration summary:', emailError);
          });
        }
      } catch (summaryError) {
        console.error('Error sending bulk registration summary:', summaryError);
      }
    }
    
    res.status(201).json({
      message: `Processed ${students.length} students. ${results.success} added successfully, ${results.failed} failed.`,
      password: {
        pattern: 'student@123', 
        note: 'All students were created with the default password "student@123" and will be required to reset it on first login.'
      },
      results: {
        success: results.success,
        failed: results.failed,
        failures: results.failures,
        createdUsers: results.createdUsers.slice(0, 10) // Limit to first 10 to avoid huge payload
      },
      totalCreated: results.createdUsers.length
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
  
  console.log('🔍 Login attempt:', { email, passwordLength: password?.length });

  try {
    // Debug - check if the request contains valid data
    if (!email || !password) {
      console.error('Missing email or password in request');
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Find user by email
    console.log('🔍 About to search for user with email:', email);
    console.log('🔍 User model collection name:', User.collection.name);
    console.log('🔍 MongoDB connection state:', mongoose.connection.readyState);
    
    const user = await User.findOne({ email }).select('+password');
    console.log('🔍 User found:', { 
      found: !!user, 
      email: user?.email, 
      role: user?.role,
      hasPassword: !!user?.password,
      passwordLength: user?.password?.length 
    });
    
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    console.log('🔍 Testing password comparison...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔍 Password match result:', isMatch);
    
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
  const { name, email, password, role, branch, rollNumber, year } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email already taken' });
      return;
    }

    // Check for duplicate roll number if provided
    if (rollNumber) {
      const existingRollNumber = await User.findOne({ rollNumber });
      if (existingRollNumber) {
        res.status(400).json({ message: 'Roll number already exists' });
        return;
      }
    }

    // Generate password or use provided one
    const actualPassword = password || getDefaultPassword(role || 'student');
    const usingDefaultPassword = !password;

    // Create user data
    const userData: any = {
      name,
      email,
      password: actualPassword, // Mongoose middleware will hash this
      role: role || 'student',
      branch: branch || 'MCA Regular',
      passwordResetRequired: usingDefaultPassword
    };

    // Add optional fields if provided
    if (rollNumber) userData.rollNumber = rollNumber;
    if (year) userData.year = year;
    
    const newUser = await User.create(userData);

    // Send welcome email with credentials
    if (newUser) {
      try {
        const emailSent = await emailService.sendPasswordEmail(newUser, actualPassword);
        console.log(`Welcome email ${emailSent ? 'sent' : 'failed'} for user: ${newUser.email}`);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the registration if email fails
      }
    }

    const token = jwt.sign(
      {
        id: newUser._id,
        name: newUser.name,
        role: newUser.role,
        branch: newUser.branch,
        rollNumber: newUser.rollNumber,
        defaultPasswordUsed: usingDefaultPassword
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        branch: newUser.branch,
        rollNumber: newUser.rollNumber
      }
    });
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

// Initialize admin user if none exists
export const initializeAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if any admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      res.status(400).json({ 
        message: 'Admin user already exists',
        email: existingAdmin.email
      });
      return;
    }

    // Create default admin user
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      passwordResetRequired: false
    });

    console.log('✅ Admin user created successfully:', adminUser.email);

    res.status(201).json({
      message: 'Admin user created successfully',
      email: adminUser.email,
      password: 'admin123',
      note: 'Please change the default password after first login'
    });
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error);
    res.status(500).json({ 
      message: 'Failed to create admin user',
      error: error.message 
    });
  }
};