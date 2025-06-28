'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/utils/api';

interface ReportData {
  subject: {
    _id: string;
    name: string;
    code: string;
    instructor: string;
    department: string;
  };
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
  trends: {
    monthly: { month: string; averageRating: number; totalFeedback: number }[];
  };
}

interface OverallStats {
  totalSubjects: number;
  totalFeedbacks: number;
  overallAverageRating: number;
  completionRate: number;
  topPerformingSubject: string;
  needsAttentionCount: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('current');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Mock data - replace with actual API calls
        const mockReports: ReportData[] = [
          {
            subject: {
              _id: '1',
              name: 'Mathematics',
              code: 'MATH101',
              instructor: 'Dr. John Smith',
              department: 'Mathematics'
            },
            totalFeedback: 45,
            averageRating: 4.2,
            ratingDistribution: [
              { rating: 5, count: 20 },
              { rating: 4, count: 15 },
              { rating: 3, count: 8 },
              { rating: 2, count: 2 },
              { rating: 1, count: 0 }
            ],
            trends: {
              monthly: [
                { month: 'Jan', averageRating: 4.0, totalFeedback: 12 },
                { month: 'Feb', averageRating: 4.1, totalFeedback: 15 },
                { month: 'Mar', averageRating: 4.2, totalFeedback: 18 }
              ]
            }
          },
          {
            subject: {
              _id: '2',
              name: 'Physics',
              code: 'PHY201',
              instructor: 'Dr. Sarah Johnson',
              department: 'Physics'
            },
            totalFeedback: 38,
            averageRating: 3.9,
            ratingDistribution: [
              { rating: 5, count: 12 },
              { rating: 4, count: 18 },
              { rating: 3, count: 6 },
              { rating: 2, count: 2 },
              { rating: 1, count: 0 }
            ],
            trends: {
              monthly: [
                { month: 'Jan', averageRating: 3.8, totalFeedback: 10 },
                { month: 'Feb', averageRating: 3.9, totalFeedback: 14 },
                { month: 'Mar', averageRating: 3.9, totalFeedback: 14 }
              ]
            }
          },
          {
            subject: {
              _id: '3',
              name: 'Chemistry',
              code: 'CHEM101',
              instructor: 'Dr. Mike Wilson',
              department: 'Chemistry'
            },
            totalFeedback: 32,
            averageRating: 2.8,
            ratingDistribution: [
              { rating: 5, count: 2 },
              { rating: 4, count: 5 },
              { rating: 3, count: 12 },
              { rating: 2, count: 10 },
              { rating: 1, count: 3 }
            ],
            trends: {
              monthly: [
                { month: 'Jan', averageRating: 3.0, totalFeedback: 8 },
                { month: 'Feb', averageRating: 2.9, totalFeedback: 12 },
                { month: 'Mar', averageRating: 2.8, totalFeedback: 12 }
              ]
            }
          }
        ];

        const mockOverallStats: OverallStats = {
          totalSubjects: 3,
          totalFeedbacks: 115,
          overallAverageRating: 3.6,
          completionRate: 78,
          topPerformingSubject: 'Mathematics',
          needsAttentionCount: 1
        };

        setReports(mockReports);
        setOverallStats(mockOverallStats);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [selectedTimeframe]);

  const sortedReports = [...reports].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.averageRating - a.averageRating;
      case 'feedback':
        return b.totalFeedback - a.totalFeedback;
      case 'name':
        return a.subject.name.localeCompare(b.subject.name);
      default:
        return 0;
    }
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-50 border-green-200';
    if (rating >= 3) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (rating >= 2) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPerformanceIndicator = (rating: number) => {
    if (rating >= 4) return { label: 'Excellent', color: 'text-green-600', icon: '🟢' };
    if (rating >= 3) return { label: 'Good', color: 'text-blue-600', icon: '🔵' };
    if (rating >= 2) return { label: 'Average', color: 'text-yellow-600', icon: '🟡' };
    return { label: 'Needs Attention', color: 'text-red-600', icon: '🔴' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 text-lg font-medium mb-2">Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive feedback analysis and performance insights
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Link
              href="/admin-dashboard"
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back to Dashboard
            </Link>
            <button className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              📊 Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Subjects', value: overallStats.totalSubjects, icon: '📚', color: 'blue' },
            { label: 'Total Feedbacks', value: overallStats.totalFeedbacks, icon: '💬', color: 'green' },
            { label: 'Overall Rating', value: overallStats.overallAverageRating.toFixed(1), icon: '⭐', color: 'yellow' },
            { label: 'Completion Rate', value: `${overallStats.completionRate}%`, icon: '📊', color: 'purple' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-wrap items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Time Period:</span>
            {[
              { value: 'current', label: 'Current Semester' },
              { value: 'last', label: 'Last Semester' },
              { value: 'year', label: 'Academic Year' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedTimeframe(option.value)}
                className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                  selectedTimeframe === option.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rating">Average Rating</option>
              <option value="feedback">Total Feedback</option>
              <option value="name">Subject Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6">
        {sortedReports.map((report) => {
          const performance = getPerformanceIndicator(report.averageRating);
          
          return (
            <div key={report.subject._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                {/* Subject Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                  <div className="mb-4 lg:mb-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {report.subject.name}
                      </h3>
                      <span className="text-lg text-gray-500">({report.subject.code})</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRatingColor(report.averageRating)}`}>
                        {performance.icon} {performance.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center space-x-4 text-sm text-gray-600">
                      <span><strong>Instructor:</strong> {report.subject.instructor}</span>
                      <span><strong>Department:</strong> {report.subject.department}</span>
                      <span><strong>Total Feedback:</strong> {report.totalFeedback}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {report.averageRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">Average Rating</div>
                  </div>
                </div>

                {/* Rating Distribution */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Rating Distribution</h4>
                  <div className="grid grid-cols-5 gap-3">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = report.ratingDistribution.find(r => r.rating === rating)?.count || 0;
                      const percentage = report.totalFeedback > 0 ? (count / report.totalFeedback) * 100 : 0;
                      
                      return (
                        <div key={rating} className="text-center">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            {rating} ⭐
                          </div>
                          <div className="h-24 bg-gray-100 rounded-lg flex items-end overflow-hidden">
                            <div
                              className="w-full bg-blue-600 rounded-lg transition-all duration-500 ease-out"
                              style={{ height: `${Math.max(percentage, 2)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            {count} ({percentage.toFixed(0)}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Performance Insights */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Performance Insights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Satisfaction Rate:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {((report.ratingDistribution.filter(r => r.rating >= 4).reduce((sum, r) => sum + r.count, 0) / report.totalFeedback) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Response Rate:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {Math.min(100, Math.round(report.totalFeedback * 2.5))}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Trend:</span>
                      <span className={`ml-2 font-medium ${
                        report.trends.monthly.length >= 2 && 
                        report.trends.monthly[report.trends.monthly.length - 1].averageRating > 
                        report.trends.monthly[report.trends.monthly.length - 2].averageRating
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {report.trends.monthly.length >= 2 && 
                         report.trends.monthly[report.trends.monthly.length - 1].averageRating > 
                         report.trends.monthly[report.trends.monthly.length - 2].averageRating
                          ? '↗ Improving' : '↘ Declining'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Reports State */}
      {sortedReports.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports available</h3>
          <p className="text-gray-500 mb-6">Reports will appear here once feedback is submitted for subjects</p>
          <Link
            href="/admin-dashboard/subjects"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Subjects
          </Link>
        </div>
      )}
    </div>
  );
}
