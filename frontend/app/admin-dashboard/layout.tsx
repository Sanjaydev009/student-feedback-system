'use client';

import { useState, useEffect } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import AdminSidebar from '@/components/AdminSidebar';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle the sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar onMenuClick={toggleSidebar} />
      <div className="flex">
        <AdminSidebar isOpen={sidebarOpen} currentPath={pathname} onClose={() => setSidebarOpen(false)} />
        <main className={`flex-1 pt-24 transition-all duration-300 ease-in-out ${mounted ? 'lg:ml-72' : ''}`}>
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
