'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Props {
  subject: {
    _id: string;
    name: string;
    code: string;
    instructor: string;
  };
}

export default function SubjectCard({ subject }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [token] = useState(localStorage.getItem('token'));

  // Check if already gave feedback
  useEffect(() => {
  const checkFeedbackStatus = async () => {
    try {
      const decoded: any = JSON.parse(atob(localStorage.getItem('token')!.split('.')[1]));
      const studentId = decoded.id;

      const res = await fetch(`http://localhost:5001/api/feedback/student/${studentId}?subject=${subject._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!res.ok) throw new Error('Failed to load feedback data');

      const data = await res.json();
      setSubmitted(data.length > 0);
    } catch (err: any) {
      console.error('Feedback check error:', err.message);
    }
  };

  checkFeedbackStatus();
}, [subject._id]);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <h2 className="text-xl font-semibold">{subject.name}</h2>
        <p className="mt-2 text-sm text-gray-600">Code: {subject.code}</p>
        <p className="mt-1 text-sm text-gray-600">Instructor: {subject.instructor}</p>

        {!submitted ? (
          <Link href={`/submit-feedback?subjectId=${subject._id}`} className="mt-4 inline-block text-blue-600 hover:text-blue-800 underline">
            Give Feedback
          </Link>
        ) : (
          <p className="mt-4 text-green-600 font-medium">✅ Feedback Submitted</p>
        )}
      </div>
    </div>
  );
}