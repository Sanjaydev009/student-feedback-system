'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  branch: string;
  semester: number;
}

interface FeedbackSummary {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  instructor: string;
  feedbackCount: number;
  averageRating: number;
  categories: {
    [key: string]: {
      average: number;
      questions: {
        question: string;
        average: number;
      }[];
    };
  };
}

export default function ReportsPage() {
  const { showError, showSuccess, showInfo, showWarning } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [facultyRatings, setFacultyRatings] = useState<{ [key: string]: number }>({});
  const [overallSummary, setOverallSummary] = useState<{
    totalFeedback: number,
    averageRating: number,
    subjectsWithFeedback: number
  }>({
    totalFeedback: 0,
    averageRating: 0,
    subjectsWithFeedback: 0
  });

  useEffect(() => {
    fetchSubjects();
    fetchOverallStats();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/api/subjects');
      setSubjects(response.data);
      showInfo('Subjects loaded successfully');
    } catch (err: any) {
      console.error('Failed to fetch subjects:', err);
      showError('Failed to load subjects. Please try again.');
    }
  };
  
  const fetchOverallStats = async () => {
    try {
      // Get all feedback summary
      const response = await api.get('/api/feedback/stats');
      
      // Calculate faculty ratings
      if (response.data && response.data.facultyRatings) {
        setFacultyRatings(response.data.facultyRatings);
      }
      
      // Set overall summary
      if (response.data) {
        setOverallSummary({
          totalFeedback: response.data.totalFeedback || 0,
          averageRating: response.data.averageRating || 0,
          subjectsWithFeedback: response.data.subjectsWithFeedback || 0
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch overall stats:', err);
    }
  };

  const fetchFeedbackSummary = async (subjectId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/feedback/summary/${subjectId}`);
      setFeedbackSummary(response.data);
      
      if (response.data && response.data.feedbackCount > 0) {
        showSuccess(`Loaded feedback data for ${response.data.subjectName} (${response.data.feedbackCount} responses)`);
      } else {
        showInfo(`No feedback data available for ${response.data?.subjectName || 'this subject'}`);
      }
    } catch (err: any) {
      console.error('Failed to fetch feedback summary:', err);
      showError('Failed to load feedback data. Please try again.');
      setFeedbackSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    if (subjectId) {
      fetchFeedbackSummary(subjectId);
    } else {
      setFeedbackSummary(null);
    }
  };

  // Filter subjects based on branch and semester
  const filteredSubjects = subjects.filter(subject => {
    const matchesBranch = branchFilter === 'all' || subject.branch === branchFilter;
    const matchesSemester = semesterFilter === 'all' || subject.semester === parseInt(semesterFilter);
    return matchesBranch && matchesSemester;
  });

  const handleExportCSV = () => {
    if (!feedbackSummary) {
      showWarning('Please select a subject with feedback data to export');
      return;
    }

    try {
      // Create CSV content
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Subject,Code,Instructor,Total Feedback,Average Rating\n';
      csvContent += `${feedbackSummary.subjectName},${feedbackSummary.subjectCode},${feedbackSummary.instructor},${feedbackSummary.feedbackCount},${feedbackSummary.averageRating.toFixed(2)}\n\n`;
      
      csvContent += 'Category,Question,Average Rating\n';
      Object.entries(feedbackSummary.categories).forEach(([category, data]) => {
        data.questions.forEach(q => {
          csvContent += `${category},"${q.question}",${q.average.toFixed(2)}\n`;
        });
      });

      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `feedback_report_${feedbackSummary.subjectCode}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccess(`Feedback report for ${feedbackSummary.subjectName} exported successfully`);
    } catch (error) {
      console.error('Export failed:', error);
      showError('Failed to export CSV. Please try again.');
    }
  };

  // Prepare chart data if feedback summary is available
  const pieChartData = feedbackSummary ? {
    labels: Object.keys(feedbackSummary.categories),
    datasets: [
      {
        data: Object.values(feedbackSummary.categories).map(cat => cat.average),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const getDetailedBarChartData = () => {
    if (!feedbackSummary) return null;
    
    // Get all questions from all categories
    let labels: string[] = [];
    let data: number[] = [];
    
    Object.entries(feedbackSummary.categories).forEach(([category, catData]) => {
      catData.questions.forEach(q => {
        // Truncate long question text
        const questionLabel = q.question.length > 30 ? q.question.substring(0, 30) + '...' : q.question;
        labels.push(questionLabel);
        data.push(q.average);
      });
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Average Rating',
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const barChartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: 'Average Rating (out of 5)'
        }
      },
      x: {
        ticks: {
          maxRotation: 90,
          minRotation: 45
        }
      }
    }
  };

  return (
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Feedback Reports</h1>
        <p className="text-gray-600 mt-2">Analyze student feedback for all subjects</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Total Feedback Collected</p>
              <p className="text-2xl font-semibold text-gray-800">{overallSummary.totalFeedback}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Average Rating</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-800">{overallSummary.averageRating.toFixed(2)}</p>
                <p className="text-gray-500 text-sm ml-2">/ 5.00</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Subjects With Feedback</p>
              <p className="text-2xl font-semibold text-gray-800">{overallSummary.subjectsWithFeedback}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Faculty Ratings */}
      {Object.keys(facultyRatings).length > 0 && (
        <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Faculty Performance Overview</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(facultyRatings).map(([instructor, rating], index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-800">{instructor}</p>
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        rating >= 4 ? 'bg-green-100 text-green-800' : 
                        rating >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {rating.toFixed(1)} / 5
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        rating >= 4 ? 'bg-green-600' : 
                        rating >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{width: `${(rating / 5) * 100}%`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value="MCA Regular">MCA Regular</option>
              <option value="MCA DS">MCA DS</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Semester
            </label>
            <select
              id="semester"
              name="semester"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
            >
              <option value="all">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Select Subject for Detailed Report
            </label>
            <select
              id="subject"
              name="subject"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
              value={selectedSubject}
              onChange={handleSubjectChange}
            >
              <option value="">Select a subject</option>
              {filteredSubjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code}) - {subject.instructor}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Data */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">Loading feedback data...</p>
        </div>
      ) : !selectedSubject ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 012.184 1.327 3.42 3.42 0 01.63 2.248 3.42 3.42 0 01-.956 2.054 3.42 3.42 0 01-.62 3.135 3.42 3.42 0 01-2.054.956 3.42 3.42 0 01-2.184 1.327 3.42 3.42 0 01-4.438 0 3.42 3.42 0 01-2.184-1.327 3.42 3.42 0 01-2.054-.956 3.42 3.42 0 01-.62-3.135 3.42 3.42 0 01-.956-2.054 3.42 3.42 0 01.63-2.248 3.42 3.42 0 012.184-1.327z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Select a Subject</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select a subject from the dropdown above to view detailed feedback reports.
          </p>
        </div>
      ) : feedbackSummary && feedbackSummary.feedbackCount === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No Feedback Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            No feedback has been submitted for this subject yet.
          </p>
        </div>
      ) : feedbackSummary && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  {feedbackSummary.subjectName} ({feedbackSummary.subjectCode})
                </h2>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded p-4 text-center">
                  <p className="text-sm text-gray-500">Instructor</p>
                  <p className="text-lg font-medium text-gray-800">{feedbackSummary.instructor}</p>
                </div>
                <div className="bg-gray-50 rounded p-4 text-center">
                  <p className="text-sm text-gray-500">Total Feedback</p>
                  <p className="text-lg font-medium text-gray-800">{feedbackSummary.feedbackCount}</p>
                </div>
                <div className="bg-gray-50 rounded p-4 text-center">
                  <p className="text-sm text-gray-500">Overall Average Rating</p>
                  <div className="flex justify-center items-center">
                    <p className="text-lg font-medium text-gray-800">{feedbackSummary.averageRating.toFixed(2)}</p>
                    <p className="text-gray-400 text-sm ml-1">/ 5</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Category Ratings</h3>
              <div className="h-80">
                {pieChartData && <Pie data={pieChartData} />}
              </div>
            </div>
            
            {/* Question Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Question Ratings</h3>
              <div className="h-80">
                {getDetailedBarChartData() && <Bar data={getDetailedBarChartData()!} options={barChartOptions} />}
              </div>
            </div>
          </div>

          {/* Detailed Feedback by Category */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Detailed Feedback by Category</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {Object.entries(feedbackSummary.categories).map(([category, data], index) => (
                <div key={index} className="p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">{category}</h3>
                  <p className="text-gray-500 mb-4">Average: {data.average.toFixed(2)} / 5</p>
                  
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Question</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Average Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {data.questions.map((q, qIndex) => (
                          <tr key={qIndex}>
                            <td className="py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">{q.question}</td>
                            <td className="px-3 py-4 text-sm">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${(q.average / 5) * 100}%`}}></div>
                                </div>
                                <span className="ml-3 text-gray-700">{q.average.toFixed(2)}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}