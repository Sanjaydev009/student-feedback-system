'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SubjectCard from '@/components/SubjectCard';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState<string[]>([]);

  // Simulate fetching submitted feedback
  useEffect(() => {
    // Replace this with real API call later
    setSubmittedFeedbacks(['PHY101', 'CS201']); // Sample submitted subjects
  }, []);

  // Fetch subjects from backend
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/subjects');
        const data = await res.json();
        setSubjects(data);
      } catch (err) {
        alert('Failed to load subjects');
      }
    };
    fetchSubjects();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Subjects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <SubjectCard key={subject._id} subject={subject} submitted={submittedFeedbacks.includes(subject.code)} />
        ))}
      </div>
    </div>
  );
}