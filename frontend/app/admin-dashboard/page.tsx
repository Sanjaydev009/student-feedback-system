'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/utils/api';

// Define interfaces for our data types
interface DashboardStats {
  totalStudents: number;
  totalFaculty: number;
  totalSubjects: number;
  totalFeedbacks: number;
  averageRating: number;
  feedbackCompletion: number;
}

interface RecentFeedback {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  subject: {
    _id: string;
    name: string;
    code: string;
    instructor: string;
  };
  rating: number;
  comments: string | {
    teachingMethodComments?: string;
    courseContentComments?: string;
    additionalComments?: string;
    suggestions?: string;
    overallExperience?: string;
  };
  createdAt?: string; // Make optional
}

interface ActivityItem {
  _id: string;
  type: string;
  user: {
    _id: string;
    name: string;
    role: string;
  };
  description: string;
  timestamp?: string; // Make optional
}

export default function Page() {
  // Default fallback data
  const defaultStats: DashboardStats = {
    totalStudents: 0,
    totalFaculty: 0,
    totalSubjects: 0,
    totalFeedbacks: 0,
    averageRating: 0,
    feedbackCompletion: 0
  };
  
  // State management
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isClient, setIsClient] = useState(false);
  
  // Student creation modal states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    branch: 'MCA Regular',
    year: 1,
    password: ''
  });
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentMessage, setStudentMessage] = useState('');

  // Set client-side flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Set time of day greeting and current date
  useEffect(() => {
    if (!isClient) return;
    
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('Good Morning');
    else if (hour < 17) setTimeOfDay('Good Afternoon');
    else setTimeOfDay('Good Evening');
    
    // Set current date
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
  }, [isClient]);

  // Fetch dashboard data
  useEffect(() => {
    if (!isClient) return;
    
    const fetchDashboardData = async () => {
      console.log('🚀 Fetching dashboard data...');
      setLoading(true);
      try {
        // Verify token exists
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          window.location.href = '/login';
          return;
        }
        
        console.log('Making API calls with token');
        
        // Use individual try/catch blocks for each API call
        let statsData = null;
        try {
          const statsRes = await api.get('/api/feedback/stats');
          console.log('Stats API response:', statsRes);
          statsData = statsRes.data;
          setStats(statsData);
        } catch (statsErr) {
          console.error('Stats API error:', statsErr);
        }
        
        let feedbackData = [];
        try {
          const recentFeedbackRes = await api.get('/api/feedback/recent?limit=5');
          console.log('Recent feedback API response:', recentFeedbackRes);
          feedbackData = recentFeedbackRes.data || [];
          setRecentFeedback(feedbackData);
        } catch (feedbackErr) {
          console.error('Feedback API error:', feedbackErr);
        }
        
        let activityData = [];
        try {
          const recentActivityRes = await api.get('/api/feedback/activities');
          console.log('Activities API response:', recentActivityRes);
          activityData = recentActivityRes.data || [];
          setRecentActivity(activityData);
        } catch (activityErr) {
          console.error('Activity API error:', activityErr);
          // If API fails, use mock data for demo purposes
          const mockActivityData: ActivityItem[] = [
            {
              _id: 'mock-1',
              type: 'feedback',
              user: { _id: 'user-1', name: 'John Doe', role: 'student' },
              description: 'Submitted feedback for Computer Networks course',
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
            },
            {
              _id: 'mock-2', 
              type: 'login',
              user: { _id: 'user-2', name: 'Dr. Smith', role: 'faculty' },
              description: 'Logged into the system',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
            },
            {
              _id: 'mock-3',
              type: 'register',
              user: { _id: 'user-3', name: 'Jane Wilson', role: 'student' },
              description: 'New student registered in the system',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
            },
            {
              _id: 'mock-4',
              type: 'update',
              user: { _id: 'admin-1', name: 'Admin User', role: 'admin' },
              description: 'Updated system configuration',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
            },
            {
              _id: 'mock-5',
              type: 'feedback',
              user: { _id: 'user-4', name: 'Sarah Johnson', role: 'student' },
              description: 'Submitted feedback for Database Management course',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2 days ago
            }
          ];
          setRecentActivity(mockActivityData);
        }
        
        // Only clear error if we have at least some data
        if (statsData || feedbackData.length || activityData.length) {
          setError('');
        } else {
          setError('Failed to load dashboard data. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isClient]);

  // Format date for UI display
  const formatDate = (dateString: string | undefined) => {
    // Handle invalid or empty date strings
    if (!dateString) {
      return 'No date';
    }
    
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    try {
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Format error';
    }
  };

  // Handle student creation
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentLoading(true);
    setStudentMessage('');

    try {
      // Validate form
      if (!studentForm.name.trim() || !studentForm.email.trim()) {
        setStudentMessage('❌ Name and email are required');
        return;
      }

      const response = await api.post('/api/auth/register', {
        name: studentForm.name.trim(),
        email: studentForm.email.trim(),
        rollNumber: studentForm.rollNumber.trim() || undefined, // Let backend generate if empty
        branch: studentForm.branch,
        year: studentForm.year,
        role: 'student',
        password: studentForm.password.trim() || undefined // Use default if empty
      });

      setStudentMessage('✅ Student created successfully! They will receive an email with login credentials.');
      
      // Reset form
      setStudentForm({
        name: '',
        email: '',
        rollNumber: '',
        branch: 'MCA Regular',
        year: 1,
        password: ''
      });

      // Refresh dashboard data
      setTimeout(() => {
        window.location.reload(); // Simple refresh for now
        setShowStudentModal(false);
        setStudentMessage('');
      }, 2000);

    } catch (error: any) {
      console.error('Student creation error:', error);
      setStudentMessage(`❌ ${error.response?.data?.message || 'Failed to create student'}`);
    } finally {
      setStudentLoading(false);
    }
  };

  // Simple loading state for SSR
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 shadow-lg rounded-xl mb-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="max-w-7xl mx-auto py-8 px-6 sm:px-8 relative">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center mr-4 shadow-inner backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.168 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white sm:truncate">
                    {timeOfDay}, Admin
                  </h1>
                  <p className="mt-1 text-sm text-blue-100 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {currentDate}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
              <Link
                href="/admin-dashboard/reports"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                View Reports
              </Link>
              <Link
                href="/admin-dashboard/subjects"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Subject
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Error display */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-md" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Students Card */}
              <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6 relative">
                  <div className="absolute top-0 right-0 mt-4 mr-4 bg-blue-50 rounded-full p-2">
                    <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="inline-block text-blue-500 text-sm font-semibold mb-2 bg-blue-50 rounded-full px-3 py-1">Students</span>
                  <div className="mt-4 flex items-baseline">
                    <h2 className="text-3xl font-extrabold text-gray-900">{stats?.totalStudents || 0}</h2>
                    <p className="ml-2 text-sm text-gray-500">enrolled</p>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-xs font-medium text-gray-600">Active learning</span>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gradient-to-br from-gray-50 to-blue-50 border-t border-gray-100">
                  <Link href="/admin-dashboard/users" className="flex justify-between items-center text-blue-600 hover:text-blue-800 font-medium transition-all duration-300">
                    <span>View all students</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Faculty Card */}
              <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6 relative">
                  <div className="absolute top-0 right-0 mt-4 mr-4 bg-green-50 rounded-full p-2">
                    <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <span className="inline-block text-green-600 text-sm font-semibold mb-2 bg-green-50 rounded-full px-3 py-1">Faculty</span>
                  <div className="mt-4 flex items-baseline">
                    <h2 className="text-3xl font-extrabold text-gray-900">{stats?.totalFaculty || 0}</h2>
                    <p className="ml-2 text-sm text-gray-500">professionals</p>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                      </svg>
                      <span className="text-xs font-medium text-gray-600">Qualified instructors</span>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gradient-to-br from-gray-50 to-green-50 border-t border-gray-100">
                  <Link href="/admin-dashboard/users?role=faculty" className="flex justify-between items-center text-green-600 hover:text-green-800 font-medium transition-all duration-300">
                    <span>View all faculty</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Subjects Card */}
              <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6 relative">
                  <div className="absolute top-0 right-0 mt-4 mr-4 bg-purple-50 rounded-full p-2">
                    <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="inline-block text-purple-600 text-sm font-semibold mb-2 bg-purple-50 rounded-full px-3 py-1">Subjects</span>
                  <div className="mt-4 flex items-baseline">
                    <h2 className="text-3xl font-extrabold text-gray-900">{stats?.totalSubjects || 0}</h2>
                    <p className="ml-2 text-sm text-gray-500">courses</p>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-purple-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 005.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
                      </svg>
                      <span className="text-xs font-medium text-gray-600">Diverse curriculum</span>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gradient-to-br from-gray-50 to-purple-50 border-t border-gray-100">
                  <Link href="/admin-dashboard/subjects" className="flex justify-between items-center text-purple-600 hover:text-purple-800 font-medium transition-all duration-300">
                    <span>View all subjects</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Total Feedback Card */}
              <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6 relative">
                  <div className="absolute top-0 right-0 mt-4 mr-4 bg-amber-50 rounded-full p-2">
                    <svg className="h-6 w-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <span className="inline-block text-amber-600 text-sm font-semibold mb-2 bg-amber-50 rounded-full px-3 py-1">Feedback</span>
                  <div className="mt-4 flex items-baseline">
                    <h2 className="text-3xl font-extrabold text-gray-900">{stats?.totalFeedbacks || 0}</h2>
                    <p className="ml-2 text-sm text-gray-500">submissions</p>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-amber-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2v-8a2 2 0 00-2-2h-5l-5-5v5zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-xs font-medium text-gray-600">Student insights</span>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gradient-to-br from-gray-50 to-amber-50 border-t border-gray-100">
                  <Link href="/admin-dashboard/reports" className="flex justify-between items-center text-amber-600 hover:text-amber-800 font-medium transition-all duration-300">
                    <span>View feedback reports</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Average Rating Card */}
              <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6 relative">
                  <div className="absolute top-0 right-0 mt-4 mr-4 bg-red-50 rounded-full p-2">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <span className="inline-block text-red-600 text-sm font-semibold mb-2 bg-red-50 rounded-full px-3 py-1">Rating</span>
                  <div className="mt-4 flex items-baseline">
                    <h2 className="text-3xl font-extrabold text-gray-900">
                      {typeof stats.averageRating === 'number' ? stats.averageRating.toFixed(1) : "0.0"}
                    </h2>
                    <p className="ml-2 text-sm text-gray-500">out of 5.0</p>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i}
                          className={`h-5 w-5 ${i < Math.round(stats.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gradient-to-br from-gray-50 to-red-50 border-t border-gray-100">
                  <Link href="/admin-dashboard/analytics" className="flex justify-between items-center text-red-600 hover:text-red-800 font-medium transition-all duration-300">
                    <span>View rating details</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Feedback Completion Card */}
              <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6 relative">
                  <div className="absolute top-0 right-0 mt-4 mr-4 bg-indigo-50 rounded-full p-2">
                    <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="inline-block text-indigo-600 text-sm font-semibold mb-2 bg-indigo-50 rounded-full px-3 py-1">Completion</span>
                  <div className="mt-4 flex items-baseline">
                    <h2 className="text-3xl font-extrabold text-gray-900">{stats?.feedbackCompletion || 0}%</h2>
                    <p className="ml-2 text-sm text-gray-500">of students</p>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-1000" 
                        style={{width: `${stats?.feedbackCompletion || 0}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gradient-to-br from-gray-50 to-indigo-50 border-t border-gray-100">
                  <Link href="/admin-dashboard/reports" className="flex justify-between items-center text-indigo-600 hover:text-indigo-800 font-medium transition-all duration-300">
                    <span>View completion stats</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Actions and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zm11 14a1 1 0 11-2 0v-5H6v5a1 1 0 01-2 0V7h12v9z" clipRule="evenodd" />
                      </svg>
                      Quick Actions
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <Link href="/admin-dashboard/users/bulk-upload" 
                      className="w-full flex items-center p-4 rounded-lg hover:bg-blue-50 transition-all duration-300 border border-gray-100 group">
                      <div className="bg-green-100 rounded-lg p-3 mr-4 group-hover:bg-green-200 transition-all duration-300">
                        <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-900 group-hover:text-blue-700 transition-all duration-300">Bulk Add Students</p>
                        <p className="text-sm text-gray-500">Upload CSV file with multiple student data</p>
                      </div>
                    </Link>
                    
                    <Link href="/admin-dashboard/subjects/add" 
                      className="w-full flex items-center p-4 rounded-lg hover:bg-blue-50 transition-all duration-300 border border-gray-100 group">
                      <div className="bg-blue-100 rounded-lg p-3 mr-4 group-hover:bg-blue-200 transition-all duration-300">
                        <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-900 group-hover:text-blue-700 transition-all duration-300">Add Subject</p>
                        <p className="text-sm text-gray-500">Create a new subject with instructor</p>
                      </div>
                    </Link>
                    
                    <Link href="/admin-dashboard/reports" 
                      className="w-full flex items-center p-4 rounded-lg hover:bg-blue-50 transition-all duration-300 border border-gray-100 group">
                      <div className="bg-purple-100 rounded-lg p-3 mr-4 group-hover:bg-purple-200 transition-all duration-300">
                        <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 012 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-900 group-hover:text-blue-700 transition-all duration-300">View Reports</p>
                        <p className="text-sm text-gray-500">Analyze feedback statistics and trends</p>
                      </div>
                    </Link>
                    
                    <Link href="/admin-dashboard/analytics" 
                      className="w-full flex items-center p-4 rounded-lg hover:bg-blue-50 transition-all duration-300 border border-gray-100 group">
                      <div className="bg-amber-100 rounded-lg p-3 mr-4 group-hover:bg-amber-200 transition-all duration-300">
                        <svg className="h-6 w-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-900 group-hover:text-blue-700 transition-all duration-300">Advanced Analytics</p>
                        <p className="text-sm text-gray-500">Deep insights into feedback patterns</p>
                      </div>
                    </Link>
                    
                    <Link href="/admin-dashboard/feedback-periods" 
                      className="w-full flex items-center p-4 rounded-lg hover:bg-blue-50 transition-all duration-300 border border-gray-100 group">
                      <div className="bg-indigo-100 rounded-lg p-3 mr-4 group-hover:bg-indigo-200 transition-all duration-300">
                        <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-900 group-hover:text-blue-700 transition-all duration-300">Feedback Periods</p>
                        <p className="text-sm text-gray-500">Manage mid-term and end-term feedback periods</p>
                      </div>
                    </Link>
                    
                    <Link href="/admin-dashboard/settings" 
                      className="w-full flex items-center p-4 rounded-lg hover:bg-blue-50 transition-all duration-300 border border-gray-100 group">
                      <div className="bg-gray-100 rounded-lg p-3 mr-4 group-hover:bg-gray-200 transition-all duration-300">
                        <svg className="h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-900 group-hover:text-blue-700 transition-all duration-300">System Settings</p>
                        <p className="text-sm text-gray-500">Configure system parameters</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="lg:col-span-2">
                <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Recent Activity
                      {recentActivity.length > 0 && (
                        <span className="ml-2 bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                          {recentActivity.length} new
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="overflow-hidden max-h-96 overflow-y-auto">
                    <ul className="divide-y divide-gray-100">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                          <li key={activity._id || `activity-${index}`} 
                              className="px-6 py-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 transform hover:scale-[1.02]">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                {activity.type === 'feedback' && (
                                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm ring-2 ring-blue-100">
                                    <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                  </div>
                                )}
                                {activity.type === 'login' && (
                                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-sm ring-2 ring-green-100">
                                    <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                  </div>
                                )}
                                {activity.type === 'register' && (
                                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-sm ring-2 ring-purple-100">
                                    <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                  </div>
                                )}
                                {activity.type === 'update' && (
                                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shadow-sm ring-2 ring-amber-100">
                                    <svg className="h-6 w-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center mb-1">
                                  <p className="text-sm font-semibold text-gray-900 truncate mr-2">
                                    {activity.user?.name || 'Unknown User'}
                                  </p>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    activity.user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                                    activity.user?.role === 'faculty' ? 'bg-green-100 text-green-800' :
                                    activity.user?.role === 'student' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {activity.user?.role?.toUpperCase() || 'UNKNOWN'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {activity.description || 'No description available'}
                                </p>
                                <p className="text-xs text-gray-500 mt-2 flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  {formatDate(activity.timestamp)}
                                </p>
                              </div>
                              {/* Add a pulse indicator for recent activities */}
                              {index < 2 && (
                                <div className="flex-shrink-0">
                                  <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="px-6 py-12 text-center">
                          <div className="bg-gray-50 rounded-xl p-6 max-w-sm mx-auto">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <h3 className="mt-4 text-sm font-medium text-gray-900">No recent activity</h3>
                            <p className="mt-2 text-sm text-gray-500">
                              Activity log will appear here as users interact with the system.
                            </p>
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                  {recentActivity.length > 0 && (
                    <div className="bg-gradient-to-r from-gray-50 to-indigo-50 px-6 py-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.707 1.707a1 1 0 001.414 1.414l2-2a1 1 0 00.293-.707V7z" clipRule="evenodd" />
                          </svg>
                          Showing {recentActivity.length} recent activities
                        </div>
                        <Link href="/admin-dashboard/activities" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-all duration-300">
                          <span>View all activities</span>
                          <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Feedback */}
            <div className="mt-8">
              <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                    Recent Feedback
                  </h3>
                </div>
                <div className="overflow-hidden">
                  {recentFeedback.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {recentFeedback.map((feedback, index) => (
                        <li key={feedback._id || `feedback-${index}`} className="p-6 hover:bg-blue-50 transition-all duration-300">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                  {feedback.student?.name ? feedback.student.name.charAt(0).toUpperCase() : 'S'}
                                </div>
                              </div>
                              <div className="ml-4">
                                <h4 className="text-base font-semibold text-gray-900 flex items-center">
                                  {feedback.student?.name || 'Unknown Student'}
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Student
                                  </span>
                                </h4>
                                <div className="mt-1 flex items-center text-sm text-gray-600">
                                  <svg className="h-4 w-4 mr-1 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 005.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
                                  </svg>
                                  <span className="font-medium">{feedback.subject?.name || 'Unknown Subject'}</span>
                                  <span className="ml-1 text-gray-500">({feedback.subject?.code || 'N/A'})</span>
                                </div>
                                <div className="mt-1 flex items-center text-sm text-gray-500">
                                  <svg className="h-4 w-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                                  </svg>
                                  Instructor: {feedback.subject?.instructor || 'Unknown'}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="flex items-center px-3 py-1 bg-gray-100 rounded-lg">
                                <div className="flex mr-2">
                                  {[...Array(5)].map((_, i) => (
                                    <svg 
                                      key={i}
                                      className={`h-5 w-5 ${i < Math.round(feedback.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                      xmlns="http://www.w3.org/2000/svg" 
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="font-semibold text-gray-900">
                                  {typeof feedback.rating === 'number' ? feedback.rating.toFixed(1) : '0.0'}
                                </span>
                              </div>
                              <div className="mt-2 text-xs text-gray-500 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {formatDate(feedback.createdAt)}
                              </div>
                            </div>
                          </div>
                          {feedback.comments ? (
                            <div className="mt-4 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                              {typeof feedback.comments === 'string' ? (
                                <p className="text-sm text-gray-700">"{feedback.comments}"</p>
                              ) : feedback.comments && typeof feedback.comments === 'object' ? (
                                <div className="space-y-2">
                                  {feedback.comments.teachingMethodComments && (
                                    <div>
                                      <span className="font-medium text-xs text-gray-600">Teaching Method: </span>
                                      <span className="text-sm text-gray-700">"{feedback.comments.teachingMethodComments}"</span>
                                    </div>
                                  )}
                                  {feedback.comments.courseContentComments && (
                                    <div>
                                      <span className="font-medium text-xs text-gray-600">Course Content: </span>
                                      <span className="text-sm text-gray-700">"{feedback.comments.courseContentComments}"</span>
                                    </div>
                                  )}
                                  {feedback.comments.additionalComments && (
                                    <div>
                                      <span className="font-medium text-xs text-gray-600">Additional Comments: </span>
                                      <span className="text-sm text-gray-700">"{feedback.comments.additionalComments}"</span>
                                    </div>
                                  )}
                                  {feedback.comments.suggestions && (
                                    <div>
                                      <span className="font-medium text-xs text-gray-600">Suggestions: </span>
                                      <span className="text-sm text-gray-700">"{feedback.comments.suggestions}"</span>
                                    </div>
                                  )}
                                  {feedback.comments.overallExperience && (
                                    <div>
                                      <span className="font-medium text-xs text-gray-600">Overall Experience: </span>
                                      <span className="text-sm text-gray-700">"{feedback.comments.overallExperience}"</span>
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-6 py-16 text-center">
                      <div className="bg-gray-50 rounded-xl p-6 max-w-sm mx-auto">
                        <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0  01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        <h3 className="mt-4 text-sm font-medium text-gray-900">No feedback submissions yet</h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Recent feedback will appear here once students start submitting their evaluations.
                        </p>
                        <div className="mt-6">
                          <button 
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            Refresh Data
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {recentFeedback.length > 0 && (
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        Showing {recentFeedback.length} recent feedback items
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => window.location.reload()}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                          Refresh
                        </button>
                        <Link 
                          href="/admin-dashboard/reports" 
                          className="inline-flex items-center px-4 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300">
                          <span>View all feedback</span>
                          <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Creation Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full z-10">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Add New Student</h3>
            </div>
            <div className="p-6">
              {/* Student form */}
              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                  />
                </div>
                
                <div>
                  <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700">
                    Roll Number <span className="text-gray-400 text-xs">(optional - will auto-generate if empty)</span>
                  </label>
                  <input
                    type="text"
                    name="rollNumber"
                    id="rollNumber"
                    value={studentForm.rollNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                    placeholder="e.g., 232P4R0001 (leave empty to auto-generate)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                  />
                </div>
                
                <div>
                  <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                    Branch
                  </label>
                  <select
                    name="branch"
                    id="branch"
                    value={studentForm.branch}
                    onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                  >
                    <option value="MCA Regular">MCA Regular</option>
                    <option value="MCA DS">MCA DS</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                    Year of Study
                  </label>
                  <input
                    type="number"
                    name="year"
                    id="year"
                    min="1"
                    max="5"
                    value={studentForm.year}
                    onChange={(e) => setStudentForm({ ...studentForm, year: Number(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password <span className="text-gray-400 text-xs">(optional - will use default if empty)</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    placeholder="Leave empty to use default password"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                  />
                  <p className="mt-1 text-xs text-gray-500">Student will receive login credentials via email</p>
                </div>
                
                {/* Success/Error message */}
                {studentMessage && (
                  <div className={`mt-4 text-sm rounded-md p-3 ${studentMessage.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {studentMessage}
                  </div>
                )}
                
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowStudentModal(false)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={studentLoading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium transition-all duration-300 ${
                      studentLoading ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    {studentLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Student'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}