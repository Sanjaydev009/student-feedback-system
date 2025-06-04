'use client';

import { useState } from 'react';

interface Props {
  subject: {
    _id: string;
    name: string;
    instructor: string;
    questions: string[];
  };
}

export default function SubjectFeedbackForm({ subject }: Props) {
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(false);

  const handleRatingChange = (index: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const body = {
        student: 'your_student_id_here', // replace with JWT token data
        subject: subject._id,
        answers: subject.questions.map((q, i) => ({
          question: q,
          answer: answers[i] || 0
        }))
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert('Feedback submitted successfully!');
      } else {
        alert('Failed to submit feedback');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Feedback for {subject.name} - {subject.instructor}</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        {subject.questions.map((question, index) => (
          <div key={index} className="mb-4">
            <label className="block mb-2">{question}</label>
            <input
              type="range"
              min="1"
              max="5"
              onChange={(e) => handleRatingChange(index, parseInt(e.target.value))}
              className="w-full"
            />
            <span>{answers[index] || 0}/5</span>
          </div>
        ))}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}