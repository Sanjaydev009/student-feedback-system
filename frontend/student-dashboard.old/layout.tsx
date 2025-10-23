'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { decodeToken } from '@/utils/auth';
import StudentNavbar from '@/components/StudentNavbar';
import { ToastProvider } from '@/components/ToastProvider';

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = decodeToken(token);
      
      // Check if user is a student
      if (decoded.role !== 'student') {
        // Redirect to appropriate dashboard based on role
        switch (decoded.role) {
          case 'admin':
            router.push('/admin-dashboard');
            break;
          case 'hod':
            router.push('/hod-dashboard');
            break;
          case 'dean':
            router.push('/dean-dashboard');
            break;
          case 'faculty':
            router.push('/faculty-dashboard');
            break;
          default:
            router.push('/login');
        }
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [router]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render the student dashboard if authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ToastProvider>
          {children}
        </ToastProvider>
      </div>
    );
  }

  // This should not be reached, but return null as fallback
  return null;
}