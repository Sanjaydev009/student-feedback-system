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

export const createSubject = async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    code,
    instructor,
    department,
    semester,
    branch,
    questions
  } = req.body;

  if (!name || !code || !instructor || !department || !semester || !branch || !Array.isArray(questions) || questions.length < 10) {
    res.status(400).json({ message: 'All fields including 10 questions are required' });
    return;
  }

  try {
    const newSubject = await Subject.create({
      name,
      code,
      instructor,
      department,
      semester,
      branch,
      questions
    });

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
    semester,
    branch,
    questions
  } = req.body;

  if (!name || !code || !instructor || !department || !semester || !branch || !Array.isArray(questions) || questions.length < 10) {
    res.status(400).json({ message: 'All fields including 10 questions are required' });
    return;
  }

  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        name,
        code,
        instructor,
        department,
        semester,
        branch,
        questions
      },
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


