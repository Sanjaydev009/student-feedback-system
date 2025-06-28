'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dean Reports Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6 py-12 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h1>
          
          <div className="mb-8 text-gray-600">
            <p>An unexpected error occurred while loading reports.</p>
            <p className="mt-2 text-sm text-gray-500">
              {error?.message || 'Please try again or contact support if the issue persists.'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/dean-dashboard"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
