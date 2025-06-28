import { useMemo } from 'react';

interface Props {
  feedback: {
    _id: string;
    subject: {
      name: string;
      code: string;
      instructor: string;
    };
    answers: Array<{
      question: string;
      answer: number;
    }>;
    averageRating?: number;
  };
}

export default function FeedbackCard({ feedback }: Props) {
  // Calculate average if not already provided
  const averageRating = useMemo(() => {
    if (feedback.averageRating) return feedback.averageRating;
    if (!feedback.answers || feedback.answers.length === 0) return 0;
    
    const sum = feedback.answers.reduce((total, ans) => total + ans.answer, 0);
    return Number((sum / feedback.answers.length).toFixed(1));
  }, [feedback]);

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
            <h2 className="text-lg font-semibold text-gray-800">{feedback.subject.name}</h2>
            <p className="text-sm text-gray-600 mt-1">Code: {feedback.subject.code}</p>
          </div>
          <div className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
            {averageRating}/5
          </div>
        </div>
        <div className="mt-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          <p className="text-gray-600 text-sm">Instructor: <span className="font-medium">{feedback.subject.instructor}</span></p>
        </div>
      </div>
      
      <div className="px-5 py-4">
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {feedback.answers.map((ans, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-800 mb-1.5 font-medium">{ans.question}</p>
              <div className="flex items-center">
                {renderStars(ans.answer)}
                <span className="ml-2 text-sm text-gray-600">({ans.answer}/5)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}