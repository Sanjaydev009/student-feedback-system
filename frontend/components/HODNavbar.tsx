'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HODNavbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <nav className="bg-indigo-700 text-white shadow-md mb-6">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">HOD Dashboard</h1>
        <ul className="flex space-x-6">
          <li><Link href="/hod-dashboard">Reports</Link></li>
          <li><Link href="/hod-dashboard/students">Students</Link></li>
          <li><Link href="/hod-dashboard/faculty">Faculty</Link></li>
          <li><button onClick={handleLogout} className="hover:text-red-200 transition">
              Logout
            </button></li>
        </ul>
      </div>
    </nav>
  );
}