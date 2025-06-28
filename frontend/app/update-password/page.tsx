'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Extract user role from token on component mount
  useEffect(() => {
    if (storedToken) {
      try {
        const base64Url = storedToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        setUserRole(decoded.role);
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }
  }, [storedToken]);

  const handleSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }
    
    if (newPassword !== confirm) {
      alert("Passwords don't match");
      return;
    }

    try {
      // Use the api utility for consistent error handling
      const response = await api.put('/api/auth/me', { password: newPassword });
      
      // Show success message
      alert('✅ Password updated successfully!');
      
      // Logout by removing token
      localStorage.removeItem('token');
      
      // Redirect to login with success message
      router.push('/login?passwordUpdated=true');
    } catch (err: any) {
      console.error('Failed to update password:', err);
      
      // Show appropriate error message
      if (err.response?.data?.message) {
        alert(`Error: ${err.response.data.message}`);
      } else if (err.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        router.push('/login');
      } else {
        alert('Failed to update password. Please try again later.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-card w-full max-w-md border border-gray-100">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 text-blue-600" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Update Your Password</h1>
          <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-left text-yellow-700">
                  {userRole === 'admin' ? 
                    "You've chosen to update your password. You can create a new secure password below." :
                    "You are using the default password. For security reasons, you must update it before continuing."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-5">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              id="new-password"
              type="password"
              placeholder="Enter a strong password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-medium"
            />
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-medium"
            />
          </div>
          
          <div className="pt-3">
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Update Password
            </button>
          </div>
          
          <div className="text-center text-sm text-gray-500 mt-4">
            <p>Password requirements:</p>
            <ul className="list-disc text-left ml-5 mt-1">
              <li>At least 8 characters long</li>
              <li>Include at least one uppercase letter</li>
              <li>Include at least one number</li>
              <li>Include at least one special character</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}