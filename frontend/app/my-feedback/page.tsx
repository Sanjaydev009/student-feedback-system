'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Feedback {
  _id: string;
  subject: {
    name: string;
  };
  answers: Array<{
    question: string;
    answer: number;
  }>;
}

export default function MyFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  // Get studentId from JWT token
  useEffect(() => {
    const fetchFeedback = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        window.location.href = '/login';
        return;
      }

      try {
        const decoded: any = JSON.parse(atob(storedToken.split('.')[1]));
        const studentId = decoded.id;

        const res = await fetch(`http://localhost:5001/api/feedback/student/${studentId}`, {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });

        // ✅ Check if response is valid JSON
        const contentType = res.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new Error('Received non-JSON response from server');
        }

        const data = await res.json();

        // ✅ Ensure data is an array before mapping
        if (Array.isArray(data)) {
          setFeedbacks(data);
        } else {
          console.error('Expected array but got:', data);
          setFeedbacks([]);
        }

      } catch (err) {
        alert('Failed to load feedback. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
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

      {feedbacks.length === 0 && (
        <p>No feedback submitted yet.</p>
      )}

      <div className="space-y-6">
        {feedbacks.map((fb) => (
          <div key={fb._id} className="bg-white p-6 rounded shadow">
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
    </div>
  );
}