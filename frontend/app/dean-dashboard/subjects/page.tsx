'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';

interface Subject {
  _id: string;
  name: string;
  code: string;
  credits: number;
  semester: number;
  branch: {
    _id: string;
    name: string;
    code: string;
  };
  faculty: {
    _id: string;
    name: string;
    email: string;
  } | null;
  totalFeedback: number;
  averageRating: number;
  isActive: boolean;
  createdAt: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const { showToast } = useToast();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/dean/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }

      const data = await response.json();
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      showToast('Failed to load subjects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = branchFilter === 'all' || subject.branch._id === branchFilter;
    const matchesSemester = semesterFilter === 'all' || subject.semester.toString() === semesterFilter;

    return matchesSearch && matchesBranch && matchesSemester;
  });

  const uniqueBranches = Array.from(new Set(subjects.map(s => s.branch._id)))
    .map(branchId => subjects.find(s => s.branch._id === branchId)?.branch)
    .filter(Boolean);

  const uniqueSemesters = Array.from(new Set(subjects.map(s => s.semester))).sort((a, b) => a - b);

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subjects Management</h1>
        <p className="text-gray-600">Manage all subjects across all branches</p>
      </div>

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
              placeholder="Search subjects..."
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
              <option key={branch!._id} value={branch!._id}>
                {branch!.name} ({branch!.code})
              </option>
            ))}
          </select>
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Semesters</option>
            {uniqueSemesters.map((semester) => (
              <option key={semester} value={semester.toString()}>
                Semester {semester}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSubjects.map((subject) => (
          <div key={subject._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{subject.name}</h3>
                <p className="text-sm text-gray-500 font-mono">{subject.code}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                  <span>{subject.credits} Credits</span>
                  <span>Sem {subject.semester}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  subject.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {subject.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Branch</span>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{subject.branch.name}</p>
                  <p className="text-xs text-gray-500">{subject.branch.code}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Faculty</span>
                <div className="text-right">
                  {subject.faculty ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{subject.faculty.name}</p>
                      <p className="text-xs text-gray-500">{subject.faculty.email}</p>
                    </>
                  ) : (
                    <span className="text-sm text-red-600">Not Assigned</span>
                  )}
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Feedback</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{subject.totalFeedback} responses</p>
                    {subject.totalFeedback > 0 && (
                      <div className="flex items-center justify-end space-x-1">
                        <span className={`text-sm font-medium ${getRatingColor(subject.averageRating)}`}>
                          {subject.averageRating.toFixed(1)}
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(subject.averageRating) ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex space-x-2">
                <button className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors">
                  View Details
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSubjects.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search criteria.' : 'No subjects match the current filters.'}
          </p>
        </div>
      )}
    </div>
  );
}
