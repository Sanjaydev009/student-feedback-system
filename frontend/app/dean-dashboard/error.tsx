'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6 py-12 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          
          <div className="mb-8 text-gray-600">
            <p>An error occurred in the dean dashboard.</p>
            <p className="mt-2 text-sm text-gray-500">
              {error?.message || 'Please try again.'}
            </p>
          </div>
          
          <div className="flex flex-col space-y-4">
            <button
              onClick={reset}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Try Again
            </button>
            
            <a
              href="/dean-dashboard"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
