'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, decodeToken, getToken } from '@/utils/auth';

export default function HODProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    const token = getToken();
    const decoded = decodeToken(token!);
    if (decoded.role !== 'hod') {
      router.push('/login');
      return;
    }
    
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">HOD Profile</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Settings</h2>
          <p className="text-gray-600">Profile management coming soon...</p>
        </div>
      </div>
    </div>
  );
}
