'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/utils/api';

interface AnalyticsData {
  departmentWiseStats: {
    department: string;
    totalSubjects: number;
    averageRating: number;
    totalFeedbacks: number;
    satisfactionRate: number;
  }[];
  semesterWiseStats: {
    semester: number;
    totalSubjects: number;
    averageRating: number;
    totalFeedbacks: number;
  }[];
  instructorPerformance: {
    instructor: string;
    subjects: number;
    averageRating: number;
    totalFeedbacks: number;
    department: string;
  }[];
  trendData: {
    month: string;
    averageRating: number;
    totalFeedbacks: number;
    responseRate: number;
  }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedView, setSelectedView] = useState('department');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/api/admin/analytics');
        setAnalytics(response.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
            <p className="text-gray-600 mt-1">Deep insights into feedback patterns and performance</p>
          </div>
          <Link
            href="/admin-dashboard"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* View Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex space-x-2">
          {[
            { key: 'department', label: 'Department Analysis' },
            // { key: 'semester', label: 'Semester Analysis' },
            { key: 'instructor', label: 'Instructor Performance' },
            { key: 'trends', label: 'Trends & Patterns' }
          ].map((view) => (
            <button
              key={view.key}
              onClick={() => setSelectedView(view.key)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedView === view.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Department Analysis */}
      {selectedView === 'department' && analytics?.departmentWiseStats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Department-wise Performance</h2>
          <div className="grid gap-4">
            {analytics.departmentWiseStats.map((dept, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{dept.department}</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{dept.averageRating ? dept.averageRating.toFixed(1) : "N/A"}</div>
                    <div className="text-sm text-gray-500">Avg Rating</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Subjects:</span>
                    <span className="ml-2 font-medium">{dept.totalSubjects}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Feedbacks:</span>
                    <span className="ml-2 font-medium">{dept.totalFeedbacks}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Satisfaction:</span>
                    <span className="ml-2 font-medium">{dept.satisfactionRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Semester Analysis */}
      {selectedView === 'semester' && analytics?.semesterWiseStats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Term-wise Performance</h2>
          <div className="grid gap-4">
            {analytics.semesterWiseStats.map((sem, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Term {sem.semester}</h3>
                  <div className="grid grid-cols-3 gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{sem.totalSubjects}</div>
                      <div className="text-gray-500">Subjects</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{sem.averageRating ? sem.averageRating.toFixed(1) : "N/A"}</div>
                      <div className="text-gray-500">Avg Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{sem.totalFeedbacks}</div>
                      <div className="text-gray-500">Feedbacks</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructor Performance */}
      {selectedView === 'instructor' && analytics?.instructorPerformance && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Instructor Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subjects</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.instructorPerformance.map((instructor, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {instructor.instructor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {instructor.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {instructor.subjects}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        instructor.averageRating >= 4 ? 'bg-green-100 text-green-800' :
                        instructor.averageRating >= 3 ? 'bg-blue-100 text-blue-800' :
                        instructor.averageRating >= 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {instructor.averageRating ? instructor.averageRating.toFixed(1) : "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {instructor.totalFeedbacks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trends */}
      {selectedView === 'trends' && analytics?.trendData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Trends & Patterns</h2>
          <div className="grid gap-4">
            {analytics.trendData.map((trend, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{trend.month}</h3>
                  <div className="grid grid-cols-3 gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{trend.averageRating ? trend.averageRating.toFixed(1) : "N/A"}</div>
                      <div className="text-gray-500">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{trend.totalFeedbacks}</div>
                      <div className="text-gray-500">Feedbacks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{trend.responseRate}%</div>
                      <div className="text-gray-500">Response Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
