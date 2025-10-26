'use client';

// Email configuration page for admin
import { useState, useEffect } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import EmailTestPanel from '@/components/EmailTestPanel';

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const decoded: any = JSON.parse(atob(token.split('.')[1]));
      if (decoded.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setLoading(false);
    } catch (err) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p>Loading...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />
      
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Email Configuration</h1>
          <p className="text-gray-600 mt-2">
            Configure and test email settings for automatic user credential delivery
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <EmailTestPanel />
          
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🔧 Email Features</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Single User Registration</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Auto-generated secure passwords</li>
                  <li>• Immediate email delivery</li>
                  <li>• Professional welcome templates</li>
                  <li>• Security guidelines included</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Bulk User Upload</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Batch email processing</li>
                  <li>• Admin summary reports</li>
                  <li>• Error handling & retry logic</li>
                  <li>• Progress tracking</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 rounded">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Users are created successfully even if email delivery fails</li>
                <li>• Generated passwords are shown in admin panel for manual distribution</li>
                <li>• Check spam folders if emails aren't received</li>
                <li>• Gmail requires App Passwords (not regular passwords)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
