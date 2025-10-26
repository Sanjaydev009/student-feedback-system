import { model, Schema } from 'mongoose';

const FeedbackPeriodSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  feedbackType: {
    type: String,
    enum: ['midterm', 'endterm'],
    required: true
  },
  academicYear: {
    type: String,
    required: true,
    default: '2024-25'
  },
  term: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4]
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjects: [{
    type: Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  branches: [{
    type: String,
    enum: [
      'CSE',
      'AIML', 
      'DS',
      'Computer Science', 
      'Electronics', 
      'Mechanical', 
      'Civil', 
      'Electrical',
      'Information Technology',
      'Chemical',
      'Aerospace',
      'Biotechnology',
      'MCA Regular', 
      'MCA DS',
      'MBA Finance',
      'MBA Marketing',
      'MBA HR'
    ]
  }],
  years: [{
    type: Number,
    enum: [1, 2, 3, 4]
  }],
  instructions: {
    type: String,
    default: 'Please provide your honest feedback to help us improve.'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  statistics: {
    totalStudents: { type: Number, default: 0 },
    completedFeedbacks: { type: Number, default: 0 },
    pendingFeedbacks: { type: Number, default: 0 }
  }
}, { 
  timestamps: true 
});

// Index for efficient queries - removed duplicate index for feedbackType/term/academicYear/isActive
FeedbackPeriodSchema.index({ startDate: 1, endDate: 1 });
FeedbackPeriodSchema.index({ status: 1, isActive: 1 });

// Ensure only one active feedback period per type and term
FeedbackPeriodSchema.index(
  { feedbackType: 1, term: 1, academicYear: 1, isActive: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { isActive: true, status: 'active' } 
  }
);

export default model('FeedbackPeriod', FeedbackPeriodSchema);