'use client';

import Link from 'next/link';

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-blue-800 text-white h-full fixed left-0 top-0 pt-16">
      <nav className="p-4 space-y-4">
        <Link href="/admin-dashboard" className="block py-2 px-4 hover:bg-blue-700 rounded">Dashboard</Link>
        <Link href="/admin/subjects" className="block py-2 px-4 hover:bg-blue-700 rounded">Manage Subjects</Link>
        <Link href="/admin/users" className="block py-2 px-4 hover:bg-blue-700 rounded">Manage Users</Link>
        <Link href="/admin/reports" className="block py-2 px-4 hover:bg-blue-700 rounded">Reports</Link>
        <Link href="/admin/settings" className="block py-2 px-4 hover:bg-blue-700 rounded">Settings</Link>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}
          className="w-full text-left py-2 px-4 mt-4 bg-red-600 hover:bg-red-700 rounded"
        >
          Logout
        </button>
      </nav>
    </aside>
  );
}