'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'hod' | 'dean' | 'admin';
}

interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'student'
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Check if user is admin
  useEffect(() => {
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      window.location.href = '/login';
      return;
    }

    try {
      const decoded: DecodedToken = JSON.parse(atob(storedToken.split('.')[1]));
      if (decoded.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setToken(storedToken);
      fetchUsers(storedToken);
    } catch (err) {
      alert('Invalid token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, []);

  // Fetch all users safely
  const fetchUsers = async (token: string) => {
    try {
      const res = await fetch('http://localhost:5001/api/auth/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // ✅ Only parse JSON if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received HTML instead of JSON - likely not authenticated');
      }

      if (!res.ok) {
        throw new Error('Failed to load users');
      }

      const data = await res.json();
      setUsers(data);
      setFilteredUsers(data.filter((user: User) => user.role === 'student'));
    } catch (err: any) {
      console.error('Fetch Users Error:', err.message);
      alert('Failed to load users. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  // Filter by role
  const handleTabClick = (role: User['role']) => {
    setFilteredUsers(users.filter((user) => user.role === role));
  };

  // Form input handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Submit new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Received HTML instead of JSON during user add');
      }

      const newUser = await res.json();
      setUsers([...users, newUser]);
      setFilteredUsers([...users].filter(u => u.role === form.role));
      setForm({ name: '', email: '', role: 'student' });
    } catch (err) {
      alert('Failed to add user');
    }
  };

  // Edit user
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role
    });
  };

  // Save edited user
  const handleUpdate = async () => {
    if (!editingUser || !token) return;

    try {
      const res = await fetch(`http://localhost:5001/api/auth/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Received HTML instead of JSON during update');
      }

      const updatedUser = await res.json();
      const updatedList = users.map(u =>
        u._id === updatedUser._id ? updatedUser : u
      );
      setUsers(updatedList);
      setFilteredUsers(updatedList.filter(u => u.role === form.role));
      setEditingUser(null);
      setForm({ name: '', email: '', role: 'student' });
    } catch (err) {
      alert('Failed to update user');
    }
  };

  // Delete user
  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`http://localhost:5001/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to delete user');

      const updatedList = users.filter((u) => u._id !== userId);
      setUsers(updatedList);
      setFilteredUsers(filteredUsers.filter((u) => u._id !== userId));
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />

      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">User Management</h1>

        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => handleTabClick('student')}
            className={`py-2 px-4 text-blue-600 border-b-2 ${
              filteredUsers.some(u => u.role === 'student')
                ? 'border-blue-600'
                : 'border-transparent'
            } font-medium`}
          >
            Students
          </button>
          <button
            onClick={() => handleTabClick('faculty')}
            className="py-2 px-4 text-gray-600 hover:text-green-600 ml-4"
          >
            Faculty
          </button>
          <button
            onClick={() => handleTabClick('hod')}
            className="py-2 px-4 text-gray-600 hover:text-yellow-600 ml-4"
          >
            HOD
          </button>
          <button
            onClick={() => handleTabClick('dean')}
            className="py-2 px-4 text-gray-600 hover:text-purple-600 ml-4"
          >
            Dean
          </button>
          <button
            onClick={() => handleTabClick('admin')}
            className="py-2 px-4 text-gray-600 hover:text-red-600 ml-4"
          >
            Admins
          </button>
        </div>

        {/* Add/Edit User Form */}
        <form onSubmit={handleAddUser} className="bg-white shadow rounded p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded mt-1"
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded mt-1"
              />
            </div>
            <div>
              <label>Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full p-2 border rounded mt-1"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="hod">HOD</option>
                <option value="dean">Dean</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex space-x-4">
            {editingUser ? (
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
                Add User
              </button>
            )}
            {editingUser && (
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setForm({ name: '', email: '', role: 'student' });
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Role</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">{user.name}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4 capitalize">{user.role}</td>
                    <td className="py-3 px-4 space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>{' '}
                      <button
                        onClick={() => handleDelete(user._id)}
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
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Export CSV Button */}
        <button
          onClick={() => {
            const csv = [
              ['Name', 'Email', 'Role'].join(','),
              ...filteredUsers.map(u => [u.name, u.email, u.role].join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'users.csv';
            a.click();
            window.URL.revokeObjectURL(url);
          }}
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
        >
          Export as CSV
        </button>
      </div>
    </div>
  );
}