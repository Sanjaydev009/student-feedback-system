'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminNavbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <nav className="bg-blue-700 text-white shadow-md mb-6">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <ul className="flex space-x-6">
          <li><Link href="/admin-dashboard">Dashboard</Link></li>
          <li><Link href="/admin-dashboard/subjects">Manage Subjects</Link></li>
          <li><Link href="/admin-dashboard/users">Manage Users</Link></li>
          <li><Link href="/admin-dashboard/reports">Reports</Link></li>
          <li>
            <button onClick={handleLogout} className="hover:text-red-200 transition">
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}