'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

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

export default function DeanReportsPage() {
  const { showError, showSuccess, showInfo, showWarning } = useToast();
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [termFilter, setTermFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);

  // Available filter options
  const years = [1, 2, 3, 4];
  const terms = [1, 2, 3, 4];
  const branches = [
    'Computer Science', 
    'Electronics', 
    'Mechanical', 
    'Civil', 
    'Electrical',
    'Information Technology',
    'Chemical',
    'Aerospace',
    'Biotechnology',
    'MCA Regular', 
    'MCA DS'
  ];

  useEffect(() => {
    fetchReports();
    fetchDashboardStats();
    fetchAnalyticsData();
  }, [yearFilter, termFilter, branchFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (yearFilter !== 'all') params.append('year', yearFilter);
      if (termFilter !== 'all') params.append('term', termFilter);
      if (branchFilter !== 'all') params.append('branch', branchFilter);
      
      const response = await api.get(`/api/test/dean/reports?${params.toString()}`);
      setReports(response.data);
      showInfo(`Reports loaded successfully (${response.data.length} found)`);
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      showError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const params = new URLSearchParams();
      if (yearFilter !== 'all') params.append('year', yearFilter);
      if (termFilter !== 'all') params.append('term', termFilter);
      if (branchFilter !== 'all') params.append('branch', branchFilter);
      
      const response = await api.get(`/api/test/dean/dashboard-stats?${params.toString()}`);
      setDashboardStats(response.data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const params = new URLSearchParams();
      if (yearFilter !== 'all') params.append('year', yearFilter);
      if (termFilter !== 'all') params.append('term', termFilter);
      if (branchFilter !== 'all') params.append('branch', branchFilter);
      
      const response = await api.get(`/api/test/dean/analytics?${params.toString()}`);
      setAnalyticsData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch analytics data:', err);
    }
  };

  // Create chart data for rating distribution
  const createRatingDistributionChart = () => {
    if (reports.length === 0) return null;

    const aggregatedDistribution = reports.reduce((acc, report) => {
      Object.keys(report.ratingDistribution).forEach(rating => {
        const ratingKey = rating as '1' | '2' | '3' | '4' | '5';
        acc[rating] = (acc[rating] || 0) + report.ratingDistribution[ratingKey];
      });
      return acc;
    }, {} as { [key: string]: number });

    return {
      labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
      datasets: [{
        label: 'Rating Distribution',
        data: [
          aggregatedDistribution['1'] || 0,
          aggregatedDistribution['2'] || 0,
          aggregatedDistribution['3'] || 0,
          aggregatedDistribution['4'] || 0,
          aggregatedDistribution['5'] || 0
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // Red for 1 star
          'rgba(245, 158, 11, 0.8)',  // Orange for 2 stars
          'rgba(251, 191, 36, 0.8)',  // Yellow for 3 stars
          'rgba(16, 185, 129, 0.8)',  // Green for 4 stars
          'rgba(59, 130, 246, 0.8)'   // Blue for 5 stars
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(59, 130, 246, 1)'
        ],
        borderWidth: 2
      }]
    };
  };

  // Create chart data for average ratings by subject
  const createSubjectRatingsChart = () => {
    if (reports.length === 0) return null;

    const sortedReports = [...reports].sort((a, b) => b.averageRating - a.averageRating).slice(0, 10);

    return {
      labels: sortedReports.map(report => report.subject.code),
      datasets: [{
        label: 'Average Rating',
        data: sortedReports.map(report => report.averageRating),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Top 10 Subjects by Average Rating'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: 'Average Rating'
        }
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dean Basic Reports</h1>
        <p className="mt-2 text-gray-600">Comprehensive feedback analytics and reports for all departments</p>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardStats.studentsCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Subjects</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardStats.subjectsCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Feedback</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalFeedback || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Faculty Members</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardStats.facultyCount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Year
            </label>
            <select
              id="year"
              name="year"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>Year {year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Term
            </label>
            <select
              id="term"
              name="term"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
            >
              <option value="all">All Terms</option>
              {terms.map(term => (
                <option key={term} value={term}>Term {term}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Branch
            </label>
            <select
              id="branch"
              name="branch"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Rating Distribution</h3>
          <div className="h-64">
            {createRatingDistributionChart() && (
              <Pie data={createRatingDistributionChart()!} options={chartOptions} />
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Performance</h3>
          <div className="h-64">
            {createSubjectRatingsChart() && (
              <Bar data={createSubjectRatingsChart()!} options={barChartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Detailed Reports</h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading reports...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
              <p className="mt-1 text-sm text-gray-500">No feedback reports match your current filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{report.subject.name}</div>
                        <div className="text-sm text-gray-500">{report.subject.code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.faculty.name}</div>
                      <div className="text-sm text-gray-500">{report.faculty.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {report.subject.branch.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalResponses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{report.averageRating.toFixed(2)}</div>
                        <div className="ml-2 flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`h-4 w-4 ${
                                star <= Math.round(report.averageRating) ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">{report.responseRate.toFixed(1)}%</div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(report.responseRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
