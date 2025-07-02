'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import api from '@/utils/api-debug'; // Use debug API

interface FeedbackReport {
  _id: string;
  subject: {
    _id: string;
    name: string;
    code: string;
    branch: {
      name: string;
      code: string;
    };
  };
  faculty: {
    _id: string;
    name: string;
    email: string;
  };
  totalResponses: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  responseRate: number;
  lastUpdated: string;
}

interface DetailedFeedback {
  _id: string;
  student: {
    _id: string;
    name: string;
    rollNumber: string;
  };
  ratings: {
    teachingQuality: number;
    courseContent: number;
    preparation: number;
    interaction: number;
    overall: number;
  };
  comments: string;
  isAnonymous: boolean;
  submittedAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<FeedbackReport | null>(null);
  const [detailedFeedback, setDetailedFeedback] = useState<DetailedFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const { showToast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Use the api utility instead of raw fetch for consistency
      const response = await api.get('/api/dean/reports');
      console.log('Reports API response:', response.data); // For debugging
      
      // The API returns the reports array directly, not wrapped in an object
      if (Array.isArray(response.data)) {
        setReports(response.data);
      } else if (response.data && response.data.reports && Array.isArray(response.data.reports)) {
        // Handle case where reports might be wrapped in an object
        setReports(response.data.reports);
      } else {
        console.error('Unexpected response format:', response.data);
        setReports([]);
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      if (error.response?.status === 403) {
        showToast('Access denied. Dean privileges required.', 'error');
        // Could add redirection to login here
      } else {
        showToast(`Failed to load reports: ${error.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedFeedback = async (subjectId: string) => {
    if (!subjectId) {
      showToast('Invalid subject ID', 'error');
      return;
    }
    
    setLoadingDetails(true);
    try {
      const response = await api.get(`/api/dean/feedback/${subjectId}/details`);
      console.log('Detailed feedback response:', response.data); // For debugging
      
      // The API returns the feedback array directly
      if (Array.isArray(response.data)) {
        setDetailedFeedback(response.data);
      } else if (response.data && response.data.feedback && Array.isArray(response.data.feedback)) {
        setDetailedFeedback(response.data.feedback);
      } else {
        console.error('Unexpected feedback response format:', response.data);
        setDetailedFeedback([]);
      }
    } catch (error: any) {
      console.error('Error fetching detailed feedback:', error);
      showToast(`Failed to load detailed feedback: ${error.message || 'Unknown error'}`, 'error');
      setDetailedFeedback([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      (report.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (report.subject?.code?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (report.faculty?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesBranch = branchFilter === 'all' || report.subject?.branch?.code === branchFilter;

    return matchesSearch && matchesBranch;
  });

  const uniqueBranches = Array.from(
    new Set(reports.filter(r => r.subject?.branch?.code).map(r => r.subject.branch.code))
  );

  const getRatingColor = (rating: number | undefined) => {
    if (!rating) return 'text-gray-600';
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResponseRateColor = (rate: number | undefined) => {
    if (!rate && rate !== 0) return 'bg-gray-100 text-gray-800';
    if (rate >= 80) return 'bg-green-100 text-green-800';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Feedback Reports</h1>
        <p className="text-gray-600">Comprehensive feedback analysis across all branches</p>
      </div>

      {!selectedReport ? (
        <>
          {/* Filters */}
          <div className="mb-6 flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search subjects or faculty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Branches</option>
                {uniqueBranches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reports Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <div key={report._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{report.subject?.name ?? 'Unknown Subject'}</h3>
                  <p className="text-sm text-gray-500 font-mono">{report.subject?.code ?? 'No code'}</p>
                  <p className="text-sm text-gray-600">{report.subject?.branch?.name ?? 'Unknown Branch'}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Faculty</span>
                    <span className="text-sm font-medium text-gray-900">{report.faculty?.name ?? 'Not Assigned'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Responses</span>
                    <span className="text-sm font-medium text-gray-900">{report.totalResponses ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Rating</span>
                    <div className="flex items-center space-x-1">
                      <span className={`text-sm font-medium ${getRatingColor(report.averageRating)}`}>
                        {report.averageRating !== undefined ? report.averageRating.toFixed(1) : 'N/A'}
                      </span>
                      {report.averageRating !== undefined && (
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(report.averageRating ?? 0) ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResponseRateColor(report.responseRate ?? 0)}`}>
                      {report.responseRate !== undefined ? report.responseRate.toFixed(1) : '0'}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      if (report.subject?._id) {
                        fetchDetailedFeedback(report.subject._id);
                      }
                    }}
                    className="w-full bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    View Detailed Report
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredReports.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No feedback reports are available.'}
              </p>
            </div>
          )}
        </>
      ) : (
        /* Detailed Report View */
        <div className="space-y-6">
          {/* Back Button and Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedReport(null);
                setDetailedFeedback([]);
              }}
              className="flex items-center text-purple-600 hover:text-purple-800"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Reports
            </button>
          </div>

          {/* Report Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedReport.subject.name}</h2>
                <p className="text-gray-600">{selectedReport.subject.code} - {selectedReport.subject.branch.name}</p>
                <p className="text-sm text-gray-500">Faculty: {selectedReport.faculty.name}</p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getRatingColor(selectedReport.averageRating)}`}>
                  {selectedReport.averageRating.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">{selectedReport.totalResponses} responses</div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Rating Distribution</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = selectedReport.ratingDistribution[rating as keyof typeof selectedReport.ratingDistribution];
                  const percentage = selectedReport.totalResponses > 0 ? (count / selectedReport.totalResponses) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center space-x-3">
                      <span className="w-8 text-sm font-medium">{rating}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="w-16 text-sm text-gray-600 text-right">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Individual Feedback */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Individual Feedback</h3>
              <p className="text-sm text-gray-600">Detailed feedback from students who have given permission to show their identity</p>
            </div>
            
            {loadingDetails ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-300 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {detailedFeedback.map((feedback) => (
                  <div key={feedback._id} className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {feedback.isAnonymous ? 'Anonymous Student' : feedback.student.name}
                        </h4>
                        {!feedback.isAnonymous && (
                          <p className="text-sm text-gray-500">Roll: {feedback.student.rollNumber}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-purple-600">
                          {feedback.ratings.overall}★
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(feedback.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{feedback.ratings.teachingQuality}</div>
                        <div className="text-xs text-gray-500">Teaching</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{feedback.ratings.courseContent}</div>
                        <div className="text-xs text-gray-500">Content</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{feedback.ratings.preparation}</div>
                        <div className="text-xs text-gray-500">Preparation</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{feedback.ratings.interaction}</div>
                        <div className="text-xs text-gray-500">Interaction</div>
                      </div>
                    </div>

                    {feedback.comments && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{feedback.comments}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {detailedFeedback.length === 0 && !loadingDetails && (
              <div className="p-6 text-center">
                <p className="text-gray-500">No detailed feedback available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
