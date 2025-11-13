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
  term: number;
  year: number;
  // Note: Removed questions field - we use MIDTERM_QUESTIONS only
}

interface FeedbackQuestion {
  id: number;
  question: string;
  type: 'rating' | 'comment';
  category: string;
}

// Mid-term feedback questions (8 questions + 2 comments)
const MIDTERM_QUESTIONS: FeedbackQuestion[] = [
  // Teaching Quality (4 questions)
  { id: 1, question: "How clearly does the faculty explain concepts?", type: 'rating', category: 'Teaching Quality' },
  { id: 2, question: "How well does the instructor adapt teaching methods to student needs?", type: 'rating', category: 'Teaching Quality' },
  { id: 3, question: "How well does the faculty clarify learning objectives?", type: 'rating', category: 'Teaching Quality' },
  { id: 4, question: "How well does the faculty encourage student participation?", type: 'rating', category: 'Teaching Quality' },
  
  // Faculty Engagement (2 questions)
  { id: 5, question: "How accessible is the faculty for doubts and guidance?", type: 'rating', category: 'Faculty Engagement' },
  { id: 6, question: "How effectively does the instructor handle student questions during class?", type: 'rating', category: 'Faculty Engagement' },
  
  // Course Delivery (2 questions)
  { id: 7, question: "How well-prepared does the faculty come to classes?", type: 'rating', category: 'Course Delivery' },
  { id: 8, question: "How would you rate the overall performance of the faculty?", type: 'rating', category: 'Course Delivery' },
  
  // Comments (2 questions)
  { id: 9, question: "What could be improved in teaching or course delivery?", type: 'comment', category: 'Comments' },
  { id: 10, question: "Any other comments or suggestions?", type: 'comment', category: 'Comments' }
];

// End-term feedback questions (11 rating questions + 4 comment questions)
const ENDTERM_QUESTIONS: FeedbackQuestion[] = [
  // Course Related (4 rating questions)
  { id: 1, question: "How well was the course content organized and structured?", type: 'rating', category: 'Course Related' },
  { id: 2, question: "How relevant and up-to-date was the course material provided?", type: 'rating', category: 'Course Related' },
  { id: 3, question: "How clearly were the course objectives communicated and achieved?", type: 'rating', category: 'Course Related' },
  { id: 4, question: "What additional topics or current trends would you like to see included in this course?", type: 'rating', category: 'Course Related' },
  
  // Faculty Related (4 rating questions)
  { id: 5, question: "How effective was the faculty's teaching methodology?", type: 'rating', category: 'Faculty Related' },
  { id: 6, question: "How well did the faculty communicate complex concepts?", type: 'rating', category: 'Faculty Related' },
  { id: 7, question: "How responsive was the faculty to student queries and concerns?", type: 'rating', category: 'Faculty Related' },
  { id: 8, question: "How fair and constructive was the faculty's evaluation and feedback?", type: 'rating', category: 'Faculty Related' },
  
  // Infrastructure Related (3 rating questions)
  { id: 9, question: "How would you rate the classroom environment (lighting, ventilation, seating)?", type: 'rating', category: 'Infrastructure Related' },
  { id: 10, question: "How effective were the audio-visual facilities (projector, mic, speakers) during lectures?", type: 'rating', category: 'Infrastructure Related' },
  { id: 11, question: "How reliable were campus resources such as Wi-Fi and digital learning platforms?", type: 'rating', category: 'Infrastructure Related' },
  
  // Comments (4 comment questions)
  { id: 12, question: "What aspects of the faculty's teaching approach worked well for you?", type: 'comment', category: 'Faculty Related' },
  { id: 13, question: "What aspects of the course content could be improved?", type: 'comment', category: 'Course Related' },
  { id: 14, question: "Which topics did you find most difficult or unclear?", type: 'comment', category: 'Course Related' },
  { id: 15, question: "What improvements would you recommend for the classroom or supporting facilities?", type: 'comment', category: 'Infrastructure Related' }
];

