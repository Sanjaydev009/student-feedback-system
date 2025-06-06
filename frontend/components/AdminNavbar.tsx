'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminNavbar() {
  const router = useRouter();
  const [role, setRole] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }

    try {
      const decoded: any = JSON.parse(atob(storedToken.split('.')[1]));
      if (decoded.role !== 'admin') {
        router.push('/');
      }
      setRole(decoded.role);
    } catch (err) {
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">Student Feedback Admin</h1>
        <ul className="flex space-x-6">
          <li><Link href="/admin-dashboard" className="hover:underline">Dashboard</Link></li>
          <li><Link href="/admin-dashboard/subjects" className="hover:underline">Subjects</Link></li>
          <li><Link href="/admin-dashboard/reports" className="hover:underline">Reports</Link></li>
          <li>
            <button
              onClick={handleLogout}
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}