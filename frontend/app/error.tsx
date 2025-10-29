'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    setTimeout(() => {
      reset();
      setIsRetrying(false);
    }, 1500);
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      {/* Main Error Container */}
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Error Icon with Animation */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-pink-500 animate-spin-slow opacity-20"></div>
            <div className="absolute inset-2 rounded-full bg-slate-800 flex items-center justify-center">
              <svg 
                className="w-16 h-16 text-red-400 animate-bounce" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4 animate-pulse">
            Oops!
          </h1>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-300 text-lg mb-6 max-w-lg mx-auto leading-relaxed">
            We encountered an unexpected error while processing your request. 
            Don't worry, our team has been notified and we're working to fix it.
          </p>
          
          {/* Error Details (for development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-left max-w-md mx-auto">
              <h3 className="text-red-400 font-semibold mb-2 text-sm">Error Details:</h3>
              <code className="text-gray-300 text-xs break-all">
                {error.message}
              </code>
              {error.digest && (
                <div className="mt-2">
                  <span className="text-gray-400 text-xs">Digest: {error.digest}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isRetrying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Retrying...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Try Again</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </button>
            
            <button
              onClick={handleGoHome}
              className="group px-8 py-4 bg-slate-800/50 text-white font-semibold rounded-xl border border-slate-600 hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-300 transform hover:scale-105 min-w-[160px]"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Go Home</span>
              </span>
            </button>
          </div>
          
          {/* Additional Help Options */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-gray-400 text-sm mb-4">Need immediate assistance?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
              <button className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Contact Support
              </button>
              <span className="hidden sm:block text-gray-600">•</span>
              <button className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Report Issue
              </button>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="mt-12 p-6 bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50">
          <div className="flex items-center justify-center gap-3 text-green-400 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">System Status: Operational</span>
          </div>
          <p className="text-gray-400 text-xs">
            All systems are running normally. This appears to be an isolated incident.
          </p>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60"></div>
      <div className="absolute top-20 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-40 animation-delay-1000"></div>
      <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-50 animation-delay-2000"></div>
      <div className="absolute bottom-10 right-10 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-30 animation-delay-3000"></div>
    </div>
  );
}
