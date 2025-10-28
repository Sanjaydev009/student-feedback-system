'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import UserFormModal from '@/components/UserFormModal';
import { motion } from 'framer-motion';

interface UserFormData {
  _id?: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'hod' | 'dean' | 'admin';
  rollNumber?: string;
  department?: string;
  branch?: string;
  year?: number;
  section?: string;
  term?: number;
  passwordResetRequired?: boolean;
}

interface User extends UserFormData {
  _id: string;
  passwordResetRequired: boolean;
  createdAt: string;
  department?: string;
  year?: number;
  section?: string;
  term?: number;
}

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showUserFormModal, setShowUserFormModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Debug: show configured API base URL and stored token
    try {
      // eslint-disable-next-line no-console
      console.log('API baseURL:', api.defaults.baseURL);
      // eslint-disable-next-line no-console
      console.log('Stored token:', typeof window !== 'undefined' ? localStorage.getItem('token') : 'no-window');
    } catch (e) {
      // ignore
    }

    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/auth/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await api.delete(`/api/auth/users/${userToDelete._id}`);
      setUsers(users.filter(user => user._id !== userToDelete._id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      showSuccessMessage('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };
  
  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setShowUserFormModal(true);
  };
  
  const handleCreateUser = () => {
    setUserToEdit(null); // Ensure we're creating, not editing
    setShowUserFormModal(true);
  };
  
  const handleUserFormSubmit = async (userData: UserFormData) => {
    setFormLoading(true);
    setError('');
    
    try {
      // Debug: log token/header before request
      try {
        // eslint-disable-next-line no-console
        console.log('Creating/updating user. Authorization header:', api.defaults.headers.common['Authorization']);
        // eslint-disable-next-line no-console
        console.log('localStorage token at submit:', typeof window !== 'undefined' ? localStorage.getItem('token') : 'no-window');
      } catch (e) {
        // ignore
      }
      if (userData._id) {
        // Update existing user
        const response = await api.put(`/api/auth/users/${userData._id}`, userData);
        setUsers(users.map(u => u._id === userData._id ? response.data : u));
        showSuccessMessage('User updated successfully');
      } else {
        // Create new user
        const response = await api.post('/api/auth/users', userData);
        setUsers([...users, response.data.user]);
        
        // Show success message with email status
        const emailStatus = response.data.emailSent 
          ? "✅ Login credentials sent via email" 
          : "⚠️ Email delivery failed - please share credentials manually";
        
        showSuccessMessage(`User created successfully. Temporary password: ${response.data.generatedPassword}. ${emailStatus}`);
      }
      
      setShowUserFormModal(false);
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.message || 'Failed to save user. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };
  
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    // Auto-hide after 5 seconds
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const filteredUsers = users.filter(user => {
    if (!user || !user.name || !user.email) return false;
    
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.rollNumber && user.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSection = sectionFilter === 'all' || user.section === sectionFilter;
    const matchesYear = yearFilter === 'all' || (user.year && user.year.toString() === yearFilter);
    const matchesBranch = branchFilter === 'all' || user.branch === branchFilter;
    
    return matchesSearch && matchesRole && matchesSection && matchesYear && matchesBranch;
  });

  // Get unique sections, years, and branches from users for filter dropdowns
  const availableSections = [...new Set(users.filter(user => user.section).map(user => user.section))].sort();
  const availableYears = [...new Set(users.filter(user => user.year).map(user => user.year!.toString()))].sort((a, b) => parseInt(a) - parseInt(b));
  const availableBranches = [...new Set(users.filter(user => user.branch).map(user => user.branch))].sort();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'dean': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'hod': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'faculty': return 'bg-green-100 text-green-800 border-green-200';
      case 'student': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage all system users and their permissions</p>
          </div>
          <div className="flex space-x-3 mt-4 lg:mt-0">
            <motion.button 
              onClick={handleCreateUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Add User
            </motion.button>
            <motion.button 
              onClick={() => router.push('/admin-dashboard/users/bulk-upload')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Bulk Upload
            </motion.button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Search by name, email, or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="hod">HOD</option>
            <option value="dean">Dean</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year === '1' ? '1st Year' : year === '2' ? '2nd Year' : year === '3' ? '3rd Year' : '4th Year'}
              </option>
            ))}
          </select>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Branches</option>
            {availableBranches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>
        
        {/* Second row for section filter and clear filters */}
        <div className="flex justify-between items-center">
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Sections</option>
            {availableSections.map(section => (
              <option key={section} value={section}>Section {section}</option>
            ))}
          </select>
          
          {/* Clear Filters Button */}
          {(searchTerm || roleFilter !== 'all' || sectionFilter !== 'all' || yearFilter !== 'all' || branchFilter !== 'all') && (
            <motion.button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setSectionFilter('all');
                setYearFilter('all');
                setBranchFilter('all');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Clear Filters
            </motion.button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600">{error}</div>
        </div>
      )}
      
      {/* Success Message */}
      {successMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="text-green-600">{successMessage}</div>
        </motion.div>
      )}

      {/* Statistics */}
      <div className="space-y-4">
        {/* Role Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {['all', 'student', 'faculty', 'hod', 'dean', 'admin'].map((role) => {
            const count = role === 'all' ? users.length : users.filter(u => u.role === role).length;
            return (
              <div key={role} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{role === 'all' ? 'Total Users' : `${role}s`}</div>
              </div>
            );
          })}
        </div>

        {/* Section Statistics */}
        {availableSections.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Students by Section</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {availableSections.map((section) => {
                const count = users.filter(u => u.section === section && u.role === 'student').length;
                return (
                  <div key={section} className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                    <div className="text-xl font-bold text-blue-900">{count}</div>
                    <div className="text-sm text-blue-700">Section {section}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Year Statistics */}
        {availableYears.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Students by Year</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableYears.map((year) => {
                const count = users.filter(u => u.year?.toString() === year && u.role === 'student').length;
                const yearLabel = year === '1' ? '1st Year' : year === '2' ? '2nd Year' : year === '3' ? '3rd Year' : '4th Year';
                return (
                  <div key={year} className="bg-green-50 rounded-lg border border-green-200 p-3">
                    <div className="text-xl font-bold text-green-900">{count}</div>
                    <div className="text-sm text-green-700">{yearLabel}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Branch Statistics */}
        {availableBranches.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Students by Branch</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableBranches.map((branch) => {
                const count = users.filter(u => u.branch === branch && u.role === 'student').length;
                return (
                  <div key={branch} className="bg-purple-50 rounded-lg border border-purple-200 p-3">
                    <div className="text-xl font-bold text-purple-900">{count}</div>
                    <div className="text-sm text-purple-700">{branch}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academic Details
                  <div className="text-xs font-normal text-gray-400 mt-1">Branch, Section, Year</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role || 'student')}`}>
                      {(user.role || 'student').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      {user.rollNumber && <div>📝 <span className="font-medium">Roll:</span> {user.rollNumber}</div>}
                      {user.department && <div>🏢 <span className="font-medium">Dept:</span> {user.department}</div>}
                      {user.branch && (
                        <div className="flex items-center gap-2">
                          <span>🎓 <span className="font-medium">Branch:</span> {user.branch}</span>
                          {user.section && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              Section {user.section}
                            </span>
                          )}
                        </div>
                      )}
                      {user.year && <div>📅 <span className="font-medium">Year:</span> {user.year}</div>}
                      {user.term && <div>📚 <span className="font-medium">Term:</span> {user.term}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.passwordResetRequired ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        Password Reset Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <motion.button 
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Edit
                      </motion.button>
                      <motion.button 
                        onClick={() => {
                          setUserToDelete(user);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 px-2 py-1 rounded"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Delete
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || roleFilter !== 'all' || sectionFilter !== 'all' || yearFilter !== 'all' || branchFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by adding your first user.'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete User</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete <strong>{userToDelete.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      <UserFormModal
        user={userToEdit}
        isOpen={showUserFormModal}
        onClose={() => setShowUserFormModal(false)}
        onSubmit={handleUserFormSubmit}
        isLoading={formLoading}
      />
    </div>
  );
}
