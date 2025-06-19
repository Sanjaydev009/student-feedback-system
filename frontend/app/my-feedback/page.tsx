'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/StudentNavbar';

interface Feedback {
  _id: string;
  subject: {
    name: string;
    code: string;
    instructor: string;
  };
  answers: Array<{
    question: string;
    answer: number;
  }>;
  averageRating: number;
}

export default function MyFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  // Get token and decode student ID
  const storedToken = localStorage.getItem('token');
  const decoded: any = storedToken ? JSON.parse(atob(storedToken.split('.')[1])) : {};
  const studentId = decoded.id;

  // Load feedback data
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
          throw new Error('Received HTML instead of JSON - likely not authenticated');
        }

        const data = await res.json();
        setFeedbacks(data);
      } catch (err: any) {
        console.error('Failed to load feedback:', err.message);
        alert(err.message || 'Failed to load your feedback. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  if (loading) return <p>Loading your feedback...</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <StudentNavbar />

      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">My Feedback</h1>

        {feedbacks.length > 0 ? (
          feedbacks.map((fb, index) => (
            <div key={index} className="bg-white shadow rounded p-6 mb-6">
              <h2 className="text-xl font-semibold">{fb.subject.name}</h2>
              <p className="mt-2 text-gray-600">Instructor: {fb.subject.instructor}</p>
              <p className="mt-2 text-gray-600">Average Rating: <strong>{fb.averageRating}/5</strong></p>

              <div className="mt-4 space-y-3">
                {fb.answers.map((ans, i) => (
                  <div key={i}>
                    <p className="text-sm text-gray-800">{ans.question}</p>
                    <p className="text-lg">⭐ {ans.answer}/5</p>
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