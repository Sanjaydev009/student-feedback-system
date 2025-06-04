'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import FeedbackForm from '@/components/FeedbackForm';

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

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/subjects/${subjectId}`);
        const data = await res.json();
        setSubject(data);
      } catch (err) {
        alert('Failed to load subject details');
        router.push('/subjects');
      } finally {
        setLoading(false);
      }
    };

    if (subjectId) fetchSubject();
  }, [subjectId]);

  if (loading) return <p>Loading...</p>;
  if (!subject) return <p>Subject not found</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Feedback for {subject.name}</h1>
      <FeedbackForm subject={subject} />
    </div>
  );
}