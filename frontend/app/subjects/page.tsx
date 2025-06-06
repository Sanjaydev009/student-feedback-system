'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SubjectCard from '@/components/SubjectCard';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  questions: string[];
}

interface Feedback {
  subject: {
    _id: string;
  };
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [submittedSubjects, setSubmittedSubjects] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check login status and decode token
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      window.location.href = '/login';
      return;
    }

    try {
      const decoded: any = JSON.parse(atob(storedToken.split('.')[1]));
      if (decoded.role !== 'student') {
        window.location.href = '/';
        return;
      }
      setToken(storedToken);
      fetchSubmittedFeedbacks(storedToken);
    } catch (err) {
      alert('Invalid token. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, []);

  // Fetch feedback history
  const fetchSubmittedFeedbacks = async (token: string) => {
    try {
      const decoded: any = JSON.parse(atob(token.split('.')[1]));
      const studentId = decoded.id;

      const res = await fetch(`http://localhost:5001/api/feedback/student/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // 💥 Prevent JSON parse error
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received HTML instead of feedback data - likely invalid token');
      }

      const data = await res.json();
      const ids = data.map((fb: Feedback) => fb.subject._id);
      setSubmittedSubjects(ids);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      alert('Failed to load feedback status – showing all subjects');
      setSubmittedSubjects([]);
    } finally {
      fetchSubjects();
    }
  };

  // Fetch all available subjects
  const fetchSubjects = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/subjects', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received HTML instead of subjects');
      }

      if (!res.ok) throw new Error('Failed to load subjects');

      const data = await res.json();
      setSubjects(data);
    } catch (err: any) {
      alert('Failed to load subjects. Please log in again.');
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading subjects...</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Subjects</h1>
      <p className="mb-6 text-gray-600">Click on a subject to give feedback</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.length === 0 ? (
          <p>No subjects found.</p>
        ) : (
          subjects.map((subject) => (
            <SubjectCard
              key={subject._id}
              subject={subject}
              submitted={submittedSubjects.includes(subject._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}