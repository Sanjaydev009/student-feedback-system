'use client';

import { useState } from 'react';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';

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
  const [answers, setAnswers] = useState<{ question: string; answer: number }[]>([]);
  const router = useRouter();

  const handleRatingChange = (index: number, value: number) => {
    const updated = [...answers];
    updated[index] = {
      question: subject.questions[index],
      answer: value,
    };
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    const hasUnanswered = answers.some(a => a.answer === undefined || a.answer === null);
    if (hasUnanswered) {
      alert('Please answer all questions before submitting');
      return;
    }

    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) throw new Error('No token found');

      const decoded: any = JSON.parse(atob(storedToken.split('.')[1]));
      const studentId = decoded.id;

      await api.post('/api/feedback', {
        student: studentId,
        subject: subject._id,
        answers
      });

      alert('Feedback submitted!');
      router.push('/my-feedback');
    } catch (err) {
      alert('Failed to submit feedback');
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {subject.questions.map((q, i) => (
          <div key={i} className="mb-4">
            <label>{q}</label>
            <input
              type="range"
              min="1"
              max="5"
              onChange={(e) => handleRatingChange(i, parseInt(e.target.value))}
              className="w-full"
            />
            <span>{answers[i]?.answer || 0}/5</span>
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={subject.questions.length === 0}
          className={`mt-4 w-full py-2 px-4 rounded ${
            subject.questions.length === 0 ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Submit Feedback
        </button>
      </form>
    </div>
  );
}