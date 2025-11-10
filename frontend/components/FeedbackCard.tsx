import { useMemo } from 'react';

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
  };
}

export default function FeedbackCard({ feedback }: Props) {
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
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden border border-gray-100 hover:shadow-card-hover transition-medium">
      <div className="p-5 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {feedback.subject ? feedback.subject.name : 'Subject Not Available'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Code: {feedback.subject ? feedback.subject.code : 'N/A'}
            </p>
          </div>
          <div className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
            {averageRating}/5
          </div>
        </div>
        <div className="mt-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          <p className="text-gray-600 text-sm">
            Instructor: <span className="font-medium">
              {feedback.subject ? feedback.subject.instructor : 'N/A'}
            </span>
          </p>
        </div>
      </div>
      
      <div className="px-5 py-4">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Rating Questions */}
          {ratingAnswers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Rating Questions
              </h4>
              <div className="space-y-3">
                {ratingAnswers.map((ans, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-800 mb-2 font-medium">{ans.question}</p>
                    <div className="flex items-center">
                      {renderStars(ans.answer)}
                      <span className="ml-2 text-sm text-gray-600">({ans.answer}/5)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comment Questions */}
          {commentAnswers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Comments & Feedback
              </h4>
              <div className="space-y-3">
                {commentAnswers.map((ans, i) => (
                  <div key={i} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <p className="text-sm text-gray-800 mb-2 font-medium">{ans.question}</p>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm text-gray-700 italic">
                        "{ans.comment || 'No comment provided'}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback for legacy data without type field */}
          {ratingAnswers.length === 0 && commentAnswers.length === 0 && feedback.answers.length > 0 && (
            <div className="space-y-3">
              {feedback.answers.map((ans, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-800 mb-2 font-medium">{ans.question}</p>
                  <div className="flex items-center">
                    {renderStars(ans.answer)}
                    <span className="ml-2 text-sm text-gray-600">({ans.answer}/5)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}