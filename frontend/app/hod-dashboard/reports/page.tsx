'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Colors
} from 'chart.js';

// Register the required chart components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Colors
);

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

interface FeedbackStatus {
  student: {
    _id: string;
    name: string;
    email: string;
    rollNumber: string;
    year: number;
    branch: string;
  };
  subject: {
    _id: string;
    name: string;
    code: string;
    instructor: string;
    term: number;
    branch: string;
  };
  submitted: boolean;
  submittedAt?: string;
}

export default function HODReports() {
  // New state variables for feedback status
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus[]>([]);
  const [studentFilterTerm, setStudentFilterTerm] = useState<string>('all');
  const [studentFilterStatus, setStudentFilterStatus] = useState<string>('all');
  const [studentFilterBranch, setStudentFilterBranch] = useState<string>('all');
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('reports');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
  const [termOptions, setTermOptions] = useState<number[]>([]);
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
    // Finally, load feedback status
    fetchFeedbackStatus();
    fetchFeedbackStatus();
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

  // Fetch feedback status data
  const fetchFeedbackStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/hod/feedback-status');
      setFeedbackStatus(response.data);
      console.log('Feedback status loaded:', response.data.length, 'records');
      
      // Calculate term options
      if (response.data.length > 0) {
        const terms = [...new Set(response.data.map((item: FeedbackStatus) => item.subject.term))] as number[];
        setTermOptions(terms.sort((a, b) => a - b));
        
        // Calculate branch options
        const branches = [...new Set(response.data.map((item: FeedbackStatus) => item.student.branch))];
        setBranchOptions(branches.sort());
      }
    } catch (error: any) {
      console.error('Error fetching feedback status:', error);
      showToast('Failed to load feedback status data', 'error');
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

  // Calculate statistics for the feedback status tab
  const totalStudents = feedbackStatus.length > 0 
    ? [...new Set(feedbackStatus.map(s => s.student._id))].length 
    : 0;
    
  const totalSubmissions = feedbackStatus.filter(s => s.submitted).length;
  const totalPending = feedbackStatus.length - totalSubmissions;
  const submissionRate = feedbackStatus.length > 0 
    ? Math.round((totalSubmissions / feedbackStatus.length) * 100) 
    : 0;

  // Filtered status based on term, branch and submission status
  const filteredFeedbackStatus = feedbackStatus.filter(status => {
    if (studentFilterTerm !== 'all' && status.subject.term.toString() !== studentFilterTerm) return false;
    if (studentFilterStatus === 'submitted' && !status.submitted) return false;
    if (studentFilterStatus === 'pending' && status.submitted) return false;
    if (studentFilterBranch !== 'all' && status.student.branch !== studentFilterBranch) return false;
    
    // Search by student name or roll number
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        status.student.name.toLowerCase().includes(query) ||
        status.student.rollNumber.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Group by term for term-wise statistics
  const termStats = termOptions.map(termNum => {
    const termFeedback = feedbackStatus.filter(s => s.subject.term === termNum);
    const submitted = termFeedback.filter(s => s.submitted).length;
    const total = termFeedback.length;
    const rate = total ? Math.round((submitted / total) * 100) : 0;
    
    return {
      term: termNum,
      total,
      submitted,
      pending: total - submitted,
      rate
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Feedback Reports & Analytics</h1>
            <p className="text-gray-600">Analyze feedback for your department</p>
          </div>
          {reports.length > 0 && activeTab === 'reports' && (
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

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'reports'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Subject Reports
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'status'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Feedback Status
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'analytics'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Analytics & Visualization
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'reports' && (
        <>
          {/* Original reports content */}
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
              {/* Rest of the filters continue as before */}
            </div>
          </div>
        </>
      )}
      
      {activeTab === 'status' && (
        <div className="space-y-6">
          {/* Student Feedback Status Dashboard */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Real-Time Feedback Status</h2>
            
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-medium text-blue-700">Total Students</h3>
                <p className="text-2xl font-bold text-blue-900">{totalStudents}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-sm font-medium text-green-700">Submitted</h3>
                <p className="text-2xl font-bold text-green-900">{totalSubmissions}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h3 className="text-sm font-medium text-red-700">Pending</h3>
                <p className="text-2xl font-bold text-red-900">{totalPending}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-sm font-medium text-purple-700">Submission Rate</h3>
                <p className="text-2xl font-bold text-purple-900">{submissionRate}%</p>
              </div>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
                <select
                  value={studentFilterTerm}
                  onChange={(e) => setStudentFilterTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Terms</option>
                  {termOptions.map((term) => (
                    <option key={term} value={term.toString()}>Term {term}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                <select
                  value={studentFilterBranch}
                  onChange={(e) => setStudentFilterBranch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Branches</option>
                  {branchOptions.map((branch) => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={studentFilterStatus}
                  onChange={(e) => setStudentFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or roll number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Term-wise Statistics Table */}
            <h3 className="text-md font-semibold text-gray-800 mb-3">Term-wise Submission Statistics</h3>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {termStats.map((stat) => (
                    <tr key={`term-${stat.term}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Term {stat.term}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.total}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {stat.submitted}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {stat.pending}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              stat.rate > 70 ? 'bg-green-600' : stat.rate > 40 ? 'bg-yellow-500' : 'bg-red-600'
                            }`}
                            style={{ width: `${stat.rate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{stat.rate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Student List */}
            <h3 className="text-md font-semibold text-gray-800 mb-3">
              Student Feedback Status 
              <span className="ml-2 text-sm text-gray-500">({filteredFeedbackStatus.length} records)</span>
            </h3>
            <div className="overflow-hidden shadow rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFeedbackStatus.length > 0 ? (
                    filteredFeedbackStatus.map((status, index) => (
                      <tr key={`${status.student._id}-${status.subject._id}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{status.student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{status.student.rollNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{status.student.branch}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {status.subject.name} ({status.subject.code})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Term {status.subject.term}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {status.submitted ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Submitted
                              {status.submittedAt && (
                                <span className="ml-1 text-green-700 text-xs">
                                  {new Date(status.submittedAt).toLocaleDateString()}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No students match the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics & Visualizations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Feedback Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Submission Status Chart */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Feedback Submission Status</h3>
                <div className="aspect-w-16 aspect-h-9">
                  {/* Chart would go here - we'll use a placeholder */}
                  <div className="flex items-center justify-center h-full bg-white rounded border border-gray-200 p-4">
                    <div className="text-center">
                      <div className="flex justify-center space-x-4 mb-4">
                        <div>
                          <div className="w-4 h-4 bg-green-500 rounded-full inline-block mr-2"></div>
                          <span className="text-sm text-gray-700">Submitted: {totalSubmissions}</span>
                        </div>
                        <div>
                          <div className="w-4 h-4 bg-red-500 rounded-full inline-block mr-2"></div>
                          <span className="text-sm text-gray-700">Pending: {totalPending}</span>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-4 bg-green-500" 
                          style={{ width: `${submissionRate}%` }}
                        ></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{submissionRate}% Completion Rate</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Term-wise Submission Chart */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Term-wise Submission Rate</h3>
                <div className="aspect-w-16 aspect-h-9">
                  {/* Chart would go here - we'll use a placeholder */}
                  <div className="flex items-center justify-center h-full bg-white rounded border border-gray-200 p-4">
                    <div className="w-full">
                      {termStats.map(stat => (
                        <div key={`term-viz-${stat.term}`} className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Term {stat.term}</span>
                            <span className="text-sm font-medium text-gray-700">{stat.rate}%</span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full">
                            <div 
                              className={`h-3 rounded-full ${
                                stat.rate > 70 ? 'bg-green-600' : stat.rate > 40 ? 'bg-yellow-500' : 'bg-red-600'
                              }`}
                              style={{ width: `${stat.rate}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{stat.submitted} submitted</span>
                            <span>{stat.pending} pending</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Overall Rating Distribution */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <h3 className="text-md font-semibold text-gray-800 mb-3">Subject Rating Distribution</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report._id.subject}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {report._id.subjectName} ({report._id.subjectCode})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${report.averageRating >= 4 ? 'bg-green-100 text-green-800' : 
                                report.averageRating >= 3 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'}`}
                            >
                              {report.averageRating.toFixed(2)}
                            </span>
                            <div className="ml-2 flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg 
                                  key={star}
                                  className={`h-4 w-4 ${star <= Math.round(report.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                  xmlns="http://www.w3.org/2000/svg" 
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map(rating => {
                              const count = report.ratings.filter(r => Math.round(r) === rating).length;
                              const percentage = report.ratings.length > 0 
                                ? Math.round((count / report.ratings.length) * 100) 
                                : 0;
                              
                              return (
                                <div key={`rating-${rating}`} className="flex-1">
                                  <div className="text-xs text-center">{rating}★</div>
                                  <div className="h-16 bg-gray-200 rounded-t-sm overflow-hidden flex items-end">
                                    <div 
                                      className={`w-full ${
                                        rating >= 4 ? 'bg-green-500' : 
                                        rating >= 3 ? 'bg-yellow-500' : 
                                        'bg-red-500'
                                      }`}
                                      style={{ height: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-center">{percentage}%</div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
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
