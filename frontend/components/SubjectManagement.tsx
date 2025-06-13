'use client';

import { useState, useEffect } from 'react';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  questions: string[];
}

interface Props {
  token: string; // ✅ Defined explicitly
}

export default function SubjectManagement({ token }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState({
    name: '',
    code: '',
    instructor: '',
    questions: ['', '', '', '', '', '', '', '', '', '']
  });

  // Load subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/subjects', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        setSubjects(data);
      } catch (err) {
        console.error('Failed to load subjects');
      }
    };
    fetchSubjects();
  }, [token]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Handle question changes
  const handleQuestionChange = (
    index: number,
    value: string
  ) => {
    const updated = [...form.questions];
    updated[index] = value;
    setForm({ ...form, questions: updated });
  };

  // Submit new subject
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5001/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const newSubject = await res.json();
      setSubjects([...subjects, newSubject]);
      setForm({
        name: '',
        code: '',
        instructor: '',
        questions: ['', '', '', '', '', '', '', '', '', '']
      });
    } catch (err) {
      alert('Failed to add subject');
    }
  };

  return (
    <div className="bg-white shadow rounded p-6">
      <h3 className="text-lg font-semibold mb-4">Add New Subject</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Subject Name"
            className="p-2 border rounded mt-1"
            required
          />
          <input
            name="code"
            value={form.code}
            onChange={handleChange}
            placeholder="Subject Code"
            className="p-2 border rounded mt-1"
            required
          />
          <input
            name="instructor"
            value={form.instructor}
            onChange={handleChange}
            placeholder="Instructor"
            className="p-2 border rounded mt-1"
            required
          />
        </div>

        <h4 className="mt-4 font-medium">Questions</h4>
        {form.questions.map((q, index) => (
          <input
            key={index}
            type="text"
            value={q}
            onChange={(e) => handleQuestionChange(index, e.target.value)}
            placeholder={`Question ${index + 1}`}
            className="w-full p-2 border rounded mt-1"
          />
        ))}

        <button
          type="submit"
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Add Subject
        </button>
      </form>
    </div>
  );
}