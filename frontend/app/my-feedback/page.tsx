'use client';

import { useEffect, useState } from 'react';

interface Feedback {
  _id: string;
  subject: {
    name: string;
  };
  answers: {
    question: string;
    answer: number;
  }[];
}

export default function MyFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/feedback/student/student_123');
        const data = await res.json();
        setFeedbacks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Feedback</h1>
      {feedbacks.length === 0 && <p>No feedback submitted yet.</p>}

      {feedbacks.map((fb) => (
        <div key={fb._id} className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">{fb.subject.name}</h2>
          <div className="space-y-3">
            {fb.answers.map((ans, i) => (
              <div key={i}>
                <strong>{ans.question}</strong>: {ans.answer}/5
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}