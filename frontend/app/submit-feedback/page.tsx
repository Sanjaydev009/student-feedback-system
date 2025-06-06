'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FeedbackForm from '@/components/FeedbackForm';
import api from '@/utils/api';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  questions: string[];
}

export default function SubmitFeedbackPage() {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get('subjectId');

  // Check if user is logged in
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }

    try {
      const decoded: any = JSON.parse(atob(storedToken.split('.')[1]));
      if (decoded.role !== 'student') {
        router.push('/');
      }
    } catch (err) {
      alert('Invalid token. Please log in again.');
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, []);

  // Fetch subject by ID with Axios
  useEffect(() => {
  const fetchSubject = async () => {
    if (!subjectId) {
      alert('No subject selected');
      router.push('/subjects');
      return;
    }

    try {
      const res = await api.get(`/api/subjects/${subjectId}`);

      // ✅ Only proceed if data is valid
      if (res.data && res.data.questions?.length > 0) {
        setSubject(res.data);
      } else {
        throw new Error('Subject has no questions or invalid data');
      }
    } catch (err: any) {
      console.error('Error fetching subject:', err.message || err.response?.data || 'Unknown');
      alert('Failed to load subject details – Subject may not exist or is missing');
      router.push('/subjects');
    } finally {
      setLoading(false);
    }
  };

  fetchSubject();
}, [subjectId]);

  if (loading) return <p>Loading subject...</p>;
  if (!subject) return <p>Subject not found</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Feedback for {subject.name}</h1>
      <p>Instructor: {subject.instructor}</p>

      <FeedbackForm subject={subject} />
    </div>
  );
}