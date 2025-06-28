'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  department: string;
  semester: number;
  branch: string;
  questions: string[];
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    code: '',
    instructor: '',
    department: '',
    semester: '',
    branch: 'MCA Regular',
    questions: ['', '', '', '', '', '', '', '', '', '']
  });
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Check login status and decode role
  useEffect(() => {
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      window.location.href = '/login';
      return;
    }

    try {
      const decoded: any = JSON.parse(atob(storedToken.split('.')[1]));
      if (decoded.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setToken(storedToken);
      fetchInitialData(storedToken);
    } catch (err: any) {
      alert('Invalid token. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, []);

  // Load subjects
  const fetchInitialData = async (token: string) => {
    await fetchSubjects(token);
  };

  const fetchSubjects = async (token: string) => {
    try {
      const res = await fetch('http://localhost:5001/api/subjects', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const contentType = res.headers.get('content-type');

      if (!contentType?.includes('application/json')) {
        throw new Error('Received HTML instead of JSON - likely not authenticated');
      }

      const data = await res.json();
      setSubjects(data);
    } catch (err: any) {
      console.error('Fetch Subjects Error:', err.message);
      alert(err.message || 'Failed to load subjects');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (value === 'MCA Regular' || value === 'MCA DS') {
      setForm({ ...form, branch: value });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Submit new subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasEmpty = form.questions.some(q => q.trim() === '');
    if (hasEmpty) {
      alert('Please fill all 10 questions');
      return;
    }

    if (!token) {
      alert('Session expired. Please log in again.');
      window.location.href = '/login';
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

      const contentType = res.headers.get('content-type');

      if (!contentType?.includes('application/json')) {
        throw new Error('Received HTML instead of JSON during registration');
      }

      const newSubject = await res.json();
      setSubjects([...subjects, newSubject]);
      setForm({
        name: '',
        code: '',
        instructor: '',
        department: '',
        semester: '',
        branch: 'MCA Regular',
        questions: ['', '', '', '', '', '', '', '', '', '']
      });
    } catch (err: any) {
      alert(err.message || 'Failed to add subject');
    }
  };

  // Edit subject
  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setForm({
      name: subject.name,
      code: subject.code,
      instructor: subject.instructor,
      department: subject.department,
      semester: String(subject.semester),
      branch: subject.branch,
      questions: [...subject.questions]
    });
  };

  // Save edited subject
  const handleUpdate = async () => {
    if (!editingSubject || !token) return;

    try {
      const res = await fetch(`http://localhost:5001/api/subjects/${editingSubject._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const updatedSubject = await res.json();
      const updatedList = subjects.map(s =>
        s._id === updatedSubject._id ? updatedSubject : s
      );
      setSubjects(updatedList);
      setEditingSubject(null);
      setForm({
        name: '',
        code: '',
        instructor: '',
        department: '',
        semester: '',
        branch: 'MCA Regular',
        questions: ['', '', '', '', '', '', '', '', '', '']
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update subject');
    }
  };

  // Delete subject
  const handleDelete = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject? This action cannot be undone.')) return;
    
    if (!token) {
      alert('Session expired. Please log in again.');
      window.location.href = '/login';
      return;
    }

    try {
      console.log('Attempting to delete subject with ID:', subjectId);
      
      // First try normal delete
      let res = await fetch(`http://localhost:5001/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let responseData;
      
      // Get JSON response if available
      try {
        const clonedRes = res.clone();
        responseData = await clonedRes.json();
      } catch (e) {
        console.log('Response is not JSON:', e);
      }
      
      // If it fails due to feedback entries, ask user if they want to force delete
      if (res.status === 400 && responseData?.message && responseData.message.includes('feedback entries')) {
        console.log('Feedback entries exist for this subject');
        
        const forceDelete = confirm(
          'This subject has feedback entries associated with it. Do you want to delete it anyway? ' +
          'This will also delete all associated feedback data.'
        );
        
        if (forceDelete) {
          console.log('Force deleting subject and its feedback...');
          res = await fetch(`http://localhost:5001/api/subjects/${subjectId}?force=true`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Get new response data
          try {
            responseData = await res.json();
          } catch (e) {
            console.log('Force delete response is not JSON');
          }
        } else {
          throw new Error('Operation canceled by user');
        }
      }

      console.log('Delete response status:', res.status);
      console.log('Response data:', responseData);

      // Check if the operation was successful
      if (!res.ok) {
        // Handle error with the parsed data if available
        const errorMessage = responseData?.message || 'Failed to delete subject';
        throw new Error(errorMessage);
      }

      console.log('Delete successful!');
      
      // Only update the UI if the server request was successful
      const updatedList = subjects.filter(s => s._id !== subjectId);
      setSubjects(updatedList);
      alert('Subject deleted successfully!');
      
    } catch (err: any) {
      console.error('Delete Subject Error:', err.message);
      alert(err.message || 'Failed to delete subject. Please try again.');
    }
  };

  if (loading) return <p>Loading subjects...</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />

      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Subject Management</h1>

        {/* Add New Subject Form */}
        <form onSubmit={handleAddSubject} className="bg-white shadow rounded p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Subject Name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded mt-1"
            />
            <input
              type="text"
              name="code"
              placeholder="Subject Code (e.g., CS101)"
              value={form.code}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded mt-1"
            />
            <input
              type="text"
              name="instructor"
              placeholder="Instructor Name"
              value={form.instructor}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded mt-1"
            />
            <input
              type="text"
              name="department"
              placeholder="Department"
              value={form.department}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded mt-1"
            />
            <input
              type="number"
              name="semester"
              placeholder="Semester"
              value={form.semester}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded mt-1"
            />
            <select
              name="branch"
              value={form.branch}
              onChange={handleChange}
              className="w-full p-2 border rounded mt-1"
            >
              <option value="MCA Regular">MCA Regular</option>
              <option value="MCA DS">MCA DS</option>
            </select>
          </div>

          <h3 className="font-medium mt-4">Feedback Questions (10 Required)</h3>
          {form.questions.map((q, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Question ${i + 1}`}
              value={q}
              onChange={(e) => {
                const updated = [...form.questions];
                updated[i] = e.target.value;
                setForm({ ...form, questions: updated });
              }}
              className="w-full p-2 border rounded mt-1"
            />
          ))}

          <div className="mt-4 flex space-x-4">
            {editingSubject ? (
              <button
                type="button"
                onClick={handleUpdate}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              >
                Update
              </button>
            ) : (
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                Add Subject
              </button>
            )}
            {editingSubject && (
              <button
                type="button"
                onClick={() => {
                  setEditingSubject(null);
                  setForm({
                    name: '',
                    code: '',
                    instructor: '',
                    department: '',
                    semester: '',
                    branch: 'MCA Regular',
                    questions: ['', '', '', '', '', '', '', '', '', '']
                  });
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Subjects Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Code</th>
                <th className="py-3 px-4 text-left">Instructor</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length > 0 ? (
                subjects.map((subject) => (
                  <tr key={subject._id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">{subject.name}</td>
                    <td className="py-3 px-4">{subject.code}</td>
                    <td className="py-3 px-4">{subject.instructor}</td>
                    <td className="py-3 px-4 space-x-2">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>{' '}
                      <button
                        onClick={() => handleDelete(subject._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    No subjects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}