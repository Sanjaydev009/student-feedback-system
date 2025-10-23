// src/controllers/subjectController.ts
import { Request, Response } from 'express';
import Subject from '../models/Subject';
import User from '../models/User';
import Feedback from '../models/Feedback'; 

// controllers/subjectController.ts
export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await Subject.find(); // Returns all subjects
    res.json(subjects);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get subjects filtered by student's year, term and branch
export const getSubjectsForStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get student details
    const student = await User.findById(userId);
    if (!student || student.role !== 'student') {
      res.status(403).json({ message: 'Access denied. Student role required.' });
      return;
    }

    if (!student.branch) {
      res.status(400).json({ message: 'Student profile incomplete. Branch is required.' });
      return;
    }

    // Check if term is provided as query parameter
    const term = req.query.term;
    
    // Build query for subjects - use student's year if available, otherwise show all years
    const query: any = {
      branch: { $in: [student.branch] } // Find subjects where student's branch is in the array
    };
    
    // Add year filter only if student has year information
    if (student.year) {
      query.year = student.year;
    }
    
    // Add term filter if provided
    if (term) {
      query.term = parseInt(term.toString());
    }

    console.log('Student query:', query, 'Student branch:', student.branch, 'Student year:', student.year);

    // Find subjects matching student's branch and optionally year/term
    const subjects = await Subject.find(query);

    console.log('Found subjects for student:', subjects.length);

    res.json(subjects);
  } catch (err: any) {
    console.error('Error in getSubjectsForStudent:', err);
    res.status(500).json({ message: err.message });
  }
};

export const createSubject = async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    code,
    instructor,
    department,
    year,
    term,
    branch,
    questions,
    midtermQuestions,
    endtermQuestions
  } = req.body;

  // Validate basic fields
  if (!name || !code || !instructor || !department || !year || !term || !branch) {
    res.status(400).json({ message: 'All basic fields including name, code, instructor, department, year, term, and branch are required' });
    return;
  }

  // Validate question arrays
  if (midtermQuestions && (!Array.isArray(midtermQuestions) || midtermQuestions.length !== 7)) {
    res.status(400).json({ message: 'Midterm questions must be an array of exactly 7 questions' });
    return;
  }

  if (endtermQuestions && (!Array.isArray(endtermQuestions) || endtermQuestions.length !== 10)) {
    res.status(400).json({ message: 'Endterm questions must be an array of exactly 10 questions' });
    return;
  }

  // For backward compatibility, check if legacy questions field is used
  if (questions && (!Array.isArray(questions) || questions.length < 10)) {
    res.status(400).json({ message: 'Legacy questions field must be an array of at least 10 questions' });
    return;
  }

  try {
    const subjectData: any = {
      name,
      code,
      instructor,
      department,
      year: parseInt(year.toString()),
      term: parseInt(term.toString()),
      branch
    };

    // Add questions based on what's provided
    if (midtermQuestions) {
      subjectData.midtermQuestions = midtermQuestions;
    }
    
    if (endtermQuestions) {
      subjectData.endtermQuestions = endtermQuestions;
    }

    // For backward compatibility
    if (questions) {
      subjectData.questions = questions;
    }

    const newSubject = await Subject.create(subjectData);
    res.status(201).json(newSubject);
  } catch (err: any) {
    console.error('Error adding subject:', err.message);
    res.status(500).json({ message: err.message });
  }
};

export const getSubjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }
    res.json(subject);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSubject = async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    code,
    instructor,
    department,
    year,
    term,
    branch,
    questions,
    midtermQuestions,
    endtermQuestions
  } = req.body;

  // Validate basic fields
  if (!name || !code || !instructor || !department || !year || !term || !branch) {
    res.status(400).json({ message: 'All basic fields including name, code, instructor, department, year, term, and branch are required' });
    return;
  }

  // Validate question arrays if provided
  if (midtermQuestions && (!Array.isArray(midtermQuestions) || midtermQuestions.length !== 7)) {
    res.status(400).json({ message: 'Midterm questions must be an array of exactly 7 questions' });
    return;
  }

  if (endtermQuestions && (!Array.isArray(endtermQuestions) || endtermQuestions.length !== 10)) {
    res.status(400).json({ message: 'Endterm questions must be an array of exactly 10 questions' });
    return;
  }

  // For backward compatibility
  if (questions && (!Array.isArray(questions) || questions.length < 10)) {
    res.status(400).json({ message: 'Legacy questions field must be an array of at least 10 questions' });
    return;
  }

  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }

    const updateData: any = {
      name,
      code,
      instructor,
      department,
      year: parseInt(year.toString()),
      term: parseInt(term.toString()),
      branch
    };

    // Add questions based on what's provided
    if (midtermQuestions) {
      updateData.midtermQuestions = midtermQuestions;
    }
    
    if (endtermQuestions) {
      updateData.endtermQuestions = endtermQuestions;
    }

    // For backward compatibility
    if (questions) {
      updateData.questions = questions;
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedSubject);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const subjectId = req.params.id;
    console.log('Attempting to delete subject with ID:', subjectId);
    
    // Validate the subject ID format
    if (!subjectId || !subjectId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid subject ID format:', subjectId);
      res.status(400).json({ message: 'Invalid subject ID format' });
      return;
    }
    
    // Check if subject exists before anything else
    const existingSubject = await Subject.findById(subjectId);
    if (!existingSubject) {
      console.log('Subject not found with ID:', subjectId);
      res.status(404).json({ message: 'Subject not found' });
      return;
    }
    
    // Check for feedback entries but make it optional - FOR TESTING ONLY 
    // In production, remove the force parameter and enforce the check
    const feedbackExists = await Feedback.exists({ subject: subjectId });
    console.log('Feedback exists for this subject:', feedbackExists);
    
    const forceDelete = req.query.force === 'true';
    
    if (feedbackExists && !forceDelete) {
      console.log('Cannot delete - feedback entries exist for subject:', subjectId);
      res.status(400).json({ 
        message: 'Cannot delete subject with existing feedback entries. Please remove all feedback first or use force=true parameter.' 
      });
      return;
    }
    
    // Proceed with deletion
    const deletedSubject = await Subject.findByIdAndDelete(subjectId);
    console.log('Subject deleted successfully:', deletedSubject?.name);
    
    // If feedback exists and force delete was used, delete the feedback too
    if (feedbackExists && forceDelete) {
      console.log('Force deleting related feedback for subject:', subjectId);
      await Feedback.deleteMany({ subject: subjectId });
      console.log('Related feedback deleted');
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Subject deleted successfully',
      deletedSubject: {
        id: deletedSubject?._id,
        name: deletedSubject?.name,
        code: deletedSubject?.code
      }
    });
  } catch (err: any) {
    console.error('Error deleting subject:', err);
    res.status(500).json({ 
      success: false,
      message: err.message || 'Internal server error while deleting subject' 
    });
  }
};


