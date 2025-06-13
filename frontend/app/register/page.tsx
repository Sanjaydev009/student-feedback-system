'use client';

import { useState } from 'react';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    rollNumber: '',
    email: '',
    password: '',
    role: 'student',
    branch: 'MCA Regular'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      window.location.href = '/subjects';
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="rollNumber"
            placeholder="Roll Number"
            value={form.rollNumber}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />

          {/* Branch Selection */}
          <select
            name="branch"
            value={form.branch}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="MCA Regular">MCA Regular</option>
            <option value="MCA DS">MCA DS</option>
          </select>

          <button
            type="submit"
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}