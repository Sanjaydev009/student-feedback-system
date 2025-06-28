'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import HODNavbar from '@/components/HODNavbar';
import HODSidebar from '@/components/HODSidebar';
import { ToastProvider } from '@/components/ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';

export default function HODDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile closed by default
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      window.location.href = '/login';
      return;
    }

    try {
      const decoded: any = JSON.parse(atob(storedToken.split('.')[1]));
      if (decoded.role !== 'hod') {
        // Redirect with error message
        localStorage.setItem('loginError', 'Only HODs can access this page');
        window.location.href = '/login';
        return;
      }

      setToken(storedToken);
      // Add a small delay to show loading animation
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (err) {
      localStorage.setItem('loginError', 'Invalid or expired token. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, []);

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return null; // Will redirect in useEffect
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <HODNavbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex pt-16">
          {/* Sidebar - AnimatePresence for mobile animation */}
          <AnimatePresence>
            {(sidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="lg:block"
              >
                <HODSidebar 
                  isOpen={sidebarOpen} 
                  currentPath={pathname} 
                  onClose={() => setSidebarOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main Content */}
          <motion.main 
            className="flex-1 lg:ml-64 p-4 md:p-8 min-h-screen w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </motion.main>
        </div>
      </div>
    </ToastProvider>
  );
}
