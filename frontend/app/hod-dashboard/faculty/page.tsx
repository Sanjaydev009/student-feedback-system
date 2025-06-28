'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';

interface Faculty {
  _id: string;
  name: string;
  email: string;
  branch: string;
  role: string;
  createdAt: string;
}

export default function HODFaculty() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/hod/faculty');
      setFaculty(response.data);
    } catch (error: any) {
      console.error('Error fetching faculty:', error);
      if (error.response?.status === 403) {
        showToast('Access denied. HOD role required.', 'error');
        router.push('/login');
      } else {
        showToast('Failed to load faculty data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter faculty based on search term
  const filteredFaculty = faculty.filter(fac => 
    fac.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fac.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Faculty Management</h1>
        <p className="text-green-100">View department faculty members</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search faculty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <svg className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Faculty List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculty.length > 0 ? (
          filteredFaculty.map((fac) => (
            <div key={fac._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-3 rounded-full mr-4">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{fac.name}</h3>
                      <p className="text-sm text-gray-600">{fac.email}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Branch:</span>
                    <span className="font-medium text-gray-900">{fac.branch}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Role:</span>
                    <span className="font-medium text-green-600">Faculty</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No faculty members found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
