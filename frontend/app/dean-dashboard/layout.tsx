'use client';

import { useState } from 'react';
import DEANNavbar from '@/components/DEANNavbar';
import DEANSidebar from '@/components/DEANSidebar';
import { ToastProvider } from '@/components/ToastProvider';

export default function DEANDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <DEANNavbar />
        <div className="flex pt-16"> {/* Added padding top to account for fixed navbar */}
          <DEANSidebar isCollapsed={sidebarCollapsed} onToggleCollapse={handleToggleSidebar} />
          <main className={`flex-1 p-6 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
