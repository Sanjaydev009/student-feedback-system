'use client';

import { useEffect, useState } from 'react';
import AdminNavbar from '@/components/AdminNavbar';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  department: string;
  year: number;
  term: number;
  branch: string[];
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
    year: '',
    term: '',
    branch: [] as string[],
    questions: ['', '', '', '', '', '', '', '', '', '']
  });
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [autoQuestionsEnabled, setAutoQuestionsEnabled] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('teaching');
  
  // Predefined question templates
  const questionTemplates = {
    teaching: [
      "How would you rate the teaching methodology for this subject?",
      "How effective were the lectures in explaining complex concepts?",
      "How well did the instructor respond to student questions?",
      "How well-organized was the course material?",
      "How accessible was the instructor outside of class hours?",
      "How fair were the assignments and exams for this subject?",
      "How useful were the practical exercises or lab sessions?",
      "How relevant was the course content to real-world applications?",
      "How effectively did the instructor use examples to clarify concepts?",
      "How would you rate the overall quality of this course?"
    ],
    technical: [
      "How well did the lab sessions help you understand the theoretical concepts?",
      "How effective were the programming assignments in building practical skills?",
      "How would you rate the quality of technical resources provided?",
      "How well did the course prepare you for industry-standard technologies?",
      "How relevant were the projects to current industry practices?",
      "How effectively did the instructor demonstrate technical concepts?",
      "How would you rate the balance between theory and practical application?",
      "How accessible were the technical tools and resources needed for this course?",
      "How well did the course cover emerging trends in this field?",
      "How would you rate your confidence in applying these skills after completion?"
    ],
    academic: [
      "How well does this subject align with your academic goals?",
      "How effective is the curriculum in covering essential concepts?",
      "How would you rate the quality of learning materials provided?",
      "How fair and transparent is the evaluation system for this subject?",
      "How would you rate the difficulty level of this subject?",
      "How well does this subject build upon your previous knowledge?",
      "How effectively does this course develop critical thinking skills?",
      "How satisfied are you with the pace of instruction in this subject?",
      "How well-integrated are the theoretical and practical components?",
      "How would you rate the overall learning experience in this subject?"
    ]
  };

  // Apply auto-generated questions
  const applyAutoQuestions = () => {
    if (autoQuestionsEnabled) {
      let questionsToUse;
      
      if (selectedTemplate === 'mixed') {
        // Create a mixed set of questions from all templates
        const allTemplates = Object.values(questionTemplates).flat();
        const shuffled = [...allTemplates].sort(() => 0.5 - Math.random());
        questionsToUse = shuffled.slice(0, 10);
      } else {
        questionsToUse = questionTemplates[selectedTemplate as keyof typeof questionTemplates];
      }
      
      // Customize questions with subject name if available
      let customizedQuestions = [...questionsToUse];
      if (form.name) {
        customizedQuestions = customizedQuestions.map(q => {
          return q.replace(/this subject|the course|this course/gi, form.name);
        });
      }
      
      setForm({
        ...form,
        questions: customizedQuestions
      });
    }
  };

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
      fetchSubjects(storedToken);
    } catch (err: any) {
      alert('Invalid token. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, []);

  // Load subjects
  const fetchSubjects = async (token: string) => {
    try {
      const res = await fetch('http://localhost:5001/api/subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSubjects(data);
    } catch (err) {
      console.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Handle branch selection
  const handleBranchChange = (branch: string) => {
    const updatedBranches = form.branch.includes(branch) 
      ? form.branch.filter(b => b !== branch)
      : [...form.branch, branch];
    setForm({ ...form, branch: updatedBranches });
  };

  // Add new subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.branch || form.branch.length === 0) {
      alert('Please select at least one branch');
      return;
    }

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

      const newSubject = await res.json();
      setSubjects([...subjects, newSubject]);
      setForm({
        name: '',
        code: '',
        instructor: '',
        department: '',
        year: '',
        term: '',
        branch: [],
        questions: ['', '', '', '', '', '', '', '', '', '']
      });
    } catch (err: any) {
      alert('Failed to add subject');
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
      year: String(subject.year),
      term: String(subject.term),
      branch: subject.branch,
      questions: [...subject.questions]
    });
  };

  // Update subject
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !token) return;

    if (!form.branch || form.branch.length === 0) {
      alert('Please select at least one branch');
      return;
    }

    const hasEmpty = form.questions.some(q => q.trim() === '');
    if (hasEmpty) {
      alert('Please fill all 10 questions');
      return;
    }

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
      setSubjects(subjects.map(s => s._id === updatedSubject._id ? updatedSubject : s));
      setEditingSubject(null);
      setForm({
        name: '',
        code: '',
        instructor: '',
        department: '',
        year: '',
        term: '',
        branch: [],
        questions: ['', '', '', '', '', '', '', '', '', '']
      });
    } catch (err: any) {
      alert('Failed to update subject');
    }
  };

  // Delete subject
  const handleDelete = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    
    try {
      await fetch(`http://localhost:5001/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSubjects(subjects.filter(s => s._id !== subjectId));
      alert('Subject deleted successfully!');
    } catch (err: any) {
      alert('Failed to delete subject');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Subject Management</h1>
          <p className="text-gray-600 text-lg">Manage subjects, departments, and feedback questions for your institution</p>
        </div>

        {/* Form and Table components will be added in next steps */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
          </h2>
          
          <form onSubmit={editingSubject ? handleUpdate : handleAddSubject} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Subject Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter subject name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Subject Code</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="e.g., CS101, MATH201"
                    value={form.code}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Instructor Name</label>
                  <input
                    type="text"
                    name="instructor"
                    placeholder="Enter instructor name"
                    value={form.instructor}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    <optgroup label="School of Engineering & Technology">
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
                    </optgroup>
                    <optgroup label="School of Computer Applications">
                      <option value="Master of Computer Applications">Master of Computer Applications</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            {/* Academic Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                  <select
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Term</label>
                  <select
                    name="term"
                    value={form.term}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Term</option>
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                    <option value="3">Term 3</option>
                    <option value="4">Term 4</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Branch Selection */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Selection</h3>
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="font-semibold text-gray-800 mb-3">UG BTECH Programs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['CSE', 'DS', 'AIML'].map((branch) => (
                      <label key={branch} className="flex items-center p-3 rounded-lg hover:bg-blue-50 cursor-pointer border">
                        <input
                          type="checkbox"
                          checked={form.branch.includes(branch)}
                          onChange={() => handleBranchChange(branch)}
                          className="w-4 h-4 text-blue-600 mr-3"
                        />
                        <div>
                          <div className="font-medium">{branch}</div>
                          <div className="text-sm text-gray-500">
                            {branch === 'CSE' && 'Computer Science Engineering'}
                            {branch === 'DS' && 'Data Science'}  
                            {branch === 'AIML' && 'AI & Machine Learning'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="font-semibold text-gray-800 mb-3">MCA Programs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['MCA Regular', 'MCA DS'].map((branch) => (
                      <label key={branch} className="flex items-center p-3 rounded-lg hover:bg-green-50 cursor-pointer border">
                        <input
                          type="checkbox"
                          checked={form.branch.includes(branch)}
                          onChange={() => handleBranchChange(branch)}
                          className="w-4 h-4 text-green-600 mr-3"
                        />
                        <div>
                          <div className="font-medium">{branch}</div>
                          <div className="text-sm text-gray-500">
                            {branch === 'MCA Regular' && 'Master of Computer Applications'}
                            {branch === 'MCA DS' && 'MCA Data Science'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Feedback Questions
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Create 10 questions for student feedback (required)</p>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={autoQuestionsEnabled}
                      onChange={(e) => {
                        setAutoQuestionsEnabled(e.target.checked);
                        if (e.target.checked) {
                          setTimeout(() => applyAutoQuestions(), 100);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Auto-generate</span>
                  </label>
                  
                  {autoQuestionsEnabled && (
                    <>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => {
                          setSelectedTemplate(e.target.value);
                          setTimeout(() => applyAutoQuestions(), 100);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="teaching">Teaching-focused</option>
                        <option value="technical">Technical-focused</option>
                        <option value="academic">Academic-focused</option>
                        <option value="mixed">Mixed (Random)</option>
                      </select>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={applyAutoQuestions}
                          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                          Apply Template
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const allTemplates = Object.values(questionTemplates).flat();
                            const shuffled = [...allTemplates].sort(() => 0.5 - Math.random());
                            const randomQuestions = shuffled.slice(0, 10);
                            
                            let customizedQuestions = [...randomQuestions];
                            if (form.name) {
                              customizedQuestions = customizedQuestions.map(q => {
                                return q.replace(/this subject|the course|this course/gi, form.name);
                              });
                            }
                            
                            setForm({
                              ...form,
                              questions: customizedQuestions
                            });
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                          Randomize
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {form.questions.map((q, i) => (
                  <div key={i} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Question {i + 1}</label>
                    <textarea
                      placeholder={`Enter feedback question ${i + 1}`}
                      value={q}
                      onChange={(e) => {
                        const updated = [...form.questions];
                        updated[i] = e.target.value;
                        setForm({ ...form, questions: updated });
                      }}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              {editingSubject && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSubject(null);
                    setForm({
                      name: '', code: '', instructor: '', department: '', year: '', term: '', branch: [], questions: ['', '', '', '', '', '', '', '', '', '']
                    });
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                {editingSubject ? 'Update Subject' : 'Add Subject'}
              </button>
            </div>
          </form>
        </div>

        {/* Subjects Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Existing Subjects</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Instructor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Academic</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Branches</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <tr key={subject._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{subject.name}</div>
                          <div className="text-sm text-gray-500">Code: {subject.code}</div>
                          <div className="text-xs text-gray-400">{subject.department}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{subject.instructor}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Year {subject.year}</span>
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Term {subject.term}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(subject.branch) ? subject.branch : [subject.branch]).map((branch, i) => (
                            <span key={i} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">{branch}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="px-3 py-1 border border-blue-300 text-blue-700 rounded hover:bg-blue-50 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subject._id)}
                          className="px-3 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No subjects found. Add your first subject above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}