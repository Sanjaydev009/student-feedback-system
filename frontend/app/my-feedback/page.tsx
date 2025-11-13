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
    year?: number;
    term?: number;
  } | null;
  answers: Array<{
    question: string;
    answer: number;
    type?: 'rating' | 'comment';
    comment?: string;
    category?: string;
  }>;
  averageRating: number;
  feedbackType: 'midterm' | 'endterm';
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  term?: number;
  academicYear?: string;
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
  const [retryCount, setRetryCount] = useState(0);

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
        setLoading(true);
        setError(null);
        
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
        
        setRetryCount(0); // Reset retry count on success
      } catch (err: any) {
        console.error('Failed to load feedback:', err);
        setError('Failed to load your feedback submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, selectedSubject, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Organize feedbacks by academic year and term
  const feedbacksByYearAndTerm = feedbacks.reduce((acc, feedback) => {
    const academicYear = feedback.academicYear || '2024-25';
    const term = feedback.term || 1;
    const feedbackType = feedback.feedbackType || 'legacy';
    
    const key = `${academicYear}-Term${term}`;
    if (!acc[key]) {
      acc[key] = {
        academicYear,
        term,
        midterm: [],
        endterm: [],
        legacy: []
      };
    }
    
    if (feedbackType === 'midterm') {
      acc[key].midterm.push(feedback);
    } else if (feedbackType === 'endterm') {
      acc[key].endterm.push(feedback);
    } else {
      acc[key].legacy.push(feedback);
    }
    
    return acc;
  }, {} as Record<string, {
    academicYear: string;
    term: number;
    midterm: Feedback[];
    endterm: Feedback[];
    legacy: Feedback[];
  }>);

  // Sort the years and terms in descending order (newest first)
  const sortedYearTerms = Object.keys(feedbacksByYearAndTerm).sort((a, b) => {
    const [yearA, termA] = a.split('-Term');
    const [yearB, termB] = b.split('-Term');
    
    // Compare academic years first (2024-25 vs 2023-24)
    if (yearA !== yearB) {
      return yearB.localeCompare(yearA);
    }
    
    // If same year, compare terms (higher term first)
    return parseInt(termB) - parseInt(termA);
  });

  // Group feedback by type (legacy - for stats)
  const midtermFeedbacks = feedbacks.filter(f => f.feedbackType === 'midterm');
  const endtermFeedbacks = feedbacks.filter(f => f.feedbackType === 'endterm');
  const legacyFeedbacks = feedbacks.filter(f => !f.feedbackType);

  // Check if specific feedback types are currently available  
  const isMidtermActive = activePeriods.some(p => p.feedbackType === 'midterm' && p.isActive);
  const isEndtermActive = activePeriods.some(p => p.feedbackType === 'endterm' && p.isActive);
  
  // Get individual period objects for display
  const midtermPeriod = activePeriods.find(p => p.feedbackType === 'midterm' && p.isActive);
  const endtermPeriod = activePeriods.find(p => p.feedbackType === 'endterm' && p.isActive);

  const hasAnyFeedback = feedbacks.length > 0;
  const totalFeedbacks = feedbacks.length;

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <StudentNavbar />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
                <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-secondary-400 mx-auto animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">Loading Your Feedback</h3>
              <p className="mt-2 text-gray-600">Please wait while we fetch your submission history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <StudentNavbar />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-16">
              <div className="bg-white rounded-xl shadow-card border border-gray-200 p-12 max-w-md mx-auto">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Unable to Load Feedback</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <div className="space-y-3">
                  <button
                    onClick={handleRetry}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Try Again
                  </button>
                  <br />
                  <button
                    onClick={() => router.push('/subjects')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Go to Subjects
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <StudentNavbar />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">My Feedback History</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Track and review all your submitted feedback across different subjects and periods
            </p>
            {totalFeedbacks > 0 && (
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {totalFeedbacks} feedback submission{totalFeedbacks === 1 ? '' : 's'} completed
                </span>
              </div>
            )}
          </div>

          {/* Active Feedback Periods Info */}
          {activePeriods.length > 0 && (
            <div className="mb-10">
              <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Active Feedback Periods
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">Current opportunities to submit feedback</p>
                </div>
                <div className="p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {activePeriods.map((period) => (
                      <div
                        key={period._id}
                        className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                          period.isActive 
                            ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-md' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                period.feedbackType === 'midterm' 
                                  ? 'bg-blue-100 text-blue-600' 
                                  : 'bg-purple-100 text-purple-600'
                              }`}>
                                {period.feedbackType === 'midterm' ? '📊' : '📝'}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{period.title}</h3>
                                <p className="text-sm text-gray-600">
                                  Ends: {new Date(period.endDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              period.isActive 
                                ? 'bg-green-100 text-green-800 animate-pulse' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {period.isActive ? 'Active Now' : 'Inactive'}
                            </span>
                          </div>
                          {period.description && (
                            <p className="text-gray-600 text-sm mb-3">{period.description}</p>
                          )}
                          {period.isActive && (
                            <Link
                              href="/subjects"
                              className={`block w-full py-3 px-4 rounded-lg text-sm font-medium text-center transition-all duration-200 ${
                                period.feedbackType === 'midterm'
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg'
                              }`}
                            >
                              Submit {period.feedbackType === 'midterm' ? 'Mid-Term' : 'End-Term'} Feedback →
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-3 mb-10">
            {/* Mid-Term Summary */}
            <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6 hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Mid-Term Feedback</h3>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{midtermFeedbacks.length}</div>
              <p className="text-gray-600 text-sm mb-3">Submissions completed</p>
              {isMidtermActive && (
                <Link
                  href="/subjects"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Submit feedback
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>

            {/* End-Term Summary */}
            <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6 hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">End-Term Feedback</h3>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">{endtermFeedbacks.length}</div>
              <p className="text-gray-600 text-sm mb-3">Submissions completed</p>
              {isEndtermActive && (
                <Link
                  href="/subjects"
                  className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                  Submit feedback
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>

            {/* Total Summary */}
            <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6 hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Feedback</h3>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">{totalFeedbacks}</div>
              <p className="text-gray-600 text-sm">All submissions</p>
            </div>
          </div>

          {/* Main Content */}
          {!hasAnyFeedback ? (
            // Empty State
            <div className="text-center py-16">
              <div className="bg-white rounded-xl shadow-card border border-gray-200 p-12 max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No Feedback Submitted Yet</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  You haven't submitted any feedback yet. When feedback periods are active, you can submit feedback for your subjects and it will appear here.
                </p>
                {activePeriods.some(p => p.isActive) && (
                  <Link
                    href="/subjects"
                    className="inline-block bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Start Submitting Feedback
                  </Link>
                )}
              </div>
            </div>
          ) : (
            // Feedback Content - Organized by Academic Year and Term
            <div className="space-y-12">
              {sortedYearTerms.map(yearTermKey => {
                const yearTermData = feedbacksByYearAndTerm[yearTermKey];
                const { academicYear, term, midterm, endterm, legacy } = yearTermData;
                
                // Skip if no feedback in this term
                if (midterm.length === 0 && endterm.length === 0 && legacy.length === 0) {
                  return null;
                }

                return (
                  <div key={yearTermKey} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    {/* Academic Year and Term Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-8 py-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                            </svg>
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold">Academic Year {academicYear}</h2>
                            <p className="text-indigo-100">Term {term} • {midterm.length + endterm.length + legacy.length} submission{(midterm.length + endterm.length + legacy.length) === 1 ? '' : 's'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {midterm.length > 0 && (
                            <div className="bg-blue-500 bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                              📊 Mid-Term: {midterm.length}
                            </div>
                          )}
                          {endterm.length > 0 && (
                            <div className="bg-purple-500 bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                              📝 End-Term: {endterm.length}
                            </div>
                          )}
                          {legacy.length > 0 && (
                            <div className="bg-gray-500 bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                              📋 Legacy: {legacy.length}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Feedback Cards */}
                    <div className="p-8">
                      <div className="space-y-10">
                        {/* Mid-Term Section */}
                        {midterm.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                              Mid-Term Feedback ({midterm.length})
                            </h3>
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                              {midterm.map((feedback) => (
                                <FeedbackCard key={feedback._id} feedback={feedback} showViewDetails={true} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* End-Term Section */}
                        {endterm.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                              End-Term Feedback ({endterm.length})
                            </h3>
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                              {endterm.map((feedback) => (
                                <FeedbackCard key={feedback._id} feedback={feedback} showViewDetails={true} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Legacy Section */}
                        {legacy.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                              <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                              Previous Feedback ({legacy.length})
                            </h3>
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                              {legacy.map((feedback) => (
                                <FeedbackCard key={feedback._id} feedback={feedback} showViewDetails={true} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Success Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">Great Job!</h3>
                <p className="text-green-700">
                  You've successfully submitted {totalFeedbacks} feedback form{totalFeedbacks === 1 ? '' : 's'}. 
                  Your input helps improve the quality of education.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}