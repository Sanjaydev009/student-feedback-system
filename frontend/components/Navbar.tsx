'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DecodedToken {
  id: string;
  role: string;
}

export default function Navbar() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuth(true);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (err) {
        console.error('Failed to decode token');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">Student Feedback</h1>
        <ul className="flex space-x-4">
          {isAuth && userRole === 'student' && (
            <>
              <li><Link href="/subjects" className="hover:underline">Subjects</Link></li>
              <li><Link href="/my-feedback" className="hover:underline">My Feedback</Link></li>
            </>
          )}
          {isAuth && ['admin', 'faculty', 'hod', 'dean'].includes(userRole) && (
            <li><Link href={`/${userRole}-dashboard`} className="hover:underline">Dashboard</Link></li>
          )}
          <li>
            {isAuth ? (
              <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700">
                Logout
              </button>
            ) : (
              <Link href="/login" className="hover:underline">Login</Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}