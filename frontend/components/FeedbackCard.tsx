import Link from 'next/link';

interface Props {
  feedback: {
    _id: string;
    ratings: {
      teachingStyle: number;
      difficulty: number;
      usefulness: number;
    };
    comments: string;
    subject: {
      name: string;
    };
  };
}

export default function FeedbackCard({ feedback }: Props) {
  return (
    <div key={feedback._id} className="border p-4 rounded shadow">
      <h2 className="text-lg font-semibold">{feedback.subject.name}</h2>
      <p>Teaching Style: {feedback.ratings.teachingStyle}/5</p>
      <p>Difficulty: {feedback.ratings.difficulty}/5</p>
      <p>Usefulness: {feedback.ratings.usefulness}/5</p>
      <p className="mt-2">{feedback.comments}</p>
    </div>
  );
}