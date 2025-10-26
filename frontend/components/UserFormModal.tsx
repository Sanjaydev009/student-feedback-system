'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface UserFormModalProps {
  user?: UserFormData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: UserFormData) => void;
  isLoading: boolean;
}

export default function UserFormModal({ user, isOpen, onClose, onSubmit, isLoading }: UserFormModalProps) {
  const isEdit = !!user?._id;
  
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'student',
    rollNumber: '',
    department: '',
    branch: '',
    year: 1,
    section: '',
    term: 1
  });

  // Department-Branch-Section configuration for college structure
  const departmentConfig = {
    "Engineering": {
      branches: {
        "Computer Science": { years: [1, 2, 3, 4], sections: ['A'] },
        "AIML": { years: [1, 2, 3, 4], sections: ['A', 'B', 'C'] },
        "Electronics": { years: [1, 2, 3, 4], sections: ['A', 'B'] },
        "Mechanical": { years: [1, 2, 3, 4], sections: ['A', 'B'] },
        "Civil": { years: [1, 2, 3, 4], sections: ['A'] },
        "Electrical": { years: [1, 2, 3, 4], sections: ['A'] },
        "Information Technology": { years: [1, 2, 3, 4], sections: ['A', 'B'] },
        "Chemical": { years: [1, 2, 3, 4], sections: ['A'] },
        "Aerospace": { years: [1, 2, 3, 4], sections: ['A'] },
        "Biotechnology": { years: [1, 2, 3, 4], sections: ['A'] }
      }
    },
    "MCA": {
      branches: {
        "MCA Regular": { years: [1, 2], sections: ['A', 'B'] },
        "MCA DS": { years: [1, 2], sections: ['A'] }
      }
    },
    "MBA": {
      branches: {
        "MBA Finance": { years: [1, 2], sections: ['A'] },
        "MBA Marketing": { years: [1, 2], sections: ['A'] },
        "MBA HR": { years: [1, 2], sections: ['A'] }
      }
    }
  } as const;

  // Get available branches for selected department
  const getAvailableBranches = (department: string) => {
    const deptData = departmentConfig[department as keyof typeof departmentConfig];
    return deptData ? Object.keys(deptData.branches) : [];
  };

  // Get available years for selected department and branch
  const getAvailableYears = (department: string, branch: string) => {
    const deptData = departmentConfig[department as keyof typeof departmentConfig];
    if (!deptData) return [];
    const branchData = deptData.branches[branch as keyof typeof deptData.branches] as { years: number[], sections: string[] } | undefined;
    return branchData?.years || [];
  };

  // Get available sections for selected department and branch
  const getAvailableSections = (department: string, branch: string) => {
    const deptData = departmentConfig[department as keyof typeof departmentConfig];
    if (!deptData) return [];
    const branchData = deptData.branches[branch as keyof typeof deptData.branches] as { years: number[], sections: string[] } | undefined;
    return branchData?.sections || [];
  };

  // Reset form when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        _id: user._id,
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'student',
        rollNumber: user.rollNumber || '',
        department: user.department || '',
        branch: user.branch || '',
        year: user.year || 1,
        section: user.section || '',
        term: user.term || 1,
        passwordResetRequired: user.passwordResetRequired
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'student',
        rollNumber: '',
        department: '',
        branch: '',
        year: 1,
        section: '',
        term: 1
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'year' || name === 'term') {
      setFormData((prev: UserFormData) => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
    } else if (name === 'department') {
      // Reset branch and year when department changes
      setFormData((prev: UserFormData) => ({ 
        ...prev, 
        department: value,
        branch: '',
        year: undefined,
        section: '',
        term: undefined
      }));
    } else if (name === 'branch') {
      // Reset year when branch changes
      setFormData((prev: UserFormData) => ({ 
        ...prev, 
        branch: value,
        year: undefined,
        section: '',
        term: undefined
      }));
    } else {
      setFormData((prev: UserFormData) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Show role-specific fields based on selected role
  const showRoleSpecificFields = () => {
    switch (formData.role) {
      case 'student':
        return (
          <>
            <div className="mb-4">
              <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                id="rollNumber"
                name="rollNumber"
                value={formData.rollNumber || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                id="department"
                name="department"
                value={formData.department || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Department</option>
                {Object.keys(departmentConfig).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {formData.department && (
              <div className="mb-4">
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Branch</option>
                  {getAvailableBranches(formData.department).map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.department && formData.branch && (
              <div className="mb-4">
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  id="year"
                  name="year"
                  value={formData.year?.toString() || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Year</option>
                  {getAvailableYears(formData.department, formData.branch).map(year => (
                    <option key={year} value={year}>{year === 1 ? '1st Year' : year === 2 ? '2nd Year' : year === 3 ? '3rd Year' : '4th Year'}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.year && (
              <>
                <div className="mb-4">
                  <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <select
                    id="section"
                    name="section"
                    value={formData.section || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Section</option>
                    {formData.department && formData.branch && getAvailableSections(formData.department, formData.branch).map(section => (
                      <option key={section} value={section}>
                        Section {section} ({formData.branch}-{section})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-1">
                    Semester/Term
                  </label>
                  <select
                    id="term"
                    name="term"
                    value={formData.term?.toString() || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Term</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(term => (
                      <option key={term} value={term}>Semester {term}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </>
        );
      case 'faculty':
      case 'hod':
        return (
          <>
            <div className="mb-4">
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                id="department"
                name="department"
                value={formData.department || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Department</option>
                {Object.keys(departmentConfig).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            {formData.department && (
              <div className="mb-4">
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization/Branch
                </label>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Specialization</option>
                  {getAvailableBranches(formData.department).map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-white rounded-lg w-full max-w-md mx-4 p-6 shadow-xl"
        >
          <h2 className="text-xl font-bold mb-4 text-gray-900">{isEdit ? 'Edit User' : 'Add New User'}</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="hod">HOD</option>
                <option value="dean">Dean</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            {/* Role-specific fields */}
            {showRoleSpecificFields()}
            
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[100px]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="h-5 w-5 border-t-2 border-r-2 border-white rounded-full animate-spin inline-block mr-2"></span>
                ) : null}
                {isEdit ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
