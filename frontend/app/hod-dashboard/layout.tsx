'use client';

import HODNavbar from '@/components/HODNavbar';
import HODSidebar from '@/components/HODSidebar';
import { ToastProvider } from '@/components/ToastProvider';

export default function HODDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <HODNavbar />
        <div className="flex">
          <HODSidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
