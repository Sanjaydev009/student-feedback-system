'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api-debug'; // Use debug API
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';

// Define proper interfaces
interface DashboardStats {
  studentsCount: number;
  facultyCount: number;
  hodCount: number;
  subjectsCount: number;
  totalFeedback: number;
}

interface RecentFeedback {
  _id: string;
  student: {
    name: string;
    rollNumber: string;
    branch: string;
  };
  subject: {
    name: string;
    code: string;
    instructor: string;
    branch: string;
  };
  averageRating: number | null;
  createdAt: string;
}

interface BranchRating {
  _id: string;
  averageRating: number | null;
  totalFeedbacks: number;
}

interface TopSubject {
  _id: string;
  averageRating: number | null;
  totalFeedbacks: number;
  subjectName: string;
  subjectCode: string;
  instructor: string;
  branch: string;
}

export default function DEANDashboard() {
  // State definitions
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([]);
  const [branchRatings, setBranchRatings] = useState<BranchRating[]>([]);
  const [topSubjects, setTopSubjects] = useState<TopSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    // Fetch dashboard data on component mount
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get dashboard statistics
      const response = await api.get('/api/dean/dashboard-stats');
      const data = response.data;
      
      // Handle the response with defensive checks
      if (data) {
        // For direct stats object
        if (data.studentsCount !== undefined) {
          setStats({
            studentsCount: data.studentsCount || 0,
            facultyCount: data.facultyCount || 0,
            hodCount: data.hodCount || 0,
            subjectsCount: data.subjectsCount || 0,
            totalFeedback: data.totalFeedback || 0
          });
        } 
        // For nested stats object
        else if (data.stats) {
          setStats({
            studentsCount: data.stats.studentsCount || 0,
            facultyCount: data.stats.facultyCount || 0,
            hodCount: data.stats.hodCount || 0,
            subjectsCount: data.stats.subjectsCount || 0,
            totalFeedback: data.stats.totalFeedback || 0
          });
        }
        
        // Set feedback data if available
        if (Array.isArray(data.recentFeedback)) {
          setRecentFeedback(data.recentFeedback);
        }
        
        // Set branch ratings if available
        if (Array.isArray(data.branchRatings)) {
          setBranchRatings(data.branchRatings);
        }
        
        // Set top subjects if available
        if (Array.isArray(data.topSubjects)) {
          setTopSubjects(data.topSubjects);
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { status?: number } };
        if (apiError.response?.status === 403) {
          showToast('Access denied. DEAN role required.', 'error');
          router.push('/login');
        } else {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          showToast(`Failed to load dashboard data: ${errorMessage}`, 'error');
        }
      } else {
        showToast('Failed to load dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getRatingColor = (rating: number | null) => {
    if (rating === null || rating === undefined) return 'text-gray-600 bg-gray-100';
    if (rating >= 4) return 'text-green-600 bg-green-100';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Retry
            </button>
            <Link
              href="/dean-dashboard/robust"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Use Robust Dashboard
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🛠️ Troubleshooting Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/debug/setup-dean"
              className="block p-4 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-center"
            >
              Setup Dean Account
            </Link>
            <Link
              href="/debug/token"
              className="block p-4 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-center"
            >
              Debug Token
            </Link>
            <Link
              href="/dean-dashboard/fixed"
              className="block p-4 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-center"
            >
              Simple Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard content
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">DEAN Dashboard</h1>
            <p className="text-purple-100">Institution-wide Management & Analytics</p>
            <p className="text-purple-100">Welcome to the comprehensive feedback management system</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dean-dashboard/fixed" 
              className="px-3 py-2 bg-white text-purple-800 rounded text-sm font-medium hover:bg-purple-100"
            >
              Simple Dashboard
            </Link>
            <Link
              href="/debug/token" 
              className="px-3 py-2 bg-white/20 text-white rounded text-sm font-medium hover:bg-white/30"
            >
              Debug Token
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Students Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.studentsCount}</p>
              </div>
            </div>
          </div>

          {/* Faculty Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Faculty</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.facultyCount}</p>
              </div>
            </div>
          </div>

          {/* HODs Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">HODs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.hodCount}</p>
              </div>
            </div>
          </div>

          {/* Subjects Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Subjects</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.subjectsCount}</p>
              </div>
            </div>
          </div>

          {/* Feedback Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Feedback</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalFeedback}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Feedback */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Feedback</h2>
            <Link
              href="/dean-dashboard/reports"
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentFeedback && recentFeedback.length > 0 ? (
              recentFeedback.map((feedback) => (
                <div key={feedback._id} className="border-l-4 border-purple-200 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{feedback.subject?.name || 'Unnamed Subject'}</p>
                      <p className="text-sm text-gray-600">
                        {feedback.student?.name || 'Unknown Student'} 
                        {feedback.student?.rollNumber ? `(${feedback.student.rollNumber})` : ''} - 
                        {feedback.subject?.branch || 'Unknown Branch'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(feedback.createdAt)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(feedback.averageRating)}`}>
                      {feedback.averageRating !== null 
                        ? `${Number(feedback.averageRating).toFixed(1)}★` 
                        : 'No rating'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent feedback available</p>
            )}
          </div>
        </div>

        {/* Branch Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Branch Performance</h2>
            <Link
              href="/dean-dashboard/branches"
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          
          <div className="space-y-3">
            {branchRatings && branchRatings.length > 0 ? (
              branchRatings.map((branch) => (
                <div key={branch._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{branch._id || 'Unknown Branch'}</p>
                    <p className="text-xs text-gray-500">{branch.totalFeedbacks} feedback(s)</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(branch.averageRating)}`}>
                      {branch.averageRating !== null 
                        ? `${Number(branch.averageRating).toFixed(1)}★` 
                        : 'No rating'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No branch ratings available</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Performing Subjects */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Top Performing Subjects</h2>
          <Link
            href="/dean-dashboard/subjects"
            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topSubjects && topSubjects.length > 0 ? (
            topSubjects.slice(0, 6).map((subject) => (
              <div key={subject._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{subject.subjectName || 'Unnamed Subject'}</p>
                    <p className="text-sm text-gray-600">{subject.subjectCode || 'No Code'}</p>
                    <p className="text-sm text-gray-600">{subject.instructor || 'No Instructor'}</p>
                    <p className="text-xs text-gray-500">{subject.branch || 'No Branch'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(subject.averageRating)}`}>
                    {subject.averageRating !== null 
                      ? `${Number(subject.averageRating).toFixed(1)}★` 
                      : 'No rating'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{subject.totalFeedbacks} feedback(s)</p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No subject performance data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            href="/dean-dashboard/subjects"
            className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <svg className="h-6 w-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="font-medium text-green-900">Subjects</span>
          </Link>

          <Link
            href="/dean-dashboard/reports"
            className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <svg className="h-6 w-6 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-medium text-orange-900">Reports</span>
          </Link>

          <Link
            href="/debug/token"
            className="flex items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
          >
            <svg className="h-6 w-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-medium text-yellow-900">Check Token</span>
          </Link>
        </div>
      </div>
      
      {/* Troubleshooting Links */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6 border-t-4 border-amber-500">
        <h2 className="text-lg font-bold text-gray-900 mb-4">🛠️ Troubleshooting</h2>
        <p className="text-sm text-gray-600 mb-4">            If you&apos;re experiencing issues with the dashboard, try these options:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dean-dashboard/fixed"
            className="block p-4 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-center text-sm font-medium"
          >
            Simple Dashboard
          </Link>
          <Link
            href="/debug/setup-dean"
            className="block p-4 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-center text-sm font-medium"
          >
            Setup Dean Account
          </Link>
          <Link
            href="/dean-dashboard/reports"
            className="block p-4 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-center text-sm font-medium"
          >
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
