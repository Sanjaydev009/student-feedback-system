'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/AdminNavbar';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  branch: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studentBranch, setStudentBranch] = useState<string | null>(null);
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

      const userBranch = decoded.branch || 'MCA Regular';
      setStudentBranch(userBranch);
      fetchSubjects(storedToken, userBranch);
    } catch (err: any) {
      alert('Invalid token. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, []);

  // Fetch all subjects and filter by branch
  const fetchSubjects = async (token: string, branch: string) => {
    try {
      const res = await fetch('http://localhost:5001/api/subjects', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const contentType = res.headers.get('content-type');

      if (!contentType?.includes('application/json')) {
        throw new Error('Received HTML instead of JSON - likely not authenticated');
      }

      const data = await res.json();

      // ✅ Filter by student branch
      const filtered = data.filter((subject: Subject) => subject.branch === branch);
      setSubjects(filtered);
    } catch (err: any) {
      console.error('Failed to load subjects:', err.message);
      alert(err.message || 'Failed to load subjects. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading subjects...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />

      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Your Subjects</h1>
        <p className="mb-6 text-gray-700">
          Click on a subject to give feedback ({studentBranch})
        </p>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.length > 0 ? (
            subjects.map((subject) => (
              <Link
                key={subject._id}
                href={`/submit-feedback?subjectId=${subject._id}`}
                className="block bg-white rounded shadow hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold">{subject.name}</h2>
                  <p className="mt-2 text-sm text-gray-600">Code: {subject.code}</p>
                  <p className="mt-1 text-sm text-gray-600">Instructor: {subject.instructor}</p>
                  <p className="mt-1 text-sm text-gray-600">Branch: {subject.branch}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex justify-center items-center py-12 bg-white rounded shadow">
              <p className="text-gray-500">❌ No subjects found for your branch.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}