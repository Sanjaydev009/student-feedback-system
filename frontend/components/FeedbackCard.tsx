import { useMemo, useState } from 'react';
import FeedbackDetailModal from './FeedbackDetailModal';

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
  showViewDetails?: boolean;
}

export default function FeedbackCard({ feedback, showViewDetails = false }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate average if not already provided (only for rating questions)
  const averageRating = useMemo(() => {
    if (feedback.averageRating) return feedback.averageRating;
    if (!feedback.answers || feedback.answers.length === 0) return 0;
    
    // Only calculate average for rating questions (exclude comment questions)
    const ratingAnswers = feedback.answers.filter(ans => ans.type !== 'comment' && ans.answer > 0);
    if (ratingAnswers.length === 0) return 0;
    
    const sum = ratingAnswers.reduce((total, ans) => total + ans.answer, 0);
    return Number((sum / ratingAnswers.length).toFixed(1));
  }, [feedback]);

  // Separate rating and comment answers
  const ratingAnswers = feedback.answers.filter(ans => ans.type !== 'comment');
  const commentAnswers = feedback.answers.filter(ans => ans.type === 'comment');

  // Render stars based on rating
  const renderStars = (rating: number, size = 'text-lg') => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`${size} ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
    ));
  };

  const getFeedbackTypeBadge = () => {
    if (!feedback.feedbackType) return null;
    
    const isEndterm = feedback.feedbackType === 'endterm';
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
        isEndterm 
          ? 'bg-white/20 text-white border border-white/30' 
          : 'bg-white/20 text-white border border-white/30'
      }`}>
        {isEndterm ? 'End-Term' : 'Mid-Term'}
      </div>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get the submission date from either submittedAt or createdAt
  const getSubmissionDate = () => {
    return feedback.submittedAt || (feedback as any).createdAt || 'Date not available';
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 overflow-hidden group">
        {/* Academic Year & Term Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2 text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
              Year {feedback.term || 1} • {feedback.academicYear || '2024-25'}
            </div>
            {getFeedbackTypeBadge()}
          </div>
        </div>

        {/* Compact Content */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                {feedback.subject ? feedback.subject.name : 'Subject Not Available'}
              </h3>
              <p className="text-sm text-gray-600 truncate">
                {feedback.subject ? feedback.subject.code : 'N/A'} • {feedback.subject ? feedback.subject.instructor : 'N/A'}
              </p>
            </div>
            
            <div className="flex items-center gap-2 ml-3">
              {/* Compact Average Rating */}
              <div className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md text-sm font-medium border border-yellow-200">
                ⭐ {averageRating}/5
              </div>
              
              {/* View Details Button */}
              {showViewDetails && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors group/btn"
                  title="View detailed feedback"
                >
                  <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Compact Submission Info */}
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDate(getSubmissionDate())}
          </div>
        </div>
        
        {/* Compact Stats */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {ratingAnswers.length} ratings
                </span>
                {commentAnswers.length > 0 && (
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {commentAnswers.length} comments
                  </span>
                )}
              </div>
              {/* {showViewDetails && (
                <span className="text-indigo-600 text-xs font-medium">Click eye to view details</span>
              )} */}
            </div>
          </div>
      </div>

      {/* Detail Modal */}
      {isModalOpen && (
        <FeedbackDetailModal
          feedback={feedback}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}