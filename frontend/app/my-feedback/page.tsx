'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StudentNavbar from '@/components/StudentNavbar';
import FeedbackCard from '@/components/FeedbackCard';
import { isAuthenticated, decodeToken } from '@/utils/auth';
import api from '@/utils/api';

interface Feedback {
  _id: string;
  subject: {
    _id: string;
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
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Load feedback data using API utility
  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Check if a specific subject ID is provided in the URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const subjectId = urlParams.get('subjectId');
      if (subjectId) {
        setSelectedSubject(subjectId);
      }
    }

    const fetchFeedback = async () => {
      try {
        // Get feedback using the authenticated user's ID
        const response = await api.get('/api/feedback/student/me');
        const allFeedbacks = response.data;
        
        // If a subject ID is specified, filter to show only that feedback
        if (selectedSubject) {
          const filtered = allFeedbacks.filter(
            (feedback: Feedback) => feedback.subject._id === selectedSubject
          );
          setFeedbacks(filtered);
        } else {
          setFeedbacks(allFeedbacks);
        }
      } catch (err: any) {
        console.error('Failed to load feedback:', err);
        setError('Failed to load your feedback submissions');
        
        // The API utility will handle 401 errors and redirect to login automatically
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [router, selectedSubject]);

  // All the rating calculation and display is handled by the FeedbackCard component

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading your feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentNavbar />
        <div className="container mx-auto py-12 px-4">
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => router.push('/subjects')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Subjects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />

      <div className="container mx-auto py-8 px-4 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Feedback Submissions</h1>
          <p className="text-gray-600 mt-1">View all feedback you've provided for your subjects</p>
        </div>

        {feedbacks.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {feedbacks.map((feedback, index) => (
              <FeedbackCard key={index} feedback={feedback} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm text-center">
            <div className="text-gray-400 text-5xl mb-4">📋</div>
            <h2 className="text-xl font-medium text-gray-800 mb-2">No Feedback Submissions Found</h2>
            <p className="text-gray-600 mb-6">You haven't provided feedback for any subject yet.</p>
            <Link 
              href="/subjects" 
              className="inline-block px-5 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              View Available Subjects
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}