'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/utils/api';
import { FaArrowLeft, FaStar, FaDownload } from 'react-icons/fa';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function SubjectReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch subject feedback summary
  useEffect(() => {
    if (!isClient) return;
    
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/feedback/summary/${params.id}`);
        setSummary(response.data);
        setError('');
      } catch (err: any) {
        console.error('Error fetching feedback summary:', err);
        setError(err.response?.data?.message || 'Failed to load feedback summary');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSummary();
    }
  }, [isClient, params.id]);

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <FaStar 
            key={i}
            className={`${
              i < Math.floor(rating) 
                ? "text-yellow-400" 
                : i < Math.ceil(rating) && i > Math.floor(rating) - 1
                  ? "text-yellow-300" 
                  : "text-gray-300"
            } h-5 w-5`}
          />
        ))}
      </div>
    );
  };

  const generateRatingDistributionData = () => {
    if (!summary || !summary.categories?.General?.questions) return [];
    
    // Count ratings by range
    const ratingCounts = { 
      '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 
    };
    
    summary.categories.General.questions.forEach(q => {
      const rating = Math.round(q.average);
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating.toString() as keyof typeof ratingCounts]++;
      }
    });
    
    return Object.entries(ratingCounts).map(([name, value]) => ({
      name: `${name} ★`,
      value
    })).reverse(); // Reverse to show 5★ first
  };

  // Simple loading state UI for SSR
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/admin-dashboard/reports" className="mr-4 text-white hover:text-blue-100 transition-colors">
                <FaArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-white">Subject Feedback Details</h1>
            </div>
            <button
              onClick={() => alert('Export functionality will be implemented')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none transition-colors"
            >
              <FaDownload className="-ml-1 mr-2 h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto my-4 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <button 
              onClick={() => router.back()} 
              className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        </div>
      ) : summary ? (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Subject Overview Card */}
          <div className="bg-white rounded-lg shadow-md mb-8 overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-2">
                  <h2 className="text-2xl font-bold text-gray-800">{summary.subjectName}</h2>
                  <p className="text-gray-600">{summary.subjectCode}</p>
                  <div className="mt-4 space-y-2">
                    <p><span className="font-medium">Instructor:</span> {summary.instructor}</p>
                    <p><span className="font-medium">Feedback Submitted:</span> {summary.feedbackCount} responses</p>
                    <div className="flex items-center mt-2">
                      <span className="font-medium mr-2">Overall Rating:</span>
                      {renderStarRating(summary.averageRating)}
                      <span className="ml-2 font-semibold text-xl">{summary.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3 text-center">Rating Distribution</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={generateRatingDistributionData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={3}
                          dataKey="value"
                          label={(entry) => entry.name}
                        >
                          {generateRatingDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Question Ratings */}
          <div className="bg-white rounded-lg shadow-md mb-8 overflow-hidden border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Question Ratings</h3>
              
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.categories.General.questions.map((q, index) => ({
                      name: `Q${index + 1}`,
                      question: q.question.length > 40 ? q.question.substring(0, 40) + '...' : q.question,
                      rating: q.average
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis 
                      type="number" 
                      domain={[0, 5]} 
                      ticks={[0, 1, 2, 3, 4, 5]} 
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={40} 
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)} / 5`, 'Rating']}
                      labelFormatter={(label: string) => {
                        const item = summary.categories.General.questions[parseInt(label.replace('Q', '')) - 1];
                        return item ? item.question : label;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="rating" name="Average Rating" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Questions Details */}
          <div className="bg-white rounded-lg shadow-md mb-8 overflow-hidden border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Feedback Questions Detail</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Question
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average Rating
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summary.categories.General.questions.map((question, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                          {question.question}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {question.average.toFixed(1)} / 5
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(question.average / 5) * 100}%` }}
                              ></div>
                            </div>
                            <div className="min-w-[40px]">
                              {question.average.toFixed(1)}
                            </div>
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
      ) : null}
    </div>
  );
}
