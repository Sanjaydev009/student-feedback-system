'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import api, { checkServerHealth } from '@/utils/api';
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const router = useRouter();
  const { showToast } = useToast();
  
  // Check for password updated query parameter and server status
  useEffect(() => {
    // Check URL for password update success message
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('passwordUpdated') === 'true') {
      setShowSuccessMessage(true);
      // Clear the query parameter
      window.history.replaceState({}, document.title, '/login');
    }
    // Prefill email/password if present in query params (for quick-login links)
    const prefillEmail = urlParams.get('email');
    const prefillPassword = urlParams.get('password');
    if (prefillEmail) setEmail(prefillEmail);
    if (prefillPassword) setPassword(prefillPassword);
    
    // Check if the server is reachable using our utility
    const checkServerStatus = async () => {
      try {
        const isHealthy = await checkServerHealth();
        
        if (isHealthy) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (error) {
        console.error('Server connection error:', error);
        setServerStatus('offline');
      }
    };
    
    checkServerStatus();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    // If server is already known to be offline, warn user
    if (serverStatus === 'offline') {
      showToast('Server appears to be offline. Please check your connection.', 'error');
      return;
    }

    try {
      // First check server status if we're not sure
      if (serverStatus !== 'online') {
        try {
          await fetch('http://localhost:5001/api/health', { 
            signal: AbortSignal.timeout(2000) 
          });
        } catch (err) {
          setServerStatus('offline');
          throw new Error('Backend server appears to be offline. Please check if the server is running.');
        }
      }
      
      // Use axios through our API utility for better error handling
      const response = await api.post('/api/auth/login', {
        email,
        password
      });
      
      const data = response.data;
      localStorage.setItem('token', data.token);

      // Decode token safely
      const base64Url = data.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);

      // Only redirect to password update if passwordResetRequired is true
      // Admin users will always have passwordResetRequired set to false
      if (decoded.passwordResetRequired) {
        router.push('/update-password');
      } else if (decoded.role === 'admin') {
        router.push('/admin-dashboard');
      } else if (decoded.role === 'student') {
        router.push('/subjects');
      } else if (decoded.role === 'hod') {
        router.push('/hod-dashboard');
      } else if (decoded.role === 'dean') {
        router.push('/dean-dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      // Safely log the error with proper error checking
      try {
        console.error('Login error:', err);
      } catch {
        console.error('Error logging login error');
      }
      
      // Provide more specific error messages with safe property access
      try {
        const error = err as any;
        if (error?.code === 'ECONNABORTED') {
          showToast('Login failed: The request took too long to complete. Please try again.', 'error');
        } else if (!error?.response) {
          // No response from server = network/connection issue
          showToast('Login failed: Unable to connect to the server. Please check if the backend server is running.', 'error');
          // Update UI state to reflect offline server
          setServerStatus('offline');
        } else if (error?.response?.status === 401) {
          showToast('Login failed: Invalid credentials', 'error');
        } else if (error?.response?.data?.message) {
          showToast(`Login failed: ${error.response.data.message}`, 'error');
        } else {
          showToast('Login failed: An unexpected error occurred. Please try again.', 'error');
        }
      } catch {
        // Last resort error message if error handling itself fails
        showToast('Login failed: Please check your connection and try again.', 'error');
        console.error('Error in error handling');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-card w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 text-blue-600" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.168 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
          
          {/* Server status indicator */}
          <div className="mt-3 flex justify-center">
            {serverStatus === 'checking' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking server...
              </span>
            ) : serverStatus === 'online' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="flex-shrink-0 h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
                online
              </span>
            ) : (
              <div className="flex flex-col items-center space-y-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <span className="flex-shrink-0 h-2 w-2 bg-red-500 rounded-full mr-1.5"></span>
                  Server offline - Check backend connection
                </span>
                <button 
                  onClick={async () => {
                    setServerStatus('checking');
                    try {
                      const isHealthy = await checkServerHealth();
                      
                      if (isHealthy) {
                        setServerStatus('online');
                      } else {
                        setServerStatus('offline');
                      }
                    } catch (error) {
                      console.error('Server connection error:', error);
                      setServerStatus('offline');
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>
          
          {showSuccessMessage && (
            <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-left text-green-700">
                    Password updated successfully! Please login with your new password.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-medium"
              required
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              {/**<a href="#" className="text-sm text-blue-600 hover:text-blue-800">Forgot password?</a>*/}
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleLogin}
            disabled={serverStatus === 'offline'}
            className={`w-full py-3 px-4 rounded-md font-medium transition-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              serverStatus === 'offline' 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {serverStatus === 'checking' ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking server...
              </span>
            ) : serverStatus === 'offline' ? (
              <span>Server Offline - Check Connection</span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}