'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

export default function DEANDashboardPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [userData, setUserData] = useState<{
    name?: string;
    role?: string;
    [key: string]: unknown;
  } | null>(null);

  useEffect(() => {
    // Check authentication status
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      // Simple auth check
      if (!token) {
        setAuthStatus('unauthenticated');
        setIsLoading(false);
        return;
      }
      
      try {
        if (user) {
          const parsedUser = JSON.parse(user);
          setUserData(parsedUser);
        }
        setAuthStatus('authenticated');
      } catch (error) {
        console.error('Error parsing user data:', error);
        setAuthStatus('unauthenticated');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full px-6 py-12 bg-white shadow-lg rounded-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Not Authenticated</h1>
            <p className="mb-6 text-gray-600">You need to log in with a dean account to access this page.</p>
            <Link
              href="/login"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Dean Dashboard</h1>
            <p className="text-gray-600">Welcome, {userData?.name || 'Dean'}</p>
            {userData && userData.role === 'dean' && (
              <p className="text-green-600 text-sm">✓ Authenticated as Dean</p>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Link
              href="/login"
              className="px-3 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm"
            >
              Log Out
            </Link>
            <Link
              href="/debug/token"
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              Debug Token
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Link
          href="/dean-dashboard/subjects"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-2">Subjects</h2>
          <p className="text-gray-600 mb-4">View and manage all subjects across departments</p>
          <div className="flex justify-end">
            <span className="text-blue-600">View Subjects →</span>
          </div>
        </Link>

        <Link
          href="/dean-dashboard/reports"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-2">Reports</h2>
          <p className="text-gray-600 mb-4">Access comprehensive feedback reports and analytics</p>
          <div className="flex justify-end">
            <span className="text-green-600">View Reports →</span>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Troubleshooting</h2>
          <p className="text-gray-600 mb-4">Having issues with the dashboard?</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.clear();
                  showToast('Local storage cleared. Please log in again.', 'success');
                  window.location.href = '/login';
                }
              }}
              className="w-full px-4 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
            >
              Clear Local Storage & Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
