'use client';

import { useEffect, useState } from 'react';
import { isAuthenticated } from '@/utils/auth';

export default function Home() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(isAuthenticated());
  }, []);

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Student Feedback System</h1>
      <p>You are {isAuth ? 'logged in' : 'not logged in'}.</p>
    </main>
  );
}