// src/controllers/subjectController.ts
import { Request, Response } from 'express';
import Subject from '../models/Subject';
import User from '../models/User';
import Feedback from '../models/Feedback'; 

// controllers/subjectController.ts
export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, term, branch, section, feedbackType } = req.query;
    
    // Build query filter for subjects
    const query: any = {};
    
    if (year && year !== 'all') {
      query.year = parseInt(year as string);
    }
    
    if (term && term !== 'all') {
      query.term = parseInt(term as string);
    }
    
    if (branch && branch !== 'all') {
      query.branch = { $in: [branch] };
    }
    
    // Note: section and feedbackType filters would be applied to feedback data, not subjects
    // For now, we'll still return subjects and let the frontend filter feedback accordingly
    
    const subjects = await Subject.find(query);
    
    console.log(`📚 [SUBJECTS] Found ${subjects.length} subjects with filters:`, {
      year, term, branch, section, feedbackType
    });
    
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

    // Add section filter if student has section information
    if (student.section) {
      query.$or = [
        { sections: { $in: [student.section] } }, // Subject has student's section
        { sections: { $size: 0 } }, // Subject has no sections assigned (backward compatibility)
        { sections: { $exists: false } } // Subject doesn't have sections field (backward compatibility)
      ];
    }

    console.log('Student query:', query, 'Student branch:', student.branch, 'Student year:', student.year, 'Student section:', student.section);

    // Find subjects matching student's branch and optionally year/term/section
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
    sections,
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
      branch,
      sections: sections || []
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
    sections,
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
      branch,
      sections: sections || []
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

// Get subject statistics
export const getSubjectStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get total subjects count
    const totalSubjects = await Subject.countDocuments();
    
    // Get unique instructors count
    const instructors = await Subject.distinct('instructor');
    const totalInstructors = instructors.length;
    
    // Get department distribution
    const departmentAggregation = await Subject.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const departmentDistribution = departmentAggregation.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as { [key: string]: number });
    
    // Get year distribution
    const yearAggregation = await Subject.aggregate([
      {
        $group: {
          _id: '$year',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const yearDistribution = yearAggregation.reduce((acc, item) => {
      acc[`Year ${item._id}`] = item.count;
      return acc;
    }, {} as { [key: string]: number });
    
    res.json({
      totalSubjects,
      totalInstructors,
      departmentDistribution,
      yearDistribution
    });
  } catch (err: any) {
    console.error('Error getting subject stats:', err);
    res.status(500).json({ message: 'Server error while getting subject statistics' });
  }
};

// Bulk delete subjects
export const bulkDeleteSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Subject IDs array is required' });
      return;
    }
    
    // Validate all subject IDs exist
    const subjects = await Subject.find({ _id: { $in: ids } });
    if (subjects.length !== ids.length) {
      res.status(404).json({ message: 'One or more subjects not found' });
      return;
    }
    
    // Check for feedback entries (optional check - can be forced)
    const feedbackExists = await Feedback.exists({ subject: { $in: ids } });
    const forceDelete = req.query.force === 'true';
    
    if (feedbackExists && !forceDelete) {
      res.status(400).json({ 
        message: 'Cannot delete subjects with existing feedback entries. Use force=true to override.' 
      });
      return;
    }
    
    // Delete the subjects
    const deleteResult = await Subject.deleteMany({ _id: { $in: ids } });
    
    // If feedback exists and force delete was used, delete related feedback
    if (feedbackExists && forceDelete) {
      await Feedback.deleteMany({ subject: { $in: ids } });
    }
    
    res.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} subjects`,
      deletedCount: deleteResult.deletedCount
    });
  } catch (err: any) {
    console.error('Error bulk deleting subjects:', err);
    res.status(500).json({ message: 'Server error while deleting subjects' });
  }
};


