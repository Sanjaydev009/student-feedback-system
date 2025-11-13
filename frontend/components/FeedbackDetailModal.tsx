'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface Props {
  feedback: {
    _id: string;
    subject: {
      name: string;
      code: string;
      instructor: string;
    } | null;
    answers: Array<{
      question: string;
      answer: number;
      type?: 'rating' | 'comment';
      comment?: string;
      category?: string;
    }>;
    averageRating?: number;
    feedbackType?: 'midterm' | 'endterm';
    submittedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    term?: number;
    academicYear?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackDetailModal({ feedback, isOpen, onClose }: Props) {
  // Separate rating and comment answers
  const ratingAnswers = feedback.answers.filter(ans => ans.type !== 'comment');
  const commentAnswers = feedback.answers.filter(ans => ans.type === 'comment');

  // Calculate average rating
  const averageRating = (() => {
    if (feedback.averageRating) return feedback.averageRating;
    if (!feedback.answers || feedback.answers.length === 0) return 0;
    
    const ratingAnswers = feedback.answers.filter(ans => ans.type !== 'comment' && ans.answer > 0);
    if (ratingAnswers.length === 0) return 0;
    
    const sum = ratingAnswers.reduce((total, ans) => total + ans.answer, 0);
    return Number((sum / ratingAnswers.length).toFixed(1));
  })();

  // Render stars based on rating
  const renderStars = (rating: number, size = 'text-lg') => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`${size} ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
    ));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get the submission date from either submittedAt or createdAt
  const getSubmissionDate = () => {
    return feedback.submittedAt || (feedback as any).createdAt || 'Date not available';
  };

  const getFeedbackTypeInfo = () => {
    if (!feedback.feedbackType) return { label: 'Academic Feedback', icon: '📋', color: 'gray' };
    
    return feedback.feedbackType === 'endterm' 
      ? { label: 'End-Term Feedback', icon: '📝', color: 'purple' }
      : { label: 'Mid-Term Feedback', icon: '📊', color: 'blue' };
  };

  const typeInfo = getFeedbackTypeInfo();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Dialog.Title className="text-xl font-semibold text-gray-900">
                          {feedback.subject ? feedback.subject.name : 'Subject Not Available'}
                        </Dialog.Title>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          typeInfo.color === 'purple' 
                            ? 'bg-purple-100 text-purple-800' 
                            : typeInfo.color === 'blue'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {typeInfo.icon} {typeInfo.label}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Subject Code:</span>
                          <span className="ml-2 text-gray-600">{feedback.subject ? feedback.subject.code : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Instructor:</span>
                          <span className="ml-2 text-gray-600">{feedback.subject ? feedback.subject.instructor : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Average Rating:</span>
                          <span className="ml-2 text-gray-600 flex items-center">
                            {renderStars(Math.round(averageRating), 'text-sm')}
                            <span className="ml-2">({averageRating}/5)</span>
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Submitted:</span>
                          <span className="ml-2 text-gray-600">{formatDate(getSubmissionDate())}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={onClose}
                      className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-8">
                    {/* Rating Questions */}
                    {ratingAnswers.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Rating Questions ({ratingAnswers.length})
                          </h3>
                        </div>
                        
                        <div className="grid gap-4">
                          {ratingAnswers.map((ans, i) => (
                            <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:bg-gray-100 transition-colors">
                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                <div className="flex-1">
                                  <p className="text-gray-900 font-medium leading-relaxed">
                                    {ans.question}
                                  </p>
                                  {ans.category && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-white text-gray-600 text-xs rounded-full border">
                                      {ans.category}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                                  <div className="flex items-center">
                                    {renderStars(ans.answer)}
                                  </div>
                                  <div className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-700 border">
                                    {ans.answer}/5
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comment Questions */}
                    {commentAnswers.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Written Responses ({commentAnswers.length})
                          </h3>
                        </div>
                        
                        <div className="grid gap-4">
                          {commentAnswers.map((ans, i) => (
                            <div key={i} className="bg-blue-50 rounded-xl p-5 border border-blue-200 hover:bg-blue-100/50 transition-colors">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-gray-900 font-medium leading-relaxed">
                                    {ans.question}
                                  </p>
                                  {ans.category && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-white text-blue-600 text-xs rounded-full border border-blue-200">
                                      {ans.category}
                                    </span>
                                  )}
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-blue-200">
                                  <div className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M7.455 2.004a1 1 0 01.638-.987l1.36-.454a1 1 0 011.255.636l.097.29a2 2 0 001.37 1.37l.29.097a1 1 0 01.636 1.255l-.454 1.36a1 1 0 01-.987.638l-.29.097a2 2 0 00-1.37 1.37l-.097.29a1 1 0 01-1.255.636l-1.36-.454a1 1 0 01-.638-.987l-.097-.29a2 2 0 00-1.37-1.37l-.29-.097a1 1 0 01-.636-1.255l.454-1.36zM7 17a1 1 0 100-2 1 1 0 000 2zm6-2a1 1 0 11-2 0 1 1 0 012 0zm2-6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-gray-700 leading-relaxed italic">
                                      "{ans.comment || 'No comment provided'}"
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legacy Data Fallback */}
                    {ratingAnswers.length === 0 && commentAnswers.length === 0 && feedback.answers.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Legacy Feedback ({feedback.answers.length} responses)
                          </h3>
                        </div>
                        
                        <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                          <p className="text-amber-800 mb-4">
                            This feedback was submitted using an older format. The responses are shown below:
                          </p>
                          <div className="grid gap-3">
                            {feedback.answers.map((ans, i) => (
                              <div key={i} className="bg-white rounded-lg p-4 border border-amber-200">
                                <p className="text-gray-900 font-medium mb-2">{ans.question}</p>
                                <div className="flex items-center">
                                  {renderStars(ans.answer)}
                                  <span className="ml-2 text-gray-600">({ans.answer}/5)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {feedback.answers.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No Responses Available</h3>
                        <p className="text-gray-600">This feedback submission doesn't contain any responses.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Total Responses:</span> {feedback.answers.length}
                      {averageRating > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="font-medium">Overall Rating:</span> {averageRating}/5.0
                        </>
                      )}
                    </div>
                    <button
                      onClick={onClose}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}