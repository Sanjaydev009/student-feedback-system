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
  answers: [
    {
      question: String,
      answer: Number
    }
  ]
});

// Add unique constraint to prevent duplicate submission
FeedbackSchema.index({ student: 1, subject: 1 }, { unique: true });

export default model('Feedback', FeedbackSchema);