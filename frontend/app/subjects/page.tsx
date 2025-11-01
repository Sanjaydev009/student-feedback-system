'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/StudentNavbar';
import { decodeToken, isAuthenticated, removeToken } from '@/utils/auth';
import api from '@/utils/api';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  branch: string[]; // Array to support multiple branches (common subjects)
  year: number;
  term: number; // Term defined as a number in the backend model
  hasSubmittedFeedback?: boolean; // Track if user has submitted feedback
}

interface FeedbackPeriod {
  _id: string;
  feedbackType: 'midterm' | 'endterm';
  term: number;
  academicYear: string;
  isActive: boolean;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studentBranch, setStudentBranch] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFeedbackPeriods, setActiveFeedbackPeriods] = useState<FeedbackPeriod[]>([]);
  const [activeFeedbackPeriod, setActiveFeedbackPeriod] = useState<FeedbackPeriod | null>(null);

  // Check login status and decode token
  useEffect(() => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        window.location.href = '/login';
        return;
      }

      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        window.location.href = '/login';
        return;
      }

      try {
        // Use our utility function to decode token
        const decoded = decodeToken(storedToken);
        
        // Check if user is a student
        if (decoded?.role !== 'student') {
          // Redirect non-students to appropriate dashboard
          if (decoded?.role === 'admin') {
            window.location.href = '/admin-dashboard';
          } else if (decoded?.role === 'hod') {
            window.location.href = '/hod-dashboard';
          } else {
            window.location.href = '/';
          }
          return;
        }

        // Set student branch and fetch data
        const userBranch = decoded?.branch || 'MCA Regular';
        console.log('🎯 Student branch from token:', userBranch);
        setStudentBranch(userBranch);
        
        // Fetch student name and subjects (token is automatically included by our api utility)
        console.log('📞 Calling fetchStudentName, fetchActiveFeedbackPeriod and fetchSubjects');
        fetchStudentName(storedToken);
        fetchActiveFeedbackPeriod();
        fetchSubjects(storedToken, userBranch);
        
      } catch (decodeError) {
        console.error('Error decoding token:', decodeError);
        // If token decoding fails, remove the invalid token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
    } catch (err: any) {
      console.error('Token validation error:', err.message);
      removeToken();
      window.location.href = '/login';
    }
  }, []);

  // Fetch active feedback periods
  const fetchActiveFeedbackPeriod = async () => {
    try {
      console.log('🔄 Fetching active feedback periods...');
      const response = await api.get('/api/feedback-periods/active');
      console.log('📊 Active feedback periods response:', response.data);
      
      const activePeriods = response.data;
      if (activePeriods && activePeriods.length > 0) {
        console.log('✅ Found active feedback periods:', activePeriods);
        setActiveFeedbackPeriods(activePeriods);
        // Set the first period as default for backward compatibility
        setActiveFeedbackPeriod(activePeriods[0]);
      } else {
        console.log('⚠️ No active feedback periods found');
        setActiveFeedbackPeriods([]);
        setActiveFeedbackPeriod(null);
      }
    } catch (error) {
      console.error('❌ Failed to fetch active feedback period:', error);
      setActiveFeedbackPeriods([]);
      setActiveFeedbackPeriod(null);
    }
  };

  // Get student name
  const fetchStudentName = async (token: string) => {
    try {
      // First try to get the name from the token (faster, no API call needed)
      try {
        const decoded = decodeToken(token);
        if (decoded?.name) {
          setStudentName(decoded.name);
          return; // We got the name, no need for API call
        }
      } catch (decodeErr) {
        console.warn('Could not decode token for name:', decodeErr);
        // Continue to API call if token decoding fails
      }
      
      // If no name in token or decoding failed, fetch from API
      try {
        const response = await api.get('/api/auth/me');
        if (response?.data?.name) {
          setStudentName(response.data.name);
        }
      } catch (apiErr: any) {
        console.error('Failed to load student profile via API:', apiErr);
        // The axios interceptor in api.ts will handle 401 errors automatically
        if (apiErr?.response?.status !== 401) {
          // Don't show alert immediately - only if we can't get user data at all
          console.warn('Could not get user profile data from API');
        }
      }
    } catch (err: any) {
      console.error('Failed to load student profile (outer try/catch):', err);
      // Set a default name as fallback
      setStudentName('Student');
    }
  };

  // Load subjects filtered by student's year and term
  const fetchSubjects = async (token: string, branch: string) => {
    console.log('🔍 fetchSubjects called with:', { token: token.substring(0, 20) + '...', branch });
    try {
      // Get subjects filtered by student's year, term, and branch
      console.log('🌐 Making API call to /api/subjects/student');
      const subjectsResponse = await api.get('/api/subjects/student');
      console.log('✅ Subjects API response:', subjectsResponse);
      
      if (!subjectsResponse?.data || !Array.isArray(subjectsResponse.data)) {
        console.error('❌ Invalid subjects response:', subjectsResponse);
        setSubjects([]);
        setLoading(false);
        return;
      }
      
      console.log(`📚 Found ${subjectsResponse.data.length} subjects`);
      
      // The API already filters by year, term, and branch, so we just need to get the data
      const filtered = subjectsResponse.data;
      
      let submittedFeedback: any[] = [];
      try {
        console.log('🔍 Fetching student feedback data...');
        // Get student's submitted feedback to determine which subjects already have feedback
        const feedbackResponse = await api.get('/api/feedback/student/me');
        submittedFeedback = feedbackResponse?.data || [];
        console.log(`📝 Found ${submittedFeedback.length} submitted feedback records`);
      } catch (feedbackErr) {
        console.error('⚠️ Failed to load feedback data (non-critical):', feedbackErr);
        // Continue with empty feedback data
      }
      
      // Mark subjects where feedback has been submitted (with safe access)
      const subjectsWithFeedbackStatus = filtered.map((subject: Subject) => {
        const hasSubmitted = Array.isArray(submittedFeedback) && submittedFeedback.some(
          (feedback: any) => feedback?.subject?._id === subject._id
        );
        
        return {
          ...subject,
          hasSubmittedFeedback: hasSubmitted
        };
      });
      
      // Sort subjects by term numerically (with safe access)
      const sortedSubjects = subjectsWithFeedbackStatus.sort((a: Subject, b: Subject) => {
        const termA = typeof a.term === 'number' ? a.term : 0;
        const termB = typeof b.term === 'number' ? b.term : 0;
        return termA - termB;
      });
      
      setSubjects(sortedSubjects);
    } catch (err: any) {
      console.error('Failed to load subjects:', err);
      console.error('Error details:', {
        message: err?.message,
        response: err?.response,
        status: err?.response?.status,
        data: err?.response?.data
      });
      
      // The axios interceptor in api.ts will handle 401 errors automatically
      if (err?.response?.status !== 401) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Unknown error occurred';
        alert(`Error loading subjects: ${errorMessage}. Please check the browser console for more details.`);
      }
      // Set empty subjects array on error
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center mt-8">Loading your subjects...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />

      <div className="container mx-auto p-4 md:p-6">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6 md:p-8 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {studentName || 'Student'}!</h1>
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 10.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            <p className="text-blue-100">
              Your branch: <span className="font-semibold">{studentBranch || 'MCA Regular'}</span>
            </p>
          </div>
        </div>

        {/* Feedback Period Status */}
        {activeFeedbackPeriods.length > 0 ? (
          <div className="mb-6 space-y-4">
            {activeFeedbackPeriods.map((period, index) => (
              <div key={period._id} className={`${
                period.feedbackType === 'midterm' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                  : 'bg-gradient-to-r from-purple-500 to-purple-600'
                } text-white rounded-lg shadow-lg p-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 rounded-full p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {period.feedbackType.charAt(0).toUpperCase() + period.feedbackType.slice(1)} Feedback Period Active
                      </h3>
                      <p className={`${
                        period.feedbackType === 'midterm' ? 'text-blue-100' : 'text-purple-100'
                      } text-sm`}>
                        {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
                    <span className="text-sm font-medium">Term {period.term}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">No Active Feedback Period</h3>
                <p className="text-gray-200 text-sm">Feedback submission is currently closed. Please wait for the next feedback period.</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8 border-l-4 border-blue-500 flex items-start">
          <div className="mr-4 mt-1 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-800">Feedback Instructions</h2>
            <p className="text-gray-600 mt-1">
              {activeFeedbackPeriods.length > 0
                ? `Feedback collection is now active! You can submit ${
                    activeFeedbackPeriods.map(p => p.feedbackType).join(' and ')
                  } feedback. Click on a subject card below to provide your valuable feedback with custom questions created by your admin.`
                : 'Feedback submission is currently closed. Please wait for the admin to activate a feedback period.'
              }
            </p>
          </div>
        </div>

        {subjects.length > 0 ? (
          // Group subjects by term
          Object.entries(
            subjects.reduce((acc: {[key: string]: Subject[]}, subject) => {
              // Ensure term is a properly formatted string
              const termKey = subject.term ? String(subject.term) : 'Unassigned';
              if (!acc[termKey]) {
                acc[termKey] = [];
              }
              acc[termKey].push(subject);
              return acc;
            }, {})
          ).sort((a, b) => {
            // Sort terms numerically
            if (a[0] === 'Unassigned') return 1;
            if (b[0] === 'Unassigned') return -1;
            return parseInt(a[0]) - parseInt(b[0]);
          }).map(([term, termSubjects]) => (
            <div key={term} className="mb-10">
              {/* Term Header */}
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-lg shadow-sm">
                  <h2 className="text-lg font-semibold">Term {term}</h2>
                </div>
                <div className="h-0.5 flex-grow bg-gray-200 ml-4"></div>
              </div>
              
              {/* Subjects Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {termSubjects.map((subject: Subject) => (
                  <div 
                    key={subject._id} 
                    className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-6 border-t-4 border-blue-500 rounded-t-lg">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                          {subject.name}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {subject.code}
                        </span>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                          <p className="text-gray-600">Instructor: <span className="font-medium">{subject.instructor}</span></p>
                        </div>
                        
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <p className="text-gray-600">Branch: 
                            <span className="font-medium ml-1">
                              {Array.isArray(subject.branch) 
                                ? subject.branch.join(', ') 
                                : subject.branch}
                              {Array.isArray(subject.branch) && subject.branch.length > 1 && (
                                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  Common
                                </span>
                              )}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      {/* Feedback Status & Action */}
                      <div className="mt-6 flex justify-between items-center">
                        {/* Status Badge */}
                        {subject.hasSubmittedFeedback ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Feedback Submitted
                          </span>
                        ) : activeFeedbackPeriods.length > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-7-8a1 1 0 011-1h3.586l-1.793-1.793a1 1 0 011.414-1.414l3.5 3.5a1 1 0 010 1.414l-3.5 3.5a1 1 0 01-1.414-1.414L6.586 11H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                            {activeFeedbackPeriods.length === 1 
                              ? `${activeFeedbackPeriods[0].feedbackType.charAt(0).toUpperCase() + activeFeedbackPeriods[0].feedbackType.slice(1)} Open`
                              : 'Multiple Periods Open'
                            }
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Closed
                          </span>
                        )}
                        
                        {/* Action Button(s) */}
                        {subject.hasSubmittedFeedback ? (
                          <Link href={`/my-feedback?subjectId=${subject._id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                            View Feedback
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </Link>
                        ) : activeFeedbackPeriods.length > 0 ? (
                          <div className="flex flex-col space-y-2">
                            {activeFeedbackPeriods.map((period) => (
                              <Link 
                                key={period._id}
                                href={`/submit-feedback?subjectId=${subject._id}&type=${period.feedbackType}`} 
                                className={`inline-flex items-center justify-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                                  period.feedbackType === 'midterm'
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                                    : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                                }`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                {period.feedbackType === 'midterm' ? '📝 Midterm Feedback' : '📝 Endterm Feedback'}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Feedback Closed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col justify-center items-center py-16 bg-white rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium mb-1">No subjects found</p>
            <p className="text-gray-400 text-sm">There are no subjects available for your branch at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}