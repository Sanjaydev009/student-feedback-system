'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import api, { checkServerHealth } from '@/utils/api';
import DeanAdvancedReport from '@/components/DeanAdvancedReport';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [allFeedbackData, setAllFeedbackData] = useState<Array<{
    _id: string;
    student: { _id: string; name: string; year: number };
    subject: { _id: string; name: string; term: number; faculty: { _id: string; name: string } };
    ratings: { [question: string]: number };
    submittedAt: string;
    comments?: string;
  }>>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please login to view reports.', 'warning');
        return;
      }
      const handleErrorAndReload = (error: any) => {
        const isCorsError = error.message?.includes('CORS') || error.message?.includes('cross-origin') || error.message?.toLowerCase().includes('cors') || error.message?.includes('blocked by CORS policy') || error.message?.includes('Access-Control-Allow-Origin');
        const isNetworkError = error.message === 'Failed to fetch' || error.response?.status === 500 || error.message?.includes('Network Error') || !error.response;
        if (isCorsError) {
          showToast('CORS configuration issue detected. Please retry or contact support.', 'warning');
          setAllFeedbackData([]);
        } else if (isNetworkError) {
          setAllFeedbackData([]);
          showToast('Unable to connect to server. Please check your network connection.', 'error');
        } else {
          showToast(`Error: ${error.message || 'Unknown error'}`, 'error');
        }
      };
      fetchAllFeedbackData().catch(handleErrorAndReload);
    }
  }, []);

  const fetchAllFeedbackData = async (): Promise<void> => {
    try {
      setLoading(true);
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please login to access feedback data.', 'warning');
        window.location.href = '/login';
        return;
      }
      try {
        const isHealthy = await checkServerHealth();
        if (!isHealthy) {
          showToast('Server is not responding. Please try again later.', 'warning');
          setAllFeedbackData([]);
          return;
        }
      } catch {}
      const response = await api.get('/api/dean/feedback', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { 
          timestamp: Date.now(),
          fresh: true,
          forceReload: true
        }
      });
      const data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        setAllFeedbackData(data);
      } else if (data && Array.isArray(data.feedback) && data.feedback.length > 0) {
        setAllFeedbackData(data.feedback);
      } else {
        showToast('No feedback data available yet. Please submit feedback first.', 'info');
        setAllFeedbackData([]);
      }
    } catch (error: any) {
      let errorMessage = 'Failed to connect to the server';
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your network connection.';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      showToast(`Failed to load feedback data: ${errorMessage}`, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Advanced Analytics Reports</h1>
        <p className="text-gray-600">Comprehensive feedback analysis and advanced insights across all branches</p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Advanced Analytics Dashboard
          <button 
            onClick={fetchAllFeedbackData}
            className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </h2>
        {loading ? (
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium text-blue-700">Loading analytics data...</span>
            </div>
          </div>
        ) : (
          <>
            {Array.isArray(allFeedbackData) && allFeedbackData.length > 0 ? (
              <DeanAdvancedReport feedbacks={allFeedbackData} />
            ) : (
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-700 mb-2">No Analytics Data Available</h3>
                <p className="text-yellow-600">
                  {allFeedbackData === undefined ? 
                    "Failed to load feedback data. Please check your connection and try again." : 
                    "No feedback data available for analytics. Try adding some feedback first."}
                </p>
                <div className="mt-4">
                  <button 
                    onClick={fetchAllFeedbackData} 
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-700">Troubleshooting</h4>
              <ul className="list-disc list-inside text-blue-600 mt-2">
                <li>Make sure you have dean privileges</li>
                <li>Verify the backend server is running</li>
                <li>Check browser console for detailed errors</li>
                <li>Try logging out and back in to refresh your session</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
