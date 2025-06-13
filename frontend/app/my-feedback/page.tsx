'use client';

import { useEffect, useState } from 'react';
import StudentNavbar from '@/components/StudentNavbar';

interface Feedback {
  _id: string;
  subject: {
    name: string;
    code: string;
    instructor: string;
  };
  averageRating: number;
  answers: Array<{
    question: string;
    answer: number;
  }>;
}

export default function MyFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const storedToken = localStorage.getItem('token');

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/feedback/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });

        const contentType = res.headers.get('content-type');

        if (!contentType?.includes('application/json')) {
          throw new Error('Received HTML instead of JSON - not authenticated');
        }

        const data = await res.json();
        setFeedbacks(data);
      } catch (err: any) {
        alert(err.message || 'Failed to load your feedback');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  if (loading) return <p>Loading feedback...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <StudentNavbar />

      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Feedback</h1>

        {feedbacks.length > 0 ? (
          feedbacks.map((fb, i) => (
            <div key={i} className="bg-white shadow rounded p-6 mb-6">
              <h2 className="text-xl font-semibold">{fb.subject.name}</h2>
              <p className="mt-2 text-gray-600">Instructor: {fb.subject.instructor}</p>
              <p className="mt-2 text-gray-600">Average Rating: <strong>{fb.averageRating.toFixed(1)}</strong>/5</p>

              <div className="mt-4 space-y-2">
                {fb.answers.map((a, idx) => (
                  <div key={idx}>
                    <p className="text-sm text-gray-800">{a.question}</p>
                    <p className="text-lg">⭐ {a.answer}/5</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">You have not given any feedback yet.</p>
        )}
      </div>
    </div>
  );
}