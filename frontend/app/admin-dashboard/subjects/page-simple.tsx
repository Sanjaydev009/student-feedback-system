'use client';

import { useEffect, useState } from 'react';
import AdminNavbar from '@/components/AdminNavbar';

export default function AdminSubjectsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Subject Management</h1>
        <p>Test page content</p>
      </div>
    </div>
  );
}