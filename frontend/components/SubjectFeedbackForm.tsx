'use client';

import { useState, useEffect } from 'react';

interface Props {
  subject: {
    _id: string;
    name: string;
    instructor: string;
    questions: string[];
  };
}

export default function SubjectFeedbackForm({ subject }: Props) {
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(false);
  const [formProgress, setFormProgress] = useState(0);

  // Calculate form completion progress
  useEffect(() => {
    const answeredQuestions = Object.keys(answers).filter(key => answers[parseInt(key)] > 0).length;
    const progress = subject.questions.length > 0 ? (answeredQuestions / subject.questions.length) * 100 : 0;
    setFormProgress(progress);
  }, [answers, subject.questions.length]);

  const handleRatingChange = (index: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = async () => {
    const hasUnanswered = subject.questions.some((_, index) => !answers[index] || answers[index] === 0);
    if (hasUnanswered) {
      alert('Please answer all questions before submitting');
      return;
    }

    setLoading(true);
    try {
      const body = {
        student: 'your_student_id_here', // replace with JWT token data
        subject: subject._id,
        answers: subject.questions.map((q, i) => ({
          question: q,
          answer: answers[i] || 0
        }))
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert('Feedback submitted successfully!');
      } else {
        alert('Failed to submit feedback');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting feedback');
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = subject.questions.every((_, index) => answers[index] && answers[index] > 0);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-800 rounded-t-2xl p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Feedback for {subject.name}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-indigo-100">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">{subject.instructor}</span>
              </div>
            </div>
          </div>
          
          {/* Progress Circle */}
          <div className="flex-shrink-0">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="white"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - formProgress / 100)}`}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{Math.round(formProgress)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{Object.keys(answers).filter(key => answers[parseInt(key)] > 0).length} of {subject.questions.length} completed</span>
          </div>
          <div className="w-full bg-indigo-700 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${formProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-b-2xl shadow-xl">
        <form onSubmit={(e) => e.preventDefault()} className="p-6 sm:p-8">
          {/* Instructions */}
          <div className="mb-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-indigo-800 mb-1">📋 Instructions:</p>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• Rate each aspect on a scale of 1-5 (1 = Poor, 5 = Excellent)</li>
                  <li>• Your feedback will remain completely anonymous</li>
                  <li>• All questions are required before submission</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {subject.questions.map((question, index) => (
              <div key={index} className="p-4 sm:p-6 bg-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200">
                <div className="mb-6">
                  <label className="block font-semibold text-gray-800 mb-4 text-base sm:text-lg leading-relaxed">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    {question}
                  </label>
                </div>

                {/* Mobile-First Rating System */}
                <div className="space-y-4">
                  {/* Mobile Rating Buttons */}
                  <div className="block sm:hidden">
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleRatingChange(index, rating)}
                          className={`relative flex flex-col items-center justify-center h-16 rounded-xl transition-all duration-300 transform active:scale-95 ${
                            answers[index] === rating 
                              ? 'bg-gradient-to-t from-indigo-600 to-indigo-500 text-white scale-105 shadow-lg' 
                              : 'bg-white hover:bg-indigo-50 border-2 border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          <span className="text-lg font-bold">{rating}</span>
                          <span className="text-xs mt-1">
                            {rating === 1 ? 'Poor' : rating === 5 ? 'Great' : ''}
                          </span>
                          {answers[index] === rating && (
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

                  {/* Desktop Rating System */}
                  <div className="hidden sm:block">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm text-red-500 font-medium mr-3">Poor</span>
                        <span className="text-xs text-gray-400">1</span>
                      </div>
                      <div className="flex space-x-3">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleRatingChange(index, rating)}
                            className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                              answers[index] === rating 
                                ? 'bg-gradient-to-t from-indigo-600 to-indigo-500 text-white scale-110 shadow-lg border-2 border-indigo-400' 
                                : answers[index] > rating
                                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  : 'bg-gray-100 hover:bg-gray-200 hover:scale-105 border border-gray-200'
                            }`}
                          >
                            <span className="text-xl font-bold">{rating}</span>
                            {answers[index] === rating && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <div className="text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      answers[index] 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {answers[index] 
                        ? `Selected: ${answers[index]}/5` 
                        : 'Not answered yet'
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Section */}
          <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">🚀 Ready to Submit?</h4>
              <p className="text-sm text-gray-600">
                Please review your responses before submitting. Your feedback is valuable and will remain anonymous.
              </p>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!isFormComplete || loading}
              className={`w-full py-4 px-6 text-white rounded-xl font-bold text-lg shadow-xl transition-all duration-300 transform focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 ${
                !isFormComplete || loading
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105 hover:shadow-2xl'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  <span>📤 Submitting Feedback...</span>
                </div>
              ) : !isFormComplete ? (
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Complete All Questions First</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>🎯 Submit Feedback</span>
                </div>
              )}
            </button>

            {/* Form Validation Message */}
            {!isFormComplete && Object.keys(answers).length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center text-amber-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm font-medium">
                    Please answer {subject.questions.length - Object.keys(answers).filter(key => answers[parseInt(key)] > 0).length} more question(s) to submit
                  </span>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}