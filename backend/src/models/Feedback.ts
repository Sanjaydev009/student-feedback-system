import { model, Schema } from 'mongoose';

const FeedbackSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  feedbackType: {
    type: String,
    enum: ['midterm', 'endterm'],
    required: true,
    default: 'midterm'
  },
  answers: [
    {
      question: String,
      answer: Number,
      type: {
        type: String,
        enum: ['rating', 'comment'],
        default: 'rating'
      },
      comment: String, // For comment-type questions
      category: String // Category for the question
    }
  ],
  comments: {
    teachingMethodComments: String,
    courseContentComments: String,
    additionalComments: String,
    suggestions: String,
    overallExperience: String
  },
  averageRating: Number,
  term: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true,
    default: '2024-25'
  }
}, { timestamps: true });

// Add unique constraint to prevent duplicate submission for same type
FeedbackSchema.index({ student: 1, subject: 1, feedbackType: 1, term: 1 }, { unique: true });

export default model('Feedback', FeedbackSchema);