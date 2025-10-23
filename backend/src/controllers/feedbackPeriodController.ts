import { Request, Response } from 'express';
import FeedbackPeriod from '../models/FeedbackPeriod';
import Subject from '../models/Subject';
import User from '../models/User';
import Feedback from '../models/Feedback';

// Create a new feedback period (Admin only)
export const createFeedbackPeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      feedbackType,
      academicYear,
      term,
      startDate,
      endDate,
      subjects,
      branches,
      years,
      instructions
    } = req.body;

    // Validate required fields
    if (!title || !description || !feedbackType || !term || !startDate || !endDate) {
      res.status(400).json({ message: 'All required fields must be provided' });
      return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start >= end) {
      res.status(400).json({ message: 'End date must be after start date' });
      return;
    }

    // Check if there's already an active feedback period for this type and term
    const existingPeriod = await FeedbackPeriod.findOne({
      feedbackType,
      term,
      academicYear: academicYear || '2024-25',
      isActive: true,
      status: 'active'
    });

    if (existingPeriod) {
      res.status(409).json({ 
        message: `An active ${feedbackType} feedback period already exists for term ${term}`,
        existingPeriod: {
          id: existingPeriod._id,
          title: existingPeriod.title,
          startDate: existingPeriod.startDate,
          endDate: existingPeriod.endDate
        }
      });
      return;
    }

    // Create feedback period
    const feedbackPeriod = await FeedbackPeriod.create({
      title,
      description,
      feedbackType,
      academicYear: academicYear || '2024-25',
      term,
      startDate: start,
      endDate: end,
      subjects: subjects || [],
      branches: branches || [],
      years: years || [],
      instructions: instructions || 'Please provide your honest feedback to help us improve.',
      createdBy: req.user?.id,
      status: start <= now ? 'active' : 'draft'
    });

    // Populate the created period with related data
    const populatedPeriod = await FeedbackPeriod.findById(feedbackPeriod._id)
      .populate('subjects', 'name code instructor')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Feedback period created successfully',
      feedbackPeriod: populatedPeriod
    });

  } catch (error: any) {
    console.error('Error creating feedback period:', error);
    res.status(500).json({ message: 'Server error while creating feedback period' });
  }
};

// Get all feedback periods (Admin only)
export const getAllFeedbackPeriods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, feedbackType, term, academicYear } = req.query;

    // Build filter
    const filter: any = {};
    if (status) filter.status = status;
    if (feedbackType) filter.feedbackType = feedbackType;
    if (term) filter.term = parseInt(term as string);
    if (academicYear) filter.academicYear = academicYear;

    const feedbackPeriods = await FeedbackPeriod.find(filter)
      .populate('subjects', 'name code instructor')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(feedbackPeriods);

  } catch (error: any) {
    console.error('Error fetching feedback periods:', error);
    res.status(500).json({ message: 'Server error while fetching feedback periods' });
  }
};

// Get active feedback periods for students
export const getActiveFeedbackPeriods = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    // Get student details
    const student = await User.findById(userId);
    if (!student || student.role !== 'student') {
      res.status(403).json({ message: 'Access denied. Student role required.' });
      return;
    }

    const now = new Date();

    // Find active feedback periods that apply to this student
    const activePeriods = await FeedbackPeriod.find({
      isActive: true,
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
      $and: [
        {
          $or: [
            { branches: { $in: [student.branch] } },
            { branches: { $size: 0 } } // If no branches specified, applies to all
          ]
        },
        {
          $or: [
            { years: { $in: [student.year] } },
            { years: { $size: 0 } } // If no years specified, applies to all
          ]
        }
      ]
    }).populate('subjects', 'name code instructor branch year term');

    // Filter periods based on subjects available to student
    const filteredPeriods = await Promise.all(
      activePeriods.map(async (period) => {
        let applicableSubjects = [];

        if (period.subjects.length === 0) {
          // If no specific subjects, get all subjects for student's branch
          applicableSubjects = await Subject.find({
            branch: { $in: [student.branch] },
            ...(student.year && { year: student.year })
          });
        } else {
          // Filter subjects that apply to this student
          applicableSubjects = period.subjects.filter((subject: any) => 
            subject.branch.includes(student.branch) &&
            (!student.year || subject.year === student.year)
          );
        }

        return {
          ...period.toObject(),
          applicableSubjects
        };
      })
    );

    res.json(filteredPeriods.filter(period => period.applicableSubjects.length > 0));

  } catch (error: any) {
    console.error('Error fetching active feedback periods:', error);
    res.status(500).json({ message: 'Server error while fetching active feedback periods' });
  }
};

