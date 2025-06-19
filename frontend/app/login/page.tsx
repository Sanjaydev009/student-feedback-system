'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  role: string;
  branch?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const contentType = res.headers.get('content-type');

      if (!contentType?.includes('application/json')) {
        throw new Error('Received HTML instead of JSON - likely server error');
      }

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Login failed. Check credentials.');
        return;
      }

      localStorage.setItem('token', data.token);

      // Decode token
      const decoded: any = JSON.parse(atob(data.token.split('.')[1]));

      if (decoded.role === 'admin') {
        router.push('/admin-dashboard');
      } else if (decoded.role === 'student') {
        // router.push('/subjects');
        window.location.href = '/subjects';
      } else {
        router.push('/');
      }
    } catch (err: any) {
      console.error('Login error:', err.message);
      alert('Login failed: ' + (err.message.includes('JSON') ? 'Authentication failed' : 'Check if backend is running'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Student Feedback Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded mb-4"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded mb-6"
          required
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Login
        </button>

        <h3 className="mt-4 text-center">
          Don't have an account?{' '}
          <button
            onClick={() => router.push('/register')}
            className="text-blue-600 hover:underline"
          >
            Register
          </button>
        </h3>
      </div>
    </div>
  );
}