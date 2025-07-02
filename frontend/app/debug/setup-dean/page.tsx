'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/api-debug';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

export default function SetupDeanUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const { showToast } = useToast();
  
  const setupDeanUser = async () => {
    try {
      setIsLoading(true);
      setStatus('creating');
      
      // Create the dean user
      const createResponse = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Dean User',
          email: 'dean@test.com',
          password: 'dean123',
          role: 'dean'
        })
      });
      
      if (!createResponse.ok && createResponse.status !== 400) {
        const error = await createResponse.json();
        throw new Error(error.message || 'Failed to create dean user');
      }
      
      // If 400 error, user likely exists, try to login
      const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'dean@test.com',
          password: 'dean123'
        })
      });
      
      if (!loginResponse.ok) {
        const error = await loginResponse.json();
        throw new Error(error.message || 'Failed to login');
      }
      
      const data = await loginResponse.json();
      
      if (data && data.token) {
        // Store the token and user info in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.id || data._id,
          name: data.name || 'Dean User',
          role: 'dean'
        }));
        setToken(data.token);
        setStatus('success');
        showToast('Dean account created and logged in successfully!', 'success');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error in setup dean:', error);
      setStatus('error');
      setErrorMessage(error.message || 'An unknown error occurred');
      showToast(`Setup failed: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dean Dashboard Setup</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Setup Dean User</h2>
        <p className="mb-4 text-gray-600">
          This utility will create a test dean account (or log in if it already exists) and store the authentication token in your browser.
        </p>
        
        <button
          onClick={setupDeanUser}
          disabled={isLoading || status === 'success'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Setting up...' : status === 'success' ? 'Setup Complete' : 'Setup Dean Account'}
        </button>
        
        {status === 'error' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">Error: {errorMessage}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600 mb-2">✓ Setup completed successfully!</p>
            <p className="text-sm text-gray-700 mb-1">Login credentials:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 ml-2 mb-3">
              <li>Email: dean@test.com</li>
              <li>Password: dean123</li>
            </ul>
            <p className="text-sm text-gray-700">
              Token has been stored in your browser. You can now access the dean dashboard.
            </p>
          </div>
        )}
      </div>
      
      {status === 'success' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/login" className="text-center p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg">
              Go to Login
            </Link>
            <Link href="/dean-dashboard" className="text-center p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg">
              Go to Dashboard
            </Link>
            <Link href="/debug/token" className="text-center p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg">
              Check Token
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
