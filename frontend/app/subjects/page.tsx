'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/StudentNavbar';

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
  const [studentName, setStudentName] = useState<string | null>(null);
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
      fetchStudentName(storedToken);
      fetchSubjects(storedToken, userBranch); // ✅ Pass branch here
    } catch (err: any) {
      alert('Invalid token. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, []);

  // Get student name
  const fetchStudentName = async (token: string) => {
    try {
      const res = await fetch('http://localhost:5001/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const contentType = res.headers.get('content-type');

      if (!contentType?.includes('application/json')) {
        throw new Error('Received HTML instead of JSON - likely not authenticated');
      }

      const data = await res.json();
      setStudentName(data.name);
    } catch (err: any) {
      console.error('Failed to load student:', err.message);
      alert('Session expired. Redirecting to login...');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  // Load subjects and filter by branch
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

      // ✅ Filter by branch
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

  if (loading) return <p className="text-center mt-8">Loading your subjects...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <StudentNavbar /> */}

      <div className="container mx-auto p-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold">Welcome back, {studentName}!</h1>
          <p className="mt-2 opacity-90">
            You're logged in as a student. Here are your subjects for:
            <span className="font-semibold ml-1">{studentBranch}</span>
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-6 border-l-4 border-blue-500">
          <h2 className="text-lg font-medium">📝 Feedback Instructions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Click on a subject below to give feedback.
          </p>
        </div>

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
              <p className="text-gray-500 text-lg">❌ No subjects found for your branch.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}