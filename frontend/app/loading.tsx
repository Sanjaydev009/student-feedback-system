'use client';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-float animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-float animation-delay-4000"></div>
        </div>
      </div>

      {/* Main Loading Container */}
      <div className="relative z-10 text-center">
        {/* Loading Animation */}
        <div className="mb-8">
          <div className="relative w-32 h-32 mx-auto">
            {/* Outer Ring */}
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-spin"></div>
            {/* Middle Ring */}
            <div className="absolute inset-2 border-4 border-purple-300 border-t-transparent rounded-full animate-spin animation-delay-1000" style={{animationDirection: 'reverse'}}></div>
            {/* Inner Ring */}
            <div className="absolute inset-6 border-4 border-indigo-400 border-t-transparent border-r-transparent rounded-full animate-spin"></div>
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">
            Loading...
          </h2>
          <p className="text-blue-200 text-lg">
            Please wait while we prepare your content
          </p>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce animation-delay-1000"></div>
          <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce animation-delay-2000"></div>
        </div>

        {/* Loading Steps */}
        <div className="max-w-md mx-auto">
          <div className="space-y-3 text-sm text-blue-200">
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Initializing connection</span>
            </div>
            <div className="flex items-center gap-3 animate-pulse animation-delay-1000">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
              <span>Loading resources</span>
            </div>
            <div className="flex items-center gap-3 animate-pulse animation-delay-2000">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Preparing interface</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60"></div>
      <div className="absolute top-32 right-24 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-40 animation-delay-1000"></div>
      <div className="absolute bottom-32 left-16 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping opacity-50 animation-delay-2000"></div>
      <div className="absolute bottom-20 right-20 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-30 animation-delay-3000"></div>
    </div>
  );
}