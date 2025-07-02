'use client';

import { useState } from 'react';
import AdminNavbar from '@/components/AdminNavbar';

interface Props {
  onSuccess?: () => void;
}

export default function AddSubjectForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    instructor: '',
    department: '',
    year: 1,
    term: 1,
    branch: 'MCA Regular',
    questions: ['', '', '', '', '', '', '', '', '', '']
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleQuestionChange = (index: number, value: string) => {
    const updated = [...form.questions];
    updated[index] = value;
    setForm({ ...form, questions: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasEmpty = form.questions.some(q => q.trim() === '');
    if (hasEmpty) {
      alert('Please fill all 10 questions');
      return;
    }

    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      alert('Session expired. Please log in again.');
      window.location.href = '/login';
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`
        },
        body: JSON.stringify(form)
      });

      const contentType = res.headers.get('content-type');

      if (!contentType?.includes('application/json')) {
        throw new Error('Received HTML instead of JSON - likely not authenticated');
      }

      const data = await res.json();

      alert('Subject added successfully!');
      setForm({
        name: '',
        code: '',
        instructor: '',
        department: '',
        year: 1,
        term: 1,
        branch: 'MCA Regular',
        questions: ['', '', '', '', '', '', '', '', '', '']
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <AdminNavbar />

      <div className="bg-white p-6 rounded shadow max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Add New Subject</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="name"
            placeholder="Subject Name"
            value={form.name}
            onChange={handleChange}
            className="w-full p-2 border rounded mt-1"
            required
          />
          <input
            type="text"
            name="code"
            placeholder="Subject Code (e.g., CS101)"
            value={form.code}
            onChange={handleChange}
            className="w-full p-2 border rounded mt-1"
            required
          />
          <input
            type="text"
            name="instructor"
            placeholder="Instructor Name"
            value={form.instructor}
            onChange={handleChange}
            className="w-full p-2 border rounded mt-1"
            required
          />
          <input
            type="text"
            name="department"
            placeholder="Department"
            value={form.department}
            onChange={handleChange}
            className="w-full p-2 border rounded mt-1"
            required
          />
          <select
            name="year"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
            className="w-full p-2 border rounded mt-1"
            required
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
          </select>
          
          <select
            name="term"
            value={form.term}
            onChange={(e) => setForm({ ...form, term: parseInt(e.target.value) })}
            className="w-full p-2 border rounded mt-1"
            required
          >
            <option value="">Select Term</option>
            <option value="1">Term 1</option>
            <option value="2">Term 2</option>
            <option value="3">Term 3</option>
            <option value="4">Term 4</option>
          </select>

          {/* Branch Selection */}
          <select
            name="branch"
            value={form.branch}
            onChange={(e) => setForm({ ...form, branch: e.target.value })}
            className="w-full p-2 border rounded mt-1"
            required
          >
            <option value="">Select Branch</option>
            <option value="MCA Regular">MCA Regular</option>
            <option value="MCA DS">MCA DS</option>
          </select>

          <h3 className="font-medium mt-4">Feedback Questions (10 Required)</h3>
          {form.questions.map((q, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Question ${i + 1}`}
              value={q}
              onChange={(e) => handleQuestionChange(i, e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          ))}

          <button
            type="submit"
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Add Subject
          </button>
        </form>
      </div>
    </div>
  );
}