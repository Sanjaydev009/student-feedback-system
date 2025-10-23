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
  } | null;
  answers: Array<{
    question: string;
    answer: number;
  }>;
  averageRating: number;
  feedbackType: 'midterm' | 'endterm';
  term?: string;
}

interface FeedbackPeriod {
  _id: string;
  title: string;
  description: string;
  feedbackType: 'midterm' | 'endterm';
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
}

export default function MyFeedbackPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activePeriods, setActivePeriods] = useState<FeedbackPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Load feedback data and active periods
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

    const fetchData = async () => {
      try {
        // Fetch user's feedback submissions
        const feedbackResponse = await api.get('/api/feedback/student/me');
        const allFeedbacks = feedbackResponse.data;
        
        // If a subject ID is specified, filter to show only that feedback
        if (selectedSubject) {
          const filtered = allFeedbacks.filter(
            (feedback: Feedback) => feedback.subject && feedback.subject._id === selectedSubject
          );
          setFeedbacks(filtered);
        } else {
          // Filter out any feedback with null/undefined subjects
          const validFeedbacks = allFeedbacks.filter((feedback: Feedback) => feedback.subject && feedback.subject._id);
          setFeedbacks(validFeedbacks);
        }

        // Fetch active feedback periods for student
        try {
          const periodsResponse = await api.get('/api/feedback-periods/active');
          setActivePeriods(periodsResponse.data);
        } catch (periodsError) {
          console.error('Failed to load active periods:', periodsError);
          // Don't set error here as this is non-critical
        }
      } catch (err: any) {
        console.error('Failed to load feedback:', err);
        setError('Failed to load your feedback submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, selectedSubject]);

  // Group feedback by type
  const midtermFeedbacks = feedbacks.filter(f => f.feedbackType === 'midterm');
  const endtermFeedbacks = feedbacks.filter(f => f.feedbackType === 'endterm');
  const legacyFeedbacks = feedbacks.filter(f => !f.feedbackType);

  // Check if specific feedback types are currently available  
  const isMidtermActive = activePeriods.some(p => p.feedbackType === 'midterm' && p.isActive);
  const isEndtermActive = activePeriods.some(p => p.feedbackType === 'endterm' && p.isActive);
  
  // Get individual period objects for display
  const midtermPeriod = activePeriods.find(p => p.feedbackType === 'midterm' && p.isActive);
  const endtermPeriod = activePeriods.find(p => p.feedbackType === 'endterm' && p.isActive);

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Feedback Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your feedback submissions for mid-term and end-term evaluations</p>
        </div>

        {/* Active Feedback Periods */}
        {activePeriods.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Feedback Periods</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {activePeriods.map(period => (
                <div key={period._id} className="bg-white rounded-lg p-6 border-l-4 border-blue-500 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{period.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      period.feedbackType === 'midterm' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {period.feedbackType === 'midterm' ? 'Mid-Term' : 'End-Term'}
                    </span>
                  </div>
                  {period.description && (
                    <p className="text-gray-600 text-sm mb-3">{period.description}</p>
                  )}
                  <div className="text-xs text-gray-500 mb-3">
                    Ends: {new Date(period.endDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <Link
                    href="/subjects"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Go to Subjects & Submit {period.feedbackType === 'midterm' ? 'Mid-Term' : 'End-Term'} Feedback
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Active Periods Message */}
        {activePeriods.length === 0 && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5l-6.928-12c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-yellow-800">No Active Feedback Periods</h3>
                <p className="text-yellow-700 mt-1">
                  There are currently no active feedback collection periods. Please check back later or contact your administrator.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Mid-Term Feedback Summary */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mid-Term Feedback</h3>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{midtermFeedbacks.length}</div>
            <p className="text-gray-600 text-sm">Submissions completed</p>
            {isMidtermActive && (
              <Link
                href="/subjects"
                className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                Submit feedback
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          {/* End-Term Feedback Summary */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">End-Term Feedback</h3>
              <span className="text-2xl">📈</span>
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">{endtermFeedbacks.length}</div>
            <p className="text-gray-600 text-sm">Submissions completed</p>
            {isEndtermActive && (
              <Link
                href="/subjects"
                className="mt-3 inline-flex items-center text-sm text-purple-600 hover:text-purple-800"
              >
                Submit feedback
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          {/* Total Feedback Summary */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Feedback</h3>
              <span className="text-2xl">📝</span>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">{feedbacks.length}</div>
            <p className="text-gray-600 text-sm">All submissions</p>
          </div>
        </div>

        {/* Feedback Submissions */}
        {feedbacks.length > 0 ? (
          <div className="space-y-8">
            {/* Mid-Term Feedback */}
            {midtermFeedbacks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="w-4 h-4 bg-blue-500 rounded-full mr-2"></span>
                  Mid-Term Feedback Submissions ({midtermFeedbacks.length})
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {midtermFeedbacks.map((feedback, index) => (
                    <FeedbackCard key={`midterm-${index}`} feedback={feedback} />
                  ))}
                </div>
              </div>
            )}

            {/* End-Term Feedback */}
            {endtermFeedbacks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="w-4 h-4 bg-purple-500 rounded-full mr-2"></span>
                  End-Term Feedback Submissions ({endtermFeedbacks.length})
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {endtermFeedbacks.map((feedback, index) => (
                    <FeedbackCard key={`endterm-${index}`} feedback={feedback} />
                  ))}
                </div>
              </div>
            )}

            {/* Legacy Feedback (if any) */}
            {legacyFeedbacks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="w-4 h-4 bg-gray-500 rounded-full mr-2"></span>
                  Previous Feedback Submissions ({legacyFeedbacks.length})
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {legacyFeedbacks.map((feedback, index) => (
                    <FeedbackCard key={`legacy-${index}`} feedback={feedback} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm text-center">
            <div className="text-gray-400 text-5xl mb-4">📋</div>
            <h2 className="text-xl font-medium text-gray-800 mb-2">No Feedback Submissions Found</h2>
            <p className="text-gray-600 mb-6">You haven't provided feedback for any subject yet.</p>
            {(isMidtermActive || isEndtermActive) ? (
              <div className="space-y-3">
                <Link 
                  href="/subjects" 
                  className="inline-block px-5 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go to Subjects to Submit Feedback
                </Link>
              </div>
            ) : (
              <p className="text-gray-500">
                No feedback periods are currently active. Please check back later.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}