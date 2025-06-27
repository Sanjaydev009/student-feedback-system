'use client';

import DEANNavbar from '@/components/DEANNavbar';
import DEANSidebar from '@/components/DEANSidebar';
import { ToastProvider } from '@/components/ToastProvider';

export default function DEANDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <DEANNavbar />
        <div className="flex">
          <DEANSidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
