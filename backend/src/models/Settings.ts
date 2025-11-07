import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  feedbackEnabled: boolean;
  registrationEnabled: boolean;
  maxFeedbackPerSubject: number;
  feedbackDeadline: Date | null;
  maintenanceMode: boolean;
  allowAnonymousFeedback: boolean;
  updatedAt: Date;
  updatedBy: mongoose.Types.ObjectId;
}

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
  notificationPreferences: {
    emailReports: boolean;
    weeklyDigest: boolean;
    lowRatingAlerts: boolean;
    newFeedbackNotifications: boolean;
  };
  reportSettings: {
    defaultTimeRange: string;
    includeAnonymousData: boolean;
    autoGenerateReports: boolean;
  };
  displaySettings: {
    showBranchComparison: boolean;
    showTrendAnalysis: boolean;
    defaultChartType: string;
  };
  updatedAt: Date;
}

// System-wide settings (managed by admin)
const SystemSettingsSchema = new Schema<ISystemSettings>({
  feedbackEnabled: {
    type: Boolean,
    default: true
  },
  registrationEnabled: {
    type: Boolean,
    default: true
  },
  maxFeedbackPerSubject: {
    type: Number,
    default: 1
  },
  feedbackDeadline: {
    type: Date,
    default: null
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  allowAnonymousFeedback: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// User-specific settings (for HODs)
const UserSettingsSchema = new Schema<IUserSettings>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  notificationPreferences: {
    emailReports: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: true
    },
    lowRatingAlerts: {
      type: Boolean,
      default: true
    },
    newFeedbackNotifications: {
      type: Boolean,
      default: false
    }
  },
  reportSettings: {
    defaultTimeRange: {
      type: String,
      enum: ['7', '30', '90', '365'],
      default: '30'
    },
    includeAnonymousData: {
      type: Boolean,
      default: true
    },
    autoGenerateReports: {
      type: Boolean,
      default: false
    }
  },
  displaySettings: {
    showBranchComparison: {
      type: Boolean,
      default: true
    },
    showTrendAnalysis: {
      type: Boolean,
      default: true
    },
    defaultChartType: {
      type: String,
      enum: ['bar', 'line', 'pie', 'area'],
      default: 'bar'
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
export const UserSettings = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
