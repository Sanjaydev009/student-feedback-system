'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import StudentNavbar from '@/components/StudentNavbar';
import { decodeToken } from '@/utils/auth';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  year: number;
  term: number;
  branch: string[];
  questions?: string[];
}

interface FeedbackSubmission {
  subject: string | { _id: string; name: string; instructor: string; code: string };
  submittedAt: string;
  feedbackType: 'midterm' | 'endterm';
  term: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedTerm, setSelectedTerm] = useState<number | 'all'>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableTerms, setAvailableTerms] = useState<number[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = decodeToken(token);
      if (decoded.role !== 'student') {
        router.push('/login');
        return;
      }
      setUser(decoded);
      fetchUserProfile();
      fetchSubmittedFeedbacks();
    } catch (error) {
      console.error('Token decode error:', error);
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSubjects();
    }
  }, [user, selectedYear, selectedTerm]);

  // Add effect to refresh data when user returns to the page (e.g., after submitting feedback)
  useEffect(() => {
    const handleFocus = () => {
      // Refresh submitted feedbacks when user returns to the page
      fetchSubmittedFeedbacks();
    };

    // Listen for when the page becomes visible again
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        fetchSubmittedFeedbacks();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/auth/me');
      console.log('👤 User profile data:', response.data.user);
      setUser(response.data.user);
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      // Use the student-specific API endpoint that properly filters by branch and year
      console.log('🔍 Fetching subjects for student dashboard...');
      const response = await api.get('/api/subjects/student');
      console.log('✅ Student dashboard API response:', response.data);
      const fetchedSubjects = response.data || [];

      console.log(`📚 Found ${fetchedSubjects.length} subjects for student dashboard`);
      fetchedSubjects.forEach((subject: Subject) => {
        console.log(`Subject: ${subject.name}, Branches: ${subject.branch}, Year: ${subject.year}, Term: ${subject.term}`);
      });

      setSubjects(fetchedSubjects);

      // Extract available years and terms from student-specific subjects
      const years = [...new Set(fetchedSubjects.map((s: Subject) => s.year))].filter((year): year is number => typeof year === 'number').sort();
      const terms = [...new Set(fetchedSubjects.map((s: Subject) => s.term))].filter((term): term is number => typeof term === 'number').sort();
      
      console.log('Available years:', years, 'Available terms:', terms);
      
      setAvailableYears(years);
      setAvailableTerms(terms);
      
    } catch (error) {
      console.error('❌ Error fetching subjects for student dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmittedFeedbacks = async () => {
    try {
      console.log('📝 Fetching submitted feedbacks...');
      const response = await api.get('/api/feedback/my-submissions');
      const feedbacks = response.data || [];
      console.log('✅ Submitted feedbacks:', feedbacks);
      feedbacks.forEach((feedback: any, index: number) => {
        console.log(`Feedback ${index}:`, {
          subject: feedback.subject,
          subjectId: typeof feedback.subject === 'string' ? feedback.subject : feedback.subject?._id,
          submittedAt: feedback.submittedAt
        });
      });
      setSubmittedFeedbacks(feedbacks);
    } catch (error) {
      console.error('❌ Error fetching submitted feedbacks:', error);
    }
  };

  const refreshDashboard = () => {
    console.log('🔄 Refreshing dashboard data...');
    fetchSubjects();
    fetchSubmittedFeedbacks();
  };

  const isSubjectSubmitted = (subjectId: string, feedbackType: 'midterm' | 'endterm') => {
    return submittedFeedbacks.some(feedback => {
      // Handle both cases: when subject is populated object or just ID
      const feedbackSubjectId = typeof feedback.subject === 'string' 
        ? feedback.subject 
        : (feedback.subject as any)?._id;
      
      console.log(`🔍 Comparing feedback subject: ${feedbackSubjectId} with ${subjectId}, type: ${feedbackType} vs ${feedback.feedbackType}`);
      return feedbackSubjectId === subjectId && feedback.feedbackType === feedbackType;
    });
  };

  const handleGiveFeedback = (subject: Subject, feedbackType: 'midterm' | 'endterm') => {
    // Store subject data in sessionStorage for the feedback form
    sessionStorage.setItem('selectedSubject', JSON.stringify(subject));
    router.push(`/advanced-feedback?subjectId=${subject._id}&type=${feedbackType}`);
  };

  const filteredSubjects = subjects.filter(subject => {
    // The API already filters by branch, so we only need to filter by selected year/term
    if (selectedYear !== 'all' && subject.year !== selectedYear) return false;
    if (selectedTerm !== 'all' && subject.term !== selectedTerm) return false;
    return true;
  });

  // Calculate feedback status for each subject
  const getSubjectFeedbackStatus = (subject: Subject) => {
    const midtermSubmitted = isSubjectSubmitted(subject._id, 'midterm');
    const endtermSubmitted = isSubjectSubmitted(subject._id, 'endterm');
    
    return {
      midtermSubmitted,
      endtermSubmitted,
      anyPending: !midtermSubmitted || !endtermSubmitted,
      allCompleted: midtermSubmitted && endtermSubmitted
    };
  };

  const pendingFeedbacks = filteredSubjects.filter(subject => {
    const status = getSubjectFeedbackStatus(subject);
    return status.anyPending;
  });
  
  const completedFeedbacks = filteredSubjects.filter(subject => {
    const status = getSubjectFeedbackStatus(subject);
    return status.allCompleted;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentNavbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.name || 'Student'}! 
            {user?.branch && <span className="ml-2 text-indigo-600 font-medium">Branch: {user.branch}</span>}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Subjects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Year Filter */}
            <div>
              <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Year
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </div>

            {/* Term Filter */}
            <div>
              <label htmlFor="term-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Term
              </label>
              <select
                id="term-select"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Terms</option>
                {availableTerms.map(term => (
                  <option key={term} value={term}>Term {term}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              Showing subjects for: 
              <span className="font-medium ml-1">
                {selectedYear === 'all' ? 'All Years' : `Year ${selectedYear}`}
              </span>
              {' • '}
              <span className="font-medium">
                {selectedTerm === 'all' ? 'All Terms' : `Term ${selectedTerm}`}
              </span>
              {user?.branch && (
                <>
                  {' • '}
                  <span className="font-medium">Branch: {user.branch}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{filteredSubjects.length}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Subjects
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Available for feedback
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{pendingFeedbacks.length}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Feedback
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Requires your input
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{completedFeedbacks.length}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Feedback submitted
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Feedback Section */}
        {pendingFeedbacks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Pending Feedback ({pendingFeedbacks.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingFeedbacks.map((subject) => {
                const status = getSubjectFeedbackStatus(subject);
                return (
                  <div key={subject._id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border-l-4 border-red-500">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Pending
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Code:</span> {subject.code}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Instructor:</span> {subject.instructor}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Year:</span> {subject.year} | 
                          <span className="font-medium ml-2">Term:</span> {subject.term}
                        </p>
                      </div>
                      
                      {/* Feedback Type Status */}
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Mid-term Feedback:</span>
                          {status.midtermSubmitted ? (
                            <span className="text-green-600 text-sm">✓ Completed</span>
                          ) : (
                            <span className="text-red-600 text-sm">⚠ Pending</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">End-term Feedback:</span>
                          {status.endtermSubmitted ? (
                            <span className="text-green-600 text-sm">✓ Completed</span>
                          ) : (
                            <span className="text-red-600 text-sm">⚠ Pending</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {!status.midtermSubmitted && (
                          <button
                            onClick={() => handleGiveFeedback(subject, 'midterm')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                          >
                            📋 Give Mid-term Feedback
                          </button>
                        )}
                        {!status.endtermSubmitted && (
                          <button
                            onClick={() => handleGiveFeedback(subject, 'endterm')}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                          >
                            📊 Give End-term Feedback
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Feedback Section */}
        {completedFeedbacks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Completed Feedback ({completedFeedbacks.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedFeedbacks.map((subject) => {
                const status = getSubjectFeedbackStatus(subject);
                return (
                  <div key={subject._id} className="bg-white shadow rounded-lg overflow-hidden border-l-4 border-green-500">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Code:</span> {subject.code}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Instructor:</span> {subject.instructor}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Year:</span> {subject.year} | 
                          <span className="font-medium ml-2">Term:</span> {subject.term}
                        </p>
                      </div>
                      
                      {/* Feedback Completion Status */}
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Mid-term:</span>
                          <span className="text-green-600 text-sm font-medium">✓ Submitted</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">End-term:</span>
                          <span className="text-green-600 text-sm font-medium">✓ Submitted</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center text-green-600">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">All Feedback Submitted</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredSubjects.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
              <p className="text-gray-600 mb-4">
                There are no subjects available for the selected year and term filters.
              </p>
              <button
                onClick={() => {
                  setSelectedYear('all');
                  setSelectedTerm('all');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/my-feedback')}
              className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 2a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              View My Feedback History
            </button>

            <button
              onClick={() => router.push('/profile')}
              className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Update Profile
            </button>

            <button
              onClick={() => {
                setSelectedYear('all');
                setSelectedTerm('all');
                refreshDashboard();
              }}
              className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}