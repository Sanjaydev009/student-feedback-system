'use client';

import { useState } from 'react';

interface Props {
  token: string | null;
  onSuccess: () => void;
}

export default function AddSubjectForm({ token, onSuccess }: Props) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    instructor: '',
    department: '',
    year: '',
    term: '',
    branch: 'MCA Regular',
    section: '',
    questions: ['', '', '', '', '', '', '', '', '', '']
  });

  // Branch-Section configuration
  const branchSectionConfig = {
    'Computer Science': ['A'],
    'AIML': ['A', 'B', 'C'],
    'Electronics': ['A', 'B'],
    'Mechanical': ['A', 'B'],
    'Civil': ['A'],
    'Information Technology': ['A', 'B'],
    'MCA Regular': ['A', 'B'],
    'MCA DS': ['A'],
    'MBA Finance': ['A'],
    'MBA Marketing': ['A'],
    'MBA HR': ['A']
  };

  const getAvailableSections = (branch: string) => {
    return branchSectionConfig[branch as keyof typeof branchSectionConfig] || [];
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'branch') {
      // Reset section when branch changes
      setForm({ ...form, [name]: value, section: '' });
    } else {
      setForm({ ...form, [name]: value });
    }
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

    try {
      const res = await fetch('http://localhost:5001/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to add subject');

      alert('Subject added successfully!');
      setForm({
        name: '',
        code: '',
        instructor: '',
        department: '',
        year: '',
        term: '',
        branch: 'MCA Regular',
        section: '',
        questions: ['', '', '', '', '', '', '', '', '', '']
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Failed to add subject');
      console.error('Add subject error:', err.message);
    }
  };

  return (
    <div className="mt-8 bg-white p-6 rounded shadow">
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
          placeholder="Subject Code (e.g., CS201)"
          value={form.code}
          onChange={handleChange}
          className="w-full p-2 border rounded mt-1"
          required
        />
        <input
          type="text"
          name="instructor"
          placeholder="Instructor"
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
          onChange={handleChange}
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
          onChange={handleChange}
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
          onChange={handleChange}
          className="w-full p-2 border rounded mt-1"
          required
        >
          <option value="">Select Branch</option>
          <option value="Computer Science">Computer Science</option>
          <option value="AIML">AIML (Artificial Intelligence & Machine Learning)</option>
          <option value="Electronics">Electronics</option>
          <option value="Mechanical">Mechanical</option>
          <option value="Civil">Civil</option>
          <option value="Information Technology">Information Technology</option>
          <option value="MCA Regular">MCA Regular</option>
          <option value="MCA DS">MCA DS</option>
          <option value="MBA Finance">MBA Finance</option>
          <option value="MBA Marketing">MBA Marketing</option>
          <option value="MBA HR">MBA HR</option>
        </select>

        {/* Section Selection */}
        {form.branch && (
          <select
            name="section"
            value={form.section}
            onChange={handleChange}
            className="w-full p-2 border rounded mt-1"
            required
          >
            <option value="">Select Section</option>
            {getAvailableSections(form.branch).map(section => (
              <option key={section} value={section}>
                Section {section} ({form.branch}-{section})
              </option>
            ))}
          </select>
        )}

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
  );
}