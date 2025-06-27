'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import AdminSidebar from '@/components/AdminSidebar';
import { ToastProvider } from '@/components/ToastProvider';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile closed by default
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      window.location.href = '/login';
      return;
    }

    try {
      const decoded: any = JSON.parse(atob(storedToken.split('.')[1]));
      if (decoded.role !== 'admin') {
        // Redirect with error message
        localStorage.setItem('loginError', 'Only admins can access this page');
        window.location.href = '/login';
        return;
      }

      setToken(storedToken);
    } catch (err) {
      localStorage.setItem('loginError', 'Invalid or expired token. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, []);

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen">
        <AdminNavbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex pt-16"> {/* Add top padding for fixed navbar */}
          {/* Sidebar */}
          <AdminSidebar 
            isOpen={sidebarOpen} 
            currentPath={pathname} 
            onClose={() => setSidebarOpen(false)}
          />
          
          {/* Main Content - Always account for sidebar on desktop */}
          <main className="flex-1 lg:ml-64 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
