'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Separate effect for navigation to avoid setState during render
  useEffect(() => {
    if (countdown === 0) {
      const timeoutId = setTimeout(() => {
        router.push('/');
      }, 100); // Small delay to ensure state update is complete
      
      return () => clearTimeout(timeoutId);
    }
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-float animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-float animation-delay-4000"></div>
        </div>
      </div>

      {/* Main 404 Container */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* 404 Animation */}
        <div className="mb-8 relative">
          <div className="relative">
            <h1 className="text-[12rem] md:text-[16rem] font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-none animate-pulse">
              404
            </h1>
            <div className="absolute inset-0 text-[12rem] md:text-[16rem] font-black text-slate-800/20 leading-none animate-glow">
              404
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Page Not Found
          </h2>
          <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            Oops! The page you're looking for seems to have wandered off into the digital void. 
            Don't worry, even the best explorers sometimes take a wrong turn.
          </p>
          
          {/* Auto-redirect notice */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-600 text-blue-300 mb-8">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Redirecting to home in {countdown} seconds
            </span>
          </div>
        </div>
        
        {/* Navigation Options */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/"
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl min-w-[180px] inline-block text-center"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Go Home</span>
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </Link>
            
            <button
              onClick={() => router.back()}
              className="group px-8 py-4 bg-slate-800/50 text-white font-semibold rounded-xl border border-slate-600 hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-300 transform hover:scale-105 min-w-[180px]"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Go Back</span>
              </span>
            </button>
          </div>
          
          {/* Quick Navigation */}
          <div className="mt-12 pt-8 border-t border-slate-700/50">
            <p className="text-gray-400 text-sm mb-6">Popular destinations:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <Link
                href="/login"
                className="p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all duration-300 group block"
              >
                <div className="text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">Login</span>
              </Link>
              
              <Link
                href="/register"
                className="p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all duration-300 group block"
              >
                <div className="text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">Register</span>
              </Link>
              
              <Link
                href="/subjects"
                className="p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all duration-300 group block"
              >
                <div className="text-green-400 mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">Subjects</span>
              </Link>
              
              <Link
                href="/submit-feedback"
                className="p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all duration-300 group block"
              >
                <div className="text-yellow-400 mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">Feedback</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Fun fact */}
        <div className="mt-16 p-6 bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold">Did you know?</h3>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            The 404 error code was named after room 404 at CERN, where the first web server was located. 
            When files couldn't be found, users were told the file was "not found in room 404."
          </p>
        </div>
      </div>

      {/* Floating Particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-40 animation-delay-1000"></div>
      <div className="absolute bottom-1/3 left-1/5 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-50 animation-delay-2000"></div>
      <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-30 animation-delay-3000"></div>
      <div className="absolute top-1/5 left-1/2 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping opacity-40 animation-delay-1000"></div>
      <div className="absolute bottom-1/5 right-1/5 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-50 animation-delay-4000"></div>
    </div>
  );
}
