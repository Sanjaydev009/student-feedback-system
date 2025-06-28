'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { decodeToken } from '@/utils/auth';
import api from '@/utils/api';

export default function StudentNavbar() {
  const router = useRouter();
  const [studentName, setStudentName] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // First try to get name from the token directly
        const decoded = decodeToken(token);
        if (decoded.name) {
          setStudentName(decoded.name);
        } else {
          // If name is not in token, fetch from API
          fetchUserProfile();
        }
      } catch (error) {
        console.error('Failed to decode token', error);
        fetchUserProfile(); // Fallback to API call
      }
    }
  }, []);
  
  // Fetch user profile from API if needed
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.data && response.data.name) {
        setStudentName(response.data.name);
      } else {
        setStudentName('Student'); // Default fallback
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setStudentName('Student'); // Default fallback
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-7 w-7 mr-3" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.168 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            <h1 className="text-xl font-bold">Student Feedback</h1>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/subjects" className="nav-link font-medium">Subjects</Link>
            <Link href="/my-feedback" className="nav-link font-medium">My Feedback</Link>
            <div className="flex items-center ml-6">
              <span className="mr-4 text-sm opacity-90">{studentName}</span>
              <button 
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-medium"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              className="text-white focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-2 border-t border-blue-500 mt-3">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/subjects" 
                className="py-2 px-1 hover:bg-blue-700 rounded transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Subjects
              </Link>
              <Link 
                href="/my-feedback" 
                className="py-2 px-1 hover:bg-blue-700 rounded transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                My Feedback
              </Link>
              <div className="pt-2 border-t border-blue-500">
                <p className="text-sm text-blue-200 mb-2">{studentName}</p>
                <button 
                  onClick={handleLogout}
                  className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}