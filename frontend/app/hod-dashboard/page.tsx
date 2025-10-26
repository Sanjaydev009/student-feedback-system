'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';

interface DashboardStats {
  studentsCount: number;
  facultyCount: number;
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
  };
  averageRating: number | null;
  createdAt: string;
}

interface SubjectRating {
  _id: string;
  averageRating: number | null;
  totalFeedbacks: number;
  subjectName: string;
  subjectCode: string;
  instructor: string;
}

export default function HODDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([]);
  const [subjectRatings, setSubjectRatings] = useState<SubjectRating[]>([]);
  const [branch, setBranch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/hod/dashboard-stats');
      const data = response.data;
      
      setStats(data.stats);
      setRecentFeedback(data.recentFeedback);
      setSubjectRatings(data.subjectRatings);
      setBranch(data.branch);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 403) {
        showToast('Access denied. HOD role required.', 'error');
        router.push('/login');
      } else {
        showToast('Failed to load dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingColor = (rating: number | null) => {
    if (rating === null || rating === undefined) return 'text-gray-600 bg-gray-100';
    if (rating >= 4) return 'text-green-600 bg-green-100';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">HOD Dashboard</h1>
        <p className="text-blue-100">Department: {branch}</p>
        <p className="text-blue-100">Welcome to your department management panel</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Students</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.studentsCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Faculty</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.facultyCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Subjects</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.subjectsCount}</p>
              </div>
            </div>
          </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Feedback */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Feedback</h2>
            <button
              onClick={() => {
                showToast('Loading reports...', 'info');
                router.push('/hod-dashboard/reports');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {recentFeedback.length > 0 ? (
              recentFeedback.map((feedback) => (
                <div key={feedback._id} className="border-l-4 border-blue-200 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{feedback.subject.name}</p>
                      <p className="text-sm text-gray-600">by {feedback.student.name} ({feedback.student.rollNumber})</p>
                      <p className="text-xs text-gray-500">{formatDate(feedback.createdAt)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(feedback.averageRating)}`}>
                      {feedback.averageRating !== null ? `${feedback.averageRating.toFixed(1)}★` : 'No rating'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent feedback</p>
            )}
          </div>
        </div>

        {/* Subject Ratings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Subject Performance</h2>
            <button
              onClick={() => router.push('/hod-dashboard/subjects')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {subjectRatings.length > 0 ? (
              subjectRatings.slice(0, 5).map((subject) => (
                <div key={subject._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{subject.subjectName}</p>
                    <p className="text-sm text-gray-600">{subject.instructor}</p>
                    <p className="text-xs text-gray-500">{subject.totalFeedbacks} feedback(s)</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(subject.averageRating)}`}>
                      {subject.averageRating !== null ? `${subject.averageRating.toFixed(1)}★` : 'No rating'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No subject ratings available</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/hod-dashboard/students')}
            className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span className="font-medium text-blue-900">Manage Students</span>
          </button>

          <button
            onClick={() => router.push('/hod-dashboard/faculty')}
            className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <svg className="h-6 w-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-medium text-green-900">View Faculty</span>
          </button>

          <button
            onClick={() => router.push('/hod-dashboard/subjects')}
            className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <svg className="h-6 w-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="font-medium text-purple-900">View Subjects</span>
          </button>

          <button
            onClick={() => {
              showToast('Loading reports dashboard...', 'info');
              router.push('/hod-dashboard/reports');
            }}
            className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <svg className="h-6 w-6 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-medium text-orange-900">Feedback Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}