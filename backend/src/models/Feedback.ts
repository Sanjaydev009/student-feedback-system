import { model, Schema } from 'mongoose';
import { IFeedback } from '../interfaces/Feedback';

const FeedbackSchema = new Schema<IFeedback>(
  {
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
        question: { type: String, required: true },
        answer: { type: Number, min: 1, max: 5 }
      }
    ]
  },
  { timestamps: true }
);

export default model<IFeedback>('Feedback', FeedbackSchema);