export default function SubmitFeedbackPage() {
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useToast();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [comments, setComments] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'midterm' | 'endterm'>('midterm');

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
      
      // Step 2: Get the subject ID and feedback type from URL
      const url = new URL(window.location.href);
      const subjectId = url.searchParams.get('subjectId');
      const typeParam = url.searchParams.get('type') as 'midterm' | 'endterm';

      if (!subjectId) {
        setError('No subject selected');
        setTimeout(() => router.push('/subjects'), 2000);
        return;
      }

      // Set feedback type from URL parameter
      const currentFeedbackType = typeParam === 'endterm' ? 'endterm' : 'midterm';
      setFeedbackType(currentFeedbackType);

      // Initialize arrays based on feedback type
      if (currentFeedbackType === 'endterm') {
        const ratingQuestions = ENDTERM_QUESTIONS.filter(q => q.type === 'rating');
        const commentQuestions = ENDTERM_QUESTIONS.filter(q => q.type === 'comment');
        setAnswers(Array(ratingQuestions.length).fill(0));
        setComments(Array(commentQuestions.length).fill(''));
      } else {
        const ratingQuestions = MIDTERM_QUESTIONS.filter(q => q.type === 'rating');
        const commentQuestions = MIDTERM_QUESTIONS.filter(q => q.type === 'comment');
        setAnswers(Array(ratingQuestions.length).fill(0));
        setComments(Array(commentQuestions.length).fill(''));
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
      
      setSubject(data);
      
      // Check if student already submitted feedback for this subject and type
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
      console.log('🔍 Frontend: Checking feedback status for:', { studentId, subjectId, type: feedbackType });
      const response = await api.get(`/api/feedback/student/${studentId}?subject=${subjectId}&type=${feedbackType}`);
      const data = response.data;
      
      console.log('📊 Frontend: Feedback status check result:', { 
        dataLength: Array.isArray(data) ? data.length : 'not array', 
        data: data 
      });
      
      setSubmitted(Array.isArray(data) && data.length > 0);
    } catch (err) {
      console.error('🚨 Frontend: Error checking feedback status:', err);
    }
  };

  const handleRatingChange = (index: number, value: number) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleCommentChange = (index: number, value: string) => {
    const updated = [...comments];
    updated[index] = value;
    setComments(updated);
  };

  // Helper function to get current questions based on feedback type
  const getCurrentQuestions = () => {
    return feedbackType === 'endterm' ? ENDTERM_QUESTIONS : MIDTERM_QUESTIONS;
  };

  const handleSubmit = async () => {
    const currentQuestions = getCurrentQuestions();
    const ratingQuestions = currentQuestions.filter(q => q.type === 'rating');
    const commentQuestions = currentQuestions.filter(q => q.type === 'comment');

    // Validate rating questions
    if (answers.some(a => a === 0)) {
      showWarning('Please answer all rating questions');
      return;
    }

    // Validate comment questions
    if (comments.some(c => !c.trim() || c.trim().length < 5)) {
      showWarning(`Please provide detailed responses to all comment questions (minimum 5 characters each)`);
      return;
    }

    if (!subject) {
      showError('Subject information missing');
      return;
    }
    
    if (submitted) {
      showWarning(`You have already submitted ${feedbackType} feedback for this subject`);
      router.push('/subjects');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare answers array with both ratings and comments including category info
      const allAnswers = [
        // Rating questions
        ...ratingQuestions.map((q, i) => ({
          question: q.question,
          answer: answers[i],
          type: 'rating',
          category: q.category
        })),
        // Comment questions
        ...commentQuestions.map((q, i) => ({
          question: q.question,
          answer: 0, // No numeric rating for comments
          type: 'comment',
          comment: comments[i],
          category: q.category
        }))
      ];

      const payload = {
        student: studentId,
        subject: subject._id,
        feedbackType: feedbackType,
        term: subject.term,
        academicYear: '2025-26',
        answers: allAnswers
      };

      // Debug: Log the payload being sent
      console.log('🔍 Frontend: Submitting feedback with payload:', {
        student: studentId,
        subject: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        feedbackType: feedbackType,
        term: subject.term,
        academicYear: '2025-26',
        answersCount: allAnswers.length
      });
      console.log('📤 Frontend: Full payload:', payload);

      const response = await api.post('/api/feedback', payload);

      // Show success message
      showSuccess(`${feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)} feedback submitted successfully!`);
      
      // Set submitted state to true to update UI
      setSubmitted(true);
      
      // Redirect to my feedback page to show the submitted feedback
      setTimeout(() => router.push('/my-feedback'), 1500);
      
    } catch (err: any) {
      console.error('🚨 Frontend: Failed to submit feedback:', err);
      console.error('🚨 Frontend: Error response:', JSON.stringify(err.response, null, 2));
      console.error('🚨 Frontend: Error response data:', JSON.stringify(err.response?.data, null, 2));
      
      // Handle specific error cases
      if (err.response?.status === 409) {
        // Conflict - already submitted
        console.log('🚨 Frontend: 409 Conflict detected:', JSON.stringify(err.response.data, null, 2));
        showWarning(`You have already submitted ${feedbackType} feedback for this subject`);
        setSubmitted(true);
        setTimeout(() => router.push('/my-feedback'), 1500);
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

      <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6">
        {/* Navigation buttons */}
        <div className="max-w-4xl mx-auto mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/subjects')}
              className="flex items-center justify-center sm:justify-start px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200 text-sm sm:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push('/my-feedback')}
              className="flex items-center justify-center sm:justify-start px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 text-sm sm:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Feedback
            </button>
          </div>
        </div>
        
        {/* Subject Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-card overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-4 sm:py-6 px-4 sm:px-6 text-white">
              <h1 className="text-xl sm:text-2xl font-bold mb-2">{subject.name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-blue-100">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <p className="text-blue-100 text-sm sm:text-base">Instructor: <span className="font-medium">{subject.instructor}</span></p>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-blue-100 text-sm sm:text-base">Code: <span className="font-medium">{subject.code}</span></p>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <p className="text-blue-100 text-sm sm:text-base">Feedback Type: <span className="font-medium">{feedbackType === 'endterm' ? 'End-Term Evaluation' : 'Mid-Term Evaluation'}</span></p>
                </div>
              </div>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <div className="bg-green-50 border border-green-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Midterm Feedback Already Submitted</h2>
                <p className="text-gray-600 mb-6">You have already provided midterm feedback for this subject.</p>
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
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6 sm:mb-8">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-3 sm:mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">📝 {feedbackType === 'endterm' ? 'End-Term Course & Faculty Evaluation' : 'Mid-Term Faculty Evaluation'}</h2>
                    <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
                      Please evaluate your instructor's teaching performance for the first half of this term. 
                      Your feedback is <span className="font-semibold text-blue-600">anonymous</span> and will help improve the learning experience.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-blue-800 mb-1">📋 Instructions:</p>
                        <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
                          <li>• Rate each aspect on a scale of 1-5 (1 = Poor, 5 = Excellent)</li>
                          <li>• Provide detailed comments in the text areas (minimum 5 characters)</li>
                          <li>• Your feedback will remain completely anonymous</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6 sm:space-y-8">
                  {/* RATING QUESTIONS - DYNAMIC SECTIONS BASED ON FEEDBACK TYPE */}
                  {(() => {
                    const currentQuestions = getCurrentQuestions();
                    const categories = [...new Set(currentQuestions.filter(q => q.type === 'rating').map(q => q.category))];
                    return categories.map((category) => {
                      const categoryQuestions = currentQuestions.filter(q => q.category === category && q.type === 'rating');
                    return (
                      <div key={category} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6">
                          <div className="flex items-center mb-2 sm:mb-0">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 012.184 1.327 3.42 3.42 0 01.63 2.248 3.42 3.42 0 01-.956 2.054 3.42 3.42 0 01-.62 3.135 3.42 3.42 0 01-2.054.956 3.42 3.42 0 01-2.184 1.327 3.42 3.42 0 01-4.438 0 3.42 3.42 0 01-2.184-1.327 3.42 3.42 0 01-2.054-.956 3.42 3.42 0 01-.62-3.135 3.42 3.42 0 01-.956-2.054 3.42 3.42 0 01.63-2.248 3.42 3.42 0 012.184-1.327z" />
                              </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                              {category}
                            </h3>
                          </div>
                          <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 sm:px-2.5 py-1 rounded-full">
                            {categoryQuestions.length} questions
                          </span>
                        </div>
                        <div className="space-y-4 sm:space-y-6">
                          {categoryQuestions.map((q) => (
                            <div key={q.id} className="p-3 sm:p-5 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200">
                              <label className="block font-semibold text-gray-800 mb-3 sm:mb-4 text-base sm:text-lg leading-relaxed">
                                {q.id}. {q.question}
                              </label>
                              <div className="flex justify-between items-center">
                                {/* Mobile Rating Layout - Stack Vertically */}
                                <div className="block sm:hidden w-full">
                                  <div className="mb-4 text-center">
                                    <div className="flex justify-between items-center mb-3">
                                      <span className="text-sm text-red-500 font-medium">Poor</span>
                                      <span className="text-sm text-green-500 font-medium">Excellent</span>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5].map(rating => (
                                      <button
                                        key={rating}
                                        type="button"
                                        onClick={() => handleRatingChange(q.id - 1, rating)}
                                        className={`relative flex flex-col items-center justify-center h-14 sm:h-16 rounded-xl transition-all duration-300 transform active:scale-95 ${
                                          answers[q.id - 1] === rating 
                                            ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white scale-105 shadow-lg border-2 border-blue-400' 
                                            : answers[q.id - 1] > rating
                                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                              : 'bg-gray-100 hover:bg-gray-200 hover:scale-105 border border-gray-200'
                                        }`}
                                      >
                                        <span className="text-lg sm:text-xl font-bold">{rating}</span>
                                        {rating === 1 && <span className="text-xs mt-1">Poor</span>}
                                        {rating === 5 && <span className="text-xs mt-1">Great</span>}
                                        {answers[q.id - 1] === rating && (
                                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </div>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Desktop Rating Layout - Horizontal */}
                                <div className="hidden sm:flex justify-between items-center w-full">
                                  <div className="flex items-center">
                                    <span className="text-sm text-red-500 font-medium mr-3">Poor</span>
                                    <span className="text-xs text-gray-400">1</span>
                                  </div>
                                  <div className="flex space-x-3">
                                    {[1, 2, 3, 4, 5].map(rating => (
                                      <button
                                        key={rating}
                                        type="button"
                                        onClick={() => handleRatingChange(q.id - 1, rating)}
                                        className={`relative flex flex-col items-center justify-center w-14 h-14 lg:w-16 lg:h-16 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                                          answers[q.id - 1] === rating 
                                            ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white scale-110 shadow-lg border-2 border-blue-400' 
                                            : answers[q.id - 1] > rating
                                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                              : 'bg-gray-100 hover:bg-gray-200 hover:scale-105 border border-gray-200'
                                        }`}
                                      >
                                        <span className="text-lg lg:text-xl font-bold">{rating}</span>
                                        {answers[q.id - 1] === rating && (
                                          <div className="absolute -top-1 -right-1 w-5 h-5 lg:w-6 lg:h-6 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 lg:h-4 lg:w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </div>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-xs text-gray-400 mr-3">5</span>
                                    <span className="text-sm text-green-500 font-medium">Excellent</span>
                                  </div>
                                </div>
                              </div>

                              {/* Current Selection Display */}
                              <div className="mt-4 text-center">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  answers[q.id - 1] 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {answers[q.id - 1] 
                                    ? `✓ Selected: ${answers[q.id - 1]}/5` 
                                    : 'Tap to select rating'
                                  }
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}

                  {/* COMMENT QUESTIONS - DYNAMIC SECTIONS BASED ON FEEDBACK TYPE */}
                  {(() => {
                    const currentQuestions = getCurrentQuestions();
                    const commentQuestions = currentQuestions.filter(q => q.type === 'comment');
                    
                    if (feedbackType === 'endterm') {
                      // Group comments by category for end-term
                      const commentCategories = [...new Set(commentQuestions.map(q => q.category))];
                      return commentCategories.map((category) => {
                        const categoryComments = commentQuestions.filter(q => q.category === category);
                        return (
                          <div key={`comment-${category}`} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-200 shadow-sm mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6">
                              <div className="flex items-center mb-2 sm:mb-0">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                                  💬 {category} Feedback
                                </h3>
                              </div>
                              <span className="ml-auto bg-green-100 text-green-800 text-xs font-medium px-2 sm:px-2.5 py-1 rounded-full">
                                {categoryComments.length} comments
                              </span>
                            </div>
                            <div className="space-y-4 sm:space-y-6">
                              {categoryComments.map((q, categoryIndex) => {
                                const globalIndex = commentQuestions.findIndex(cq => cq.id === q.id);
                                return (
                                  <div key={q.id} className="p-3 sm:p-5 bg-white border border-green-200 rounded-lg">
                                    <label className="block font-semibold text-gray-800 mb-3 sm:mb-4 text-base sm:text-lg leading-relaxed">
                                      {q.question}
                                    </label>
                                    <textarea
                                      value={comments[globalIndex] || ''}
                                      onChange={(e) => handleCommentChange(globalIndex, e.target.value)}
                                      className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm sm:text-base"
                                      rows={4}
                                      placeholder="Share your thoughts..."
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    } else {
                      // Single section for mid-term
                      return (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-200 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6">
                            <div className="flex items-center mb-2 sm:mb-0">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </div>
                              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                                💬 Detailed Feedback
                              </h3>
                            </div>
                            <span className="ml-auto bg-green-100 text-green-800 text-xs font-medium px-2 sm:px-2.5 py-1 rounded-full">
                              {commentQuestions.length} comments
                            </span>
                          </div>
                          <div className="space-y-4 sm:space-y-6">
                            {commentQuestions.map((q, index) => (
                        <div key={q.id} className="p-3 sm:p-5 bg-white border border-green-200 rounded-lg">
                          <label className="block font-semibold text-gray-800 mb-3 sm:mb-4 text-base sm:text-lg leading-relaxed">
                            {q.id}. {q.question}
                          </label>
                          <textarea
                            value={comments[index]}
                            onChange={(e) => handleCommentChange(index, e.target.value)}
                            placeholder="Please provide your detailed feedback here (minimum 5 characters)..."
                            rows={3}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all duration-200 text-sm sm:text-base ${
                              comments[index].length < 5 && comments[index].length > 0
                                ? 'border-red-300 bg-red-50'
                                : comments[index].length >= 5
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-300'
                            }`}
                          />
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-1 sm:gap-0">
                            <span className={`text-xs sm:text-sm ${
                              comments[index].length < 5
                                ? 'text-red-500' 
                                : 'text-green-600'
                            }`}>
                              {comments[index].length >= 5
                                ? `✓ ${comments[index].length} characters (Good!)`
                                : `${comments[index].length}/5 characters (minimum required)`
                              }
                            </span>
                            {comments[index].length >= 5 && (
                              <span className="text-green-600 text-xs sm:text-sm font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Complete
                              </span>
                            )}
                          </div>
                        </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    })()}

                  {/* Submit Section */}
                  <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="text-center mb-3 sm:mb-4">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Ready to Submit?</h4>
                      <p className="text-xs sm:text-sm text-gray-600 px-2">
                        Please review your responses before submitting. Your feedback is valuable and will remain anonymous.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className={`w-full py-3 sm:py-4 px-4 sm:px-6 text-white rounded-xl font-bold text-base sm:text-lg shadow-xl transition-all duration-300 transform focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 ${
                        submitting 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-2xl active:scale-95'
                      }`}
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white mr-2 sm:mr-3"></div>
                          <span>📤 Submitting Your Midterm Feedback...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg> */}
                          <span> Submit Midterm Feedback</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}