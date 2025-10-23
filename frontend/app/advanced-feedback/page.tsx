'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StudentNavbar from '@/components/StudentNavbar';
import { decodeToken, isAuthenticated } from '@/utils/auth';
import api from '@/utils/api';
import { 
  midtermQuestions, 
  endtermQuestions, 
  ratingScale, 
  getQuestionsByCategory,
  type FeedbackQuestion 
} from '@/utils/feedbackTemplates';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  branch: string[];
  year: number;
  term: number;
}

function AdvancedFeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const feedbackType = (searchParams.get('type') || 'midterm') as 'midterm' | 'endterm';
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [comments, setComments] = useState({
    teachingMethodComments: '',
    courseContentComments: '',
    additionalComments: '',
    suggestions: '',
    overallExperience: ''
  });
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const token = localStorage.getItem('token');
    const decoded = decodeToken(token!);
    
    if (decoded.role !== 'student') {
      router.push('/login');
      return;
    }

    setStudentId(decoded.id);
    
    // Set questions based on feedback type
    const selectedQuestions = feedbackType === 'midterm' ? midtermQuestions : endtermQuestions;
    setQuestions(selectedQuestions);
    
    // Initialize answers for rating questions
    const initialAnswers: Record<string, number | string> = {};
    selectedQuestions.forEach(q => {
      if (q.type === 'rating') {
        initialAnswers[q.id] = 0;
      } else {
        initialAnswers[q.id] = '';
      }
    });
    setAnswers(initialAnswers);

    if (subjectId) {
      fetchSubject();
    } else {
      setError('No subject selected');
      setLoading(false);
    }
  }, [subjectId, feedbackType]);

  const fetchSubject = async () => {
    try {
      const response = await api.get(`/api/subjects/${subjectId}`);
      setSubject(response.data);
    } catch (err: any) {
      setError('Failed to load subject details');
      console.error('Error fetching subject:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (questionId: string, rating: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: rating }));
  };

  const handleCommentChange = (questionId: string, comment: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: comment }));
  };

  const calculateProgress = () => {
    const ratingQuestions = questions.filter(q => q.type === 'rating');
    const answeredRatings = ratingQuestions.filter(q => Number(answers[q.id]) > 0).length;
    return Math.round((answeredRatings / ratingQuestions.length) * 100);
  };

  const validateSection = (sectionQuestions: FeedbackQuestion[]) => {
    return sectionQuestions
      .filter(q => q.required && q.type === 'rating')
      .every(q => Number(answers[q.id]) > 0);
  };

  const handleSubmit = async () => {
    if (!subject || !studentId) return;

    // Validate all required questions
    const requiredRatingQuestions = questions.filter(q => q.required && q.type === 'rating');
    const missingAnswers = requiredRatingQuestions.filter(q => !answers[q.id] || Number(answers[q.id]) === 0);
    
    if (missingAnswers.length > 0) {
      setError(`Please answer all required questions. Missing: ${missingAnswers.length} questions.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Prepare answers in the format expected by backend
      const formattedAnswers = questions.map(q => ({
        question: q.text,
        answer: q.type === 'rating' ? Number(answers[q.id]) : 0,
        type: q.type,
        comment: q.type === 'comment' ? String(answers[q.id] || '') : undefined
      }));

      const response = await api.post('/api/feedback', {
        student: studentId,
        subject: subject._id,
        feedbackType: feedbackType,
        term: subject.term,
        academicYear: '2024-25',
        answers: formattedAnswers,
        comments: comments
      });

      // Show success message
      alert(`${feedbackType === 'midterm' ? 'Mid-term' : 'End-term'} feedback submitted successfully!`);
      
      // Redirect to student dashboard
      router.push('/subjects');
      
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      
      if (err.response?.status === 409) {
        setError(`You have already submitted ${feedbackType} feedback for this subject.`);
      } else {
        setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

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

  if (error && !subject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentNavbar />
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">No Subject Selected</h2>
            <p className="text-red-700 mb-4">You need to select a subject before submitting feedback.</p>
            <button
              onClick={() => router.push('/subjects')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Go to Subjects Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const questionsByCategory = getQuestionsByCategory(questions);
  const categories = Object.keys(questionsByCategory);
  const currentCategoryQuestions = questionsByCategory[categories[currentSection]] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <StudentNavbar />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto py-6 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {feedbackType === 'midterm' ? '📋 Mid-Term Feedback' : '📊 End-Term Feedback'}
              </h1>
              <p className="text-gray-600 mt-1">
                {feedbackType === 'midterm' 
                  ? 'Focus on teaching methods and instructor performance'
                  : 'Focus on course content and overall learning experience'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Progress</div>
              <div className="text-lg font-semibold text-indigo-600">{calculateProgress()}%</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Info Card */}
      {subject && (
        <div className="max-w-6xl mx-auto py-6 px-4">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{subject.name}</h2>
                <p className="text-gray-600">Code: {subject.code} | Instructor: {subject.instructor}</p>
                <p className="text-sm text-gray-500">Year {subject.year} | Term {subject.term}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  feedbackType === 'midterm' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {feedbackType === 'midterm' ? 'Mid-Term' : 'End-Term'} Feedback
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto pb-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Sections</h3>
              <div className="space-y-2">
                {categories.map((category, index) => (
                  <button
                    key={category}
                    onClick={() => setCurrentSection(index)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      currentSection === index
                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{category}</span>
                      {validateSection(currentCategoryQuestions) && currentSection !== index && (
                        <span className="text-green-500">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {categories[currentSection]}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentCategoryQuestions.filter(q => q.type === 'rating').length} rating questions
                  {currentCategoryQuestions.filter(q => q.type === 'comment').length > 0 && 
                    ` and ${currentCategoryQuestions.filter(q => q.type === 'comment').length} comment questions`
                  }
                </p>
              </div>

              <div className="space-y-6">
                {currentCategoryQuestions.map((question, qIndex) => (
                  <div key={question.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-700">
                          {qIndex + 1}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-base font-medium text-gray-900 mb-3">
                          {question.text}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </h4>

                        {question.type === 'rating' ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                              <span>Poor</span>
                              <span>Excellent</span>
                            </div>
                            <div className="flex items-center gap-4">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <label key={rating} className="flex flex-col items-center cursor-pointer group">
                                  <input
                                    type="radio"
                                    name={question.id}
                                    value={rating}
                                    checked={answers[question.id] === rating}
                                    onChange={() => handleRatingChange(question.id, rating)}
                                    className="sr-only"
                                  />
                                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                    answers[question.id] === rating
                                      ? 'border-indigo-500 bg-indigo-500 text-white'
                                      : 'border-gray-300 text-gray-500 group-hover:border-indigo-300'
                                  }`}>
                                    <span className="font-semibold">{rating}</span>
                                  </div>
                                  <span className="text-xs text-gray-500 mt-1 text-center">
                                    {ratingScale[rating as keyof typeof ratingScale]}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <textarea
                              value={answers[question.id] as string || ''}
                              onChange={(e) => handleCommentChange(question.id, e.target.value)}
                              placeholder="Please share your thoughts and suggestions..."
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Optional - Your feedback helps us improve
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                  disabled={currentSection === 0}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    currentSection === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>

                {currentSection === categories.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || calculateProgress() < 100}
                    className={`px-8 py-2 rounded-md font-medium transition-colors ${
                      submitting || calculateProgress() < 100
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentSection(Math.min(categories.length - 1, currentSection + 1))}
                    disabled={!validateSection(currentCategoryQuestions)}
                    className={`px-6 py-2 rounded-md font-medium transition-colors ${
                      !validateSection(currentCategoryQuestions)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    Next
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading feedback form...</p>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function AdvancedFeedbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdvancedFeedbackContent />
    </Suspense>
  );
}