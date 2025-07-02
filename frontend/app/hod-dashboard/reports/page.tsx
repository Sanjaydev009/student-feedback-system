'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  branch: string[]; // Array to support multiple branches (common subjects)
  year: number;
  term: number;
}

interface Report {
  _id: {
    subject: string;
    subjectName: string;
    subjectCode: string;
    instructor: string;
  };
  totalFeedbacks: number;
  averageRating: number;
  ratings: number[];
}

interface FeedbackDetail {
  _id: string;
  student: {
    name: string;
    rollNumber: string;
    branch: string;
  };
  subject: {
    name: string;
    code: string;
    instructor: string;
  };
  averageRating: number;
  answers: Array<{
    question: string;
    answer: number;
  }>;
  createdAt: string;
}

export default function HODReports() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [feedbackDetails, setFeedbackDetails] = useState<FeedbackDetail[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSubjectForDetails, setSelectedSubjectForDetails] = useState('');
  const [departmentInfo, setDepartmentInfo] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  // Retry mechanism for loading reports
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    // First load the subjects
    fetchSubjects();
    // Then load initial reports without filters
    fetchInitialReports();
  }, []);
  
  // Add retry mechanism
  useEffect(() => {
    if (retryCount > 0 && retryCount <= maxRetries) {
      const timer = setTimeout(() => {
        console.log(`Retry attempt ${retryCount} of ${maxRetries}...`);
        fetchInitialReports();
      }, 2000); // Wait 2 seconds between retries
      
      return () => clearTimeout(timer);
    }
  }, [retryCount]);

  // Separate effect for filter changes to avoid initial double load
  useEffect(() => {
    // Don't run on initial render, only when filters change
    if (loading) return;
    
    // Add a small delay to prevent too many requests
    const delayDebounceFn = setTimeout(() => {
      fetchReports();
    }, 300);
    
    return () => clearTimeout(delayDebounceFn);
  }, [selectedSubject, selectedSemester, startDate, endDate]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/api/hod/subjects');
      setSubjects(response.data);
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      showToast('Failed to load subjects', 'error');
    }
  };

  // Initial reports fetch without filters
  const fetchInitialReports = async () => {
    try {
      setLoading(true);
      
      // Get user info to know department
      const userInfo = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      // Debug info
      console.log('Attempting to fetch HOD reports with token:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        showToast('No authentication token found. Please log in again.', 'error');
        router.push('/login');
        return;
      }
      
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          setDepartmentInfo(user.branch || '');
          console.log('User branch:', user.branch, 'User role:', user.role);
          
          if (user.role !== 'hod') {
            showToast('You need HOD access to view this page', 'error');
            router.push('/login');
            return;
          }
        } catch (parseError) {
          console.error('Error parsing user info:', parseError);
        }
      }
      
      // Add debug headers to track request
      console.log('Making API request to /api/hod/reports');
      const response = await api.get('/api/hod/reports');
      console.log('API Response received:', response.status, response.data.length || 0, 'reports found');
      setReports(response.data);
    } catch (error: any) {
      console.error('Error fetching initial reports:', error);
      if (error.response?.status === 403) {
        showToast('Access denied. HOD role required.', 'error');
        router.push('/login');
      } else if (error.response?.status === 401) {
        showToast('Authentication expired. Please log in again.', 'error');
        router.push('/login');
      } else {
        console.error('Error details:', error.response || error.message || error);
        
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          showToast(`Failed to load reports. Retrying... (${retryCount + 1}/${maxRetries})`, 'warning');
        } else {
          showToast(`Failed to load reports after ${maxRetries} attempts. Please check your connection.`, 'error');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedSubject) params.subject = selectedSubject;
      if (selectedSemester) params.semester = selectedSemester;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/api/hod/reports', { params });
      setReports(response.data);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      if (error.response?.status === 403) {
        showToast('Access denied. HOD role required.', 'error');
        router.push('/login');
      } else {
        showToast('Failed to load reports', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbackDetails = async (subjectId: string) => {
    try {
      setLoading(true);
      // Find the subject name for better UX
      const subjectName = subjects.find(s => s._id === subjectId)?.name || 'Selected subject';
      showToast(`Loading feedback details for ${subjectName}...`, 'info');
      
      const response = await api.get(`/api/hod/feedback/${subjectId}`);
      setFeedbackDetails(response.data);
      setSelectedSubjectForDetails(subjectId);
      setShowDetails(true);
    } catch (error: any) {
      console.error('Error fetching feedback details:', error);
      if (error.response?.status === 403) {
        showToast('Access denied. HOD role required.', 'error');
        router.push('/login');
      } else if (error.response?.status === 404) {
        showToast('No feedback found for this subject', 'warning');
      } else {
        showToast('Failed to load feedback details. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      if (!reports || reports.length === 0) {
        showToast('No data to export', 'warning');
        return;
      }
      
      const csvData = reports.map(report => ({
        Subject: report._id.subjectName,
        Code: report._id.subjectCode,
        Instructor: report._id.instructor,
        TotalFeedbacks: report.totalFeedbacks,
        AverageRating: (report.averageRating || 0).toFixed(2)
      }));

      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `department-feedback-${departmentInfo}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Report exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showToast('Failed to export data', 'error');
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-100';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Feedback Reports</h1>
            <p className="text-gray-600">Analyze feedback for your department</p>
          </div>
          {reports.length > 0 && (
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => {
              setSelectedSubject('');
              setSelectedSemester('');
              setStartDate('');
              setEndDate('');
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Reports Table */}
      {!showDetails ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Subject Reports ({reports.length} found)
            </h2>
          </div>
          
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading reports data...</p>
              <p className="mt-2 text-sm text-gray-500">
                Please wait while we retrieve your department's feedback reports
              </p>
            </div>
          ) : reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instructor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Feedback
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => {
                    // Safely handle potentially missing data
                    const subjectId = report._id?.subject || '';
                    const subjectName = report._id?.subjectName || 'Unknown Subject';
                    const subjectCode = report._id?.subjectCode || 'No Code';
                    const instructor = report._id?.instructor || 'Unknown';
                    const totalFeedbacks = report.totalFeedbacks || 0;
                    const rating = report.averageRating || 0;
                    
                    return (
                      <tr key={subjectId + '-' + Date.now()} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {subjectName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Code: {subjectCode}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {instructor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {totalFeedbacks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(rating)}`}>
                            {rating.toFixed(2)}★
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => fetchFeedbackDetails(subjectId)}
                            className="text-blue-600 hover:text-blue-900"
                            disabled={!subjectId}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">
                Try adjusting your filters or check back later for new feedback.
              </p>
              <button
                onClick={() => {
                  setLoading(true);
                  setRetryCount(0);
                  showToast('Retrying to fetch reports...', 'info');
                  fetchInitialReports();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Loading Reports
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Feedback Details */
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Feedback Details ({feedbackDetails.length} feedback entries)
            </h2>
            <button
              onClick={() => setShowDetails(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Back to Reports
            </button>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading feedback details...</p>
            </div>
          ) : feedbackDetails.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feedbackDetails.map((feedback) => (
                    <tr key={feedback._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {feedback.student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {feedback.student.rollNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {feedback.subject.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {feedback.subject.instructor}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(feedback.averageRating)}`}>
                          {feedback.averageRating.toFixed(2)}★
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(feedback.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <h3 className="text-sm font-medium text-gray-900">No feedback details found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No feedback has been submitted for this subject yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
