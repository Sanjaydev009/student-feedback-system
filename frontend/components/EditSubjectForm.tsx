'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  department: string;
  year: number;
  term: number;
  branch: string;
  questions: string[];
}

// Define types for props
interface Props {
  token: string | null;
  onSuccess: () => void;
}

export default function EditSubjectForm({ token, onSuccess }: Props) {
  const params = useParams();
  const subjectId = params.id as string; // Ensure id is a string
  const [form, setForm] = useState<Subject>({
    _id: '',
    name: '',
    code: '',
    instructor: '',
    department: '',
    year: 1,
    term: 1,
    branch: 'MCA Regular',
    questions: ['', '', '', '', '', '', '', '', '', '']
  });

  // Fetch current subject on load
  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/subjects/${subjectId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Failed to load subject');
        }

        const data = await res.json();
        setForm(data);
      } catch (err) {
        alert('Failed to load subject data');
      }
    };

    if (subjectId && token) {
      fetchSubject();
    }
  }, [subjectId, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      const res = await fetch(`http://localhost:5001/api/subjects/${form._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        throw new Error('Failed to update subject');
      }

      alert('Subject updated successfully!');
      onSuccess(); // Refresh list
    } catch (err) {
      alert('Failed to update subject');
    }
  };

  return (
    <div className="mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Edit Subject</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Subject Name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          name="code"
          placeholder="Subject Code"
          value={form.code}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          name="instructor"
          placeholder="Instructor"
          value={form.instructor}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          name="department"
          placeholder="Department"
          value={form.department}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        <select
          name="year"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
          className="w-full p-2 border rounded"
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
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Term</option>
          <option value="1">Term 1</option>
          <option value="2">Term 2</option>
          <option value="3">Term 3</option>
          <option value="4">Term 4</option>
        </select>

        <select
          name="branch"
          value={form.branch}
          onChange={(e) => setForm({ ...form, branch: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Branch</option>
          <option value="MCA Regular">MCA Regular</option>
          <option value="MCA DS">MCA DS</option>
        </select>

        <h3 className="font-medium mt-4">Feedback Questions</h3>
        {form.questions.map((q, i) => (
          <input
            key={i}
            type="text"
            placeholder={`Question ${i + 1}`}
            value={q}
            onChange={(e) => handleQuestionChange(i, e.target.value)}
            className="w-full p-2 border rounded"
          />
        ))}

        <div className="mt-4 flex space-x-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}