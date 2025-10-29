'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log error to external service
    console.error('Global error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
    });

    // Report to analytics or error tracking service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: true
      });
    }
  }, [error]);

  const handleReportError = () => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: window.navigator.userAgent
    };

    // In a real app, send this to your error reporting service
    console.log('Error report:', errorReport);
    
    // For now, just copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => alert('Error details copied to clipboard'))
      .catch(() => alert('Error details logged to console'));
  };

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-purple-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
          {/* Critical Error Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-10 opacity-20">
              <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
              <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
              <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
            </div>
          </div>

          {/* Main Error Container */}
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            {/* Critical Error Icon */}
            <div className="mb-8 relative">
              <div className="w-32 h-32 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-pink-500 animate-spin-slow opacity-30"></div>
                <div className="absolute inset-2 rounded-full bg-red-900 flex items-center justify-center border-2 border-red-400">
                  <svg 
                    className="w-16 h-16 text-red-300 animate-pulse" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Error Content */}
            <div className="mb-12">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Critical Error
              </h1>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Application Crashed
              </h2>
              <p className="text-gray-300 text-lg mb-6 max-w-lg mx-auto leading-relaxed">
                We encountered a critical error that caused the application to crash. 
                Our team has been automatically notified and is working to resolve this issue.
              </p>
              
              {/* Error Details for Development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-4 bg-red-900/30 rounded-xl border border-red-700 text-left max-w-lg mx-auto">
                  <h3 className="text-red-300 font-semibold mb-2 text-sm">Development Error Details:</h3>
                  <div className="text-red-200 text-xs font-mono break-all max-h-32 overflow-y-auto">
                    <div className="mb-2">
                      <strong>Message:</strong> {error.message}
                    </div>
                    {error.digest && (
                      <div className="mb-2">
                        <strong>Digest:</strong> {error.digest}
                      </div>
                    )}
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 text-xs">{error.stack}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={reset}
                  className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl min-w-[180px]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Try Again</span>
                  </span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                </button>
                
                <button
                  onClick={() => router.push('/')}
                  className="group px-8 py-4 bg-slate-800/50 text-white font-semibold rounded-xl border border-slate-600 hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-300 transform hover:scale-105 min-w-[180px]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Safe Mode Home</span>
                  </span>
                </button>
              </div>
              
              {/* Additional Options */}
              <div className="mt-8 pt-6 border-t border-red-700/50">
                <p className="text-gray-400 text-sm mb-4">Need help recovering?</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
                  <button 
                    onClick={handleReportError}
                    className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Report Error
                  </button>
                  <span className="hidden sm:block text-gray-600">•</span>
                  <button className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Emergency Support
                  </button>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="mt-12 p-6 bg-red-900/20 backdrop-blur-sm rounded-2xl border border-red-700/50">
              <div className="flex items-center justify-center gap-3 text-red-300 mb-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">System Status: Critical Error</span>
              </div>
              <p className="text-gray-400 text-xs">
                A critical error has occurred. Please try refreshing or contact support if the issue persists.
              </p>
            </div>
          </div>

          {/* Warning Particles */}
          <div className="absolute top-10 left-10 w-3 h-3 bg-red-400 rounded-full animate-ping opacity-60"></div>
          <div className="absolute top-20 right-20 w-2 h-2 bg-pink-400 rounded-full animate-ping opacity-40 animation-delay-1000"></div>
          <div className="absolute bottom-20 left-20 w-2.5 h-2.5 bg-purple-400 rounded-full animate-ping opacity-50 animation-delay-2000"></div>
          <div className="absolute bottom-10 right-10 w-2 h-2 bg-red-300 rounded-full animate-ping opacity-30 animation-delay-3000"></div>
        </div>
      </body>
    </html>
  );
}