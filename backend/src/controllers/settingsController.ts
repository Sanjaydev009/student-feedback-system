import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SystemSettings, UserSettings } from '../models/Settings';
import User from '../models/User';

// Extend the Request type to include the user property
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// GET /api/settings/system
export const getSystemSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is an admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Only administrators can access system settings' });
      return;
    }

    // Get system settings or create default if none exist
    let settings = await SystemSettings.findOne().sort({ updatedAt: -1 }).lean();

    if (!settings) {
      // Create default settings
      const userId = req.user.id;
      const defaultSettings = new SystemSettings({
        feedbackEnabled: true,
        registrationEnabled: true,
        maxFeedbackPerSubject: 1,
        feedbackDeadline: null,
        maintenanceMode: false,
        allowAnonymousFeedback: false,
        updatedAt: new Date(),
        updatedBy: new mongoose.Types.ObjectId(userId)
      });
      
      await defaultSettings.save();
      settings = defaultSettings.toObject() as any;
    }

    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/settings/system
export const updateSystemSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is an admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Only administrators can update system settings' });
      return;
    }

    const { 
      feedbackEnabled, 
      registrationEnabled, 
      maxFeedbackPerSubject, 
      feedbackDeadline,
      maintenanceMode,
      allowAnonymousFeedback
    } = req.body;

    // Validate the settings data
    if (typeof feedbackEnabled !== 'boolean' || 
        typeof registrationEnabled !== 'boolean' ||
        typeof maintenanceMode !== 'boolean' ||
        typeof allowAnonymousFeedback !== 'boolean' ||
        (maxFeedbackPerSubject !== undefined && (isNaN(maxFeedbackPerSubject) || maxFeedbackPerSubject < 0))
    ) {
      res.status(400).json({ message: 'Invalid settings data' });
      return;
    }

    const userId = req.user.id;

    // Create a new settings entry rather than updating an existing one (keeps history)
    const newSettings = new SystemSettings({
      feedbackEnabled,
      registrationEnabled,
      maxFeedbackPerSubject: maxFeedbackPerSubject || 1,
      feedbackDeadline: feedbackDeadline || null,
      maintenanceMode,
      allowAnonymousFeedback,
      updatedBy: new mongoose.Types.ObjectId(userId),
      updatedAt: new Date()
    });

    await newSettings.save();

    res.json(newSettings);
  } catch (error: any) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/settings/user
export const getUserSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is a valid role (hod)
    if (!req.user || !['hod'].includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied. Invalid user role.' });
      return;
    }

    const userId = req.user.id;

    // Get user settings or create default if none exist
    let settings = await UserSettings.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();

    if (!settings) {
      // Create default settings for this user
      const newSettings = new UserSettings({
        userId: new mongoose.Types.ObjectId(userId),
        notificationPreferences: {
          emailReports: true,
          weeklyDigest: true,
          lowRatingAlerts: true,
          newFeedbackNotifications: false
        },
        reportSettings: {
          defaultTimeRange: '30',
          includeAnonymousData: true,
          autoGenerateReports: false
        },
        displaySettings: {
          showBranchComparison: true,
          showTrendAnalysis: true,
          defaultChartType: 'bar'
        },
        updatedAt: new Date()
      });

      await newSettings.save();
      settings = newSettings.toObject() as any; // Cast to any to resolve type issues
    }

    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/settings/user
export const updateUserSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is a valid role (hod)
    if (!req.user || !['hod'].includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied. Invalid user role.' });
      return;
    }

    const userId = req.user.id;
    const { notificationPreferences, reportSettings, displaySettings } = req.body;

    // Find the user's existing settings
    let settings = await UserSettings.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!settings) {
      // Create new settings if none exist
      settings = new UserSettings({
        userId: new mongoose.Types.ObjectId(userId),
        notificationPreferences,
        reportSettings,
        displaySettings,
        updatedAt: new Date()
      });
    } else {
      // Update existing settings
      if (notificationPreferences) {
        settings.notificationPreferences = {
          ...settings.notificationPreferences,
          ...notificationPreferences
        };
      }

      if (reportSettings) {
        settings.reportSettings = {
          ...settings.reportSettings,
          ...reportSettings
        };
      }

      if (displaySettings) {
        settings.displaySettings = {
          ...settings.displaySettings,
          ...displaySettings
        };
      }

      settings.updatedAt = new Date();
    }

    await settings.save();

    res.json(settings);
  } catch (error: any) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ message: error.message });
  }
};
