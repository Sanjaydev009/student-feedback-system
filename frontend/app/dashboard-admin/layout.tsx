'use client';

import AdminNavbar from '@/components/AdminNavbar';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 ml-64 pt-16">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
