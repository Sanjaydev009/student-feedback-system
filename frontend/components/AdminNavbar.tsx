'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <nav className="bg-blue-700 text-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {onMenuClick && (
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-1 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/admin-dashboard" className="px-3 py-2 rounded hover:bg-blue-600 transition">Dashboard</Link>
          <Link href="/admin-dashboard/subjects" className="px-3 py-2 rounded hover:bg-blue-600 transition">Subjects</Link>
          <Link href="/admin-dashboard/students" className="px-3 py-2 rounded hover:bg-blue-600 transition">Students</Link>
          <Link href="/admin-dashboard/reports" className="px-3 py-2 rounded hover:bg-blue-600 transition">Reports</Link>
          <button 
            onClick={handleLogout} 
            className="px-3 py-2 text-red-200 hover:bg-blue-800 rounded transition"
          >
            Logout
          </button>
        </div>
        
        <div className="md:hidden">
          <button 
            onClick={handleLogout} 
            className="p-1 rounded-md hover:bg-blue-800 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}