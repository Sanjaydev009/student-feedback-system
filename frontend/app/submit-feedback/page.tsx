'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentNavbar from '@/components/StudentNavbar';
import { decodeToken, isAuthenticated } from '@/utils/auth';
import { useToast } from '@/components/ToastProvider';
import api from '@/utils/api';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  branch: string[]; // Array to support multiple branches (common subjects)
  questions: string[];
}

export default function SubmitFeedbackPage() {
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useToast();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [answers, setAnswers] = useState<number[]>(Array(10).fill(0));
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Check authentication and get user info
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const decoded = decodeToken(token!);
      
      if (decoded.role !== 'student') {
        showError('Only students can give feedback');
        
        // Redirect to appropriate dashboard based on role
        if (decoded.role === 'admin') {
          router.push('/admin-dashboard');
        } else if (decoded.role === 'hod') {
          router.push('/hod-dashboard');
        } else {
          router.push('/');
        }
        return;
      }
      
      setStudentId(decoded.id);
      
      // Step 2: Get the subject ID from URL
      const url = new URL(window.location.href);
      const subjectId = url.searchParams.get('subjectId');

      if (!subjectId) {
        setError('No subject selected');
        setTimeout(() => router.push('/subjects'), 2000);
        return;
      }

      // Step 3: Fetch subject details
      fetchSubject(subjectId);
      
    } catch (err: any) {
      console.error('Authentication error:', err);
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch subject details
  const fetchSubject = async (subjectId: string) => {
    try {
      const response = await api.get(`/api/subjects/${subjectId}`);
      const data = response.data;

      if (!data.questions || data.questions.length < 10) {
        setError('This subject has invalid feedback questions');
        setTimeout(() => router.push('/subjects'), 2000);
        return;
      }
      
      setSubject(data);
      
      // Check if student already submitted feedback for this subject
      checkFeedbackStatus(data._id);
      
    } catch (err: any) {
      console.error('Failed to load subject:', err);
      setError('Failed to load subject information');
      setTimeout(() => router.push('/subjects'), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Check if student already submitted feedback
  const checkFeedbackStatus = async (subjectId: string) => {
    if (!studentId) return;
    
    try {
      // Use our API utility for consistent error handling
      const response = await api.get(`/api/feedback/student/${studentId}?subject=${subjectId}`);
      const data = response.data;
      
      setSubmitted(Array.isArray(data) && data.length > 0);
    } catch (err) {
      console.error('Error checking feedback status:', err);
    }
  };

  const handleRatingChange = (index: number, value: number) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    if (answers.some(a => a === 0)) {
      showWarning('Please answer all questions');
      return;
    }

    if (!subject) {
      showError('Subject information missing');
      return;
    }
    
    if (submitted) {
      showWarning('You have already submitted feedback for this subject');
      router.push('/subjects');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post('/api/feedback', {
        student: studentId,
        subject: subject._id,
        answers: answers.map((ans, i) => ({
          question: subject.questions[i],
          answer: ans
        }))
      });

      // Show success message
      showSuccess('Feedback submitted successfully!');
      
      // Set submitted state to true to update UI
      setSubmitted(true);
      
      // Redirect to student dashboard
      setTimeout(() => router.push('/subjects'), 1500);
      
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      
      // Handle specific error cases
      if (err.response?.status === 409) {
        // Conflict - already submitted
        showWarning('You have already submitted feedback for this subject');
        setSubmitted(true);
        setTimeout(() => router.push('/subjects'), 1500);
      } else if (err.response?.data?.message) {
        showError(`Error: ${err.response.data.message}`);
      } else {
        showError('Failed to submit feedback. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading subject information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentNavbar />
        <div className="flex items-center justify-center pt-20">
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => router.push('/subjects')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
              <button 
                onClick={() => router.push('/subjects')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                View Subjects
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentNavbar />
        <div className="flex items-center justify-center pt-20">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Subject not found</h2>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => router.push('/subjects')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
              <button 
                onClick={() => router.push('/subjects')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Browse Subjects
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />

      <div className="container mx-auto py-8 px-4 md:px-6">
        {/* Navigation buttons */}
        <div className="max-w-3xl mx-auto mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/subjects')}
              className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push('/my-feedback')}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Feedback
            </button>
          </div>
        </div>
        
        {/* Subject Card */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-card overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-6 px-6 text-white">
              <h1 className="text-2xl font-bold">{subject.name}</h1>
              <div className="flex items-center mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <p className="text-blue-100">Instructor: <span className="font-medium">{subject.instructor}</span></p>
              </div>
              <div className="flex items-center mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <p className="text-blue-100">Code: <span className="font-medium">{subject.code}</span></p>
              </div>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <div className="bg-green-50 border border-green-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Feedback Already Submitted</h2>
                <p className="text-gray-600 mb-6">You have already provided feedback for this subject.</p>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => router.push('/subjects')}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Back to Dashboard
                  </button>
                  <button 
                    onClick={() => router.push('/my-feedback')}
                    className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    View My Feedback
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Rate the following aspects:</h2>
                
                <div className="space-y-8">
                  {Array.isArray(subject.questions) && subject.questions.length >= 10 ? (
                    subject.questions.slice(0, 10).map((q, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-medium">
                        <label className="block font-medium text-gray-800 mb-3">{q}</label>
                        <div className="flex justify-between items-center">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => handleRatingChange(index, rating)}
                              className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-transform duration-150 ${
                                answers[index] === rating 
                                  ? 'bg-blue-600 text-white scale-110' 
                                  : answers[index] > rating
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              <span className="text-xl">{rating}</span>
                              <span className="text-xs mt-1">{rating === 1 ? 'Poor' : rating === 5 ? 'Excellent' : ''}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-center">
                      <p className="text-red-600">⚠️ This subject doesn't have valid questions.</p>
                    </div>
                  )}                          <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`w-full py-3 px-4 mt-8 text-white rounded-md font-medium shadow-sm transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      submitting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}