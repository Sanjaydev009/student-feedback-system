'use client';

import { useState } from 'react';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';

interface Question {
  text: string;
  rating: number | null;
}

interface Props {
  subject: {
    _id: string;
    name: string;
    code: string;
    instructor: string;
    questions: string[];
  };
}

export default function FeedbackForm({ subject }: Props) {
  const [answers, setAnswers] = useState<Question[]>(
    subject.questions.map(q => ({ text: q, rating: null }))
  );

  const router = useRouter();

  const handleRatingChange = (index: number, value: number) => {
    const updated = [...answers];
    updated[index].rating = value;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    const hasUnanswered = answers.some(a => a.rating === null);

    if (hasUnanswered) {
      alert('Please answer all questions');
      return;
    }

    try {
      await api.post('/api/feedback', {
        student: 'student_123', // replace with actual student ID from token
        subject: subject._id,
        answers: answers.map((ans, i) => ({
          question: ans.text,
          answer: ans.rating
        }))
      });

      alert('Feedback submitted successfully!');
      router.push('/my-feedback');
    } catch (err) {
      alert('Failed to submit feedback');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{subject.name}</h1>
      <p className="mb-6 text-gray-600">Instructor: {subject.instructor} • Code: {subject.code}</p>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {answers.map((q, index) => (
          <div key={index} className="bg-white p-6 rounded shadow">
            <label className="block mb-2 font-medium">{q.text}</label>
            <input
              type="range"
              min="1"
              max="5"
              onChange={(e) => handleRatingChange(index, parseInt(e.target.value))}
              className="w-full"
            />
            <span>{q.rating || 0}/5</span>
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={answers.some(a => a.rating === null)}
          className={`mt-4 w-full py-3 px-4 rounded text-white ${
            answers.some(a => a.rating === null)
              ? 'bg-gray-500'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Submit Feedback
        </button>
      </form>
    </div>
  );
}