// Update feedback period (Admin only)
export const updateFeedbackPeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating certain fields after activation
    const period = await FeedbackPeriod.findById(id);
    if (!period) {
      res.status(404).json({ message: 'Feedback period not found' });
      return;
    }

    if (period.status === 'active' && (updates.feedbackType || updates.term)) {
      res.status(400).json({ 
        message: 'Cannot change feedback type or term for active periods' 
      });
      return;
    }

    const updatedPeriod = await FeedbackPeriod.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('subjects', 'name code instructor')
     .populate('createdBy', 'name email');

    if (!updatedPeriod) {
      res.status(404).json({ message: 'Feedback period not found' });
      return;
    }

    res.json({
      message: 'Feedback period updated successfully',
      feedbackPeriod: updatedPeriod
    });

  } catch (error: any) {
    console.error('Error updating feedback period:', error);
    res.status(500).json({ message: 'Server error while updating feedback period' });
  }
};

// Activate/Deactivate feedback period (Admin only)
export const toggleFeedbackPeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'activate', 'deactivate', 'complete', 'cancel'

    const period = await FeedbackPeriod.findById(id);
    if (!period) {
      res.status(404).json({ message: 'Feedback period not found' });
      return;
    }

    let newStatus = period.status;
    let isActive = period.isActive;

    switch (action) {
      case 'activate':
        newStatus = 'active';
        isActive = true;
        break;
      case 'deactivate':
        isActive = false;
        break;
      case 'complete':
        newStatus = 'completed';
        isActive = false;
        break;
      case 'cancel':
        newStatus = 'cancelled';
        isActive = false;
        break;
      default:
        res.status(400).json({ message: 'Invalid action' });
        return;
    }

    // Check for conflicts when activating
    if (action === 'activate') {
      const conflicting = await FeedbackPeriod.findOne({
        _id: { $ne: id },
        feedbackType: period.feedbackType,
        term: period.term,
        academicYear: period.academicYear,
        isActive: true,
        status: 'active'
      });

      if (conflicting) {
        res.status(409).json({ 
          message: `Cannot activate: Another ${period.feedbackType} feedback period is already active for this term` 
        });
        return;
      }
    }

    const updatedPeriod = await FeedbackPeriod.findByIdAndUpdate(
      id,
      { status: newStatus, isActive },
      { new: true }
    ).populate('subjects', 'name code instructor')
     .populate('createdBy', 'name email');

    res.json({
      message: `Feedback period ${action}d successfully`,
      feedbackPeriod: updatedPeriod
    });

  } catch (error: any) {
    console.error('Error toggling feedback period:', error);
    res.status(500).json({ message: 'Server error while updating feedback period status' });
  }
};

// Delete feedback period (Admin only)
export const deleteFeedbackPeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const period = await FeedbackPeriod.findById(id);
    if (!period) {
      res.status(404).json({ message: 'Feedback period not found' });
      return;
    }

    // Check if there are any feedbacks submitted for this period
    const feedbackCount = await Feedback.countDocuments({
      feedbackType: period.feedbackType,
      term: period.term,
      academicYear: period.academicYear
    });

    if (feedbackCount > 0 && period.status !== 'draft') {
      res.status(400).json({ 
        message: 'Cannot delete feedback period with submitted feedbacks. Complete or cancel it instead.' 
      });
      return;
    }

    await FeedbackPeriod.findByIdAndDelete(id);

    res.json({ message: 'Feedback period deleted successfully' });

  } catch (error: any) {
    console.error('Error deleting feedback period:', error);
    res.status(500).json({ message: 'Server error while deleting feedback period' });
  }
};

// Get feedback period statistics
export const getFeedbackPeriodStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const period = await FeedbackPeriod.findById(id).populate('subjects');
    if (!period) {
      res.status(404).json({ message: 'Feedback period not found' });
      return;
    }

    // Calculate statistics
    const totalFeedbacks = await Feedback.countDocuments({
      feedbackType: period.feedbackType,
      term: period.term,
      academicYear: period.academicYear
    });

    // Get completion stats by subject
    const subjectStats = await Promise.all(
      period.subjects.map(async (subject: any) => {
        const subjectFeedbacks = await Feedback.countDocuments({
          subject: subject._id,
          feedbackType: period.feedbackType,
          term: period.term
        });

        return {
          subject: {
            id: subject._id,
            name: subject.name,
            code: subject.code,
            instructor: subject.instructor
          },
          feedbackCount: subjectFeedbacks
        };
      })
    );

    // Update period statistics
    await FeedbackPeriod.findByIdAndUpdate(id, {
      'statistics.completedFeedbacks': totalFeedbacks
    });

    res.json({
      period: {
        id: period._id,
        title: period.title,
        feedbackType: period.feedbackType,
        term: period.term,
        status: period.status
      },
      statistics: {
        totalFeedbacks,
        subjectStats,
        startDate: period.startDate,
        endDate: period.endDate,
        daysRemaining: period.status === 'active' 
          ? Math.ceil((period.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0
      }
    });

  } catch (error: any) {
    console.error('Error fetching feedback period stats:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
};