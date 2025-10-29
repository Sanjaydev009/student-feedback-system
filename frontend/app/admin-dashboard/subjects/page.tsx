'use client';

import { useEffect, useState, useRef } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import { useToast } from '@/components/ToastProvider';
import api from '@/utils/api';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  department: string;
  year: number;
  term: number;
  branch: string[];
  sections: string[]; // Added sections field
  questions: string[];
}

interface SubjectStats {
  totalSubjects: number;
  totalInstructors: number;
  departmentDistribution: { [key: string]: number };
  yearDistribution: { [key: string]: number };
}

export default function EnhancedSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<SubjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const { showSuccess, showError, showWarning } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    instructor: '',
    department: '',
    year: '',
    term: '',
    branch: [] as string[],
    sections: [] as string[], // Added sections field
    questions: ['', '', '', '', '', '', '', '', '', '']
  });
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [autoQuestionsEnabled, setAutoQuestionsEnabled] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<{[key: string]: {midterm: number, endterm: number}}>({});
  const [selectedTemplate, setSelectedTemplate] = useState('teaching');
  
  // Available sections and departments
  const sections = ['A', 'B', 'C'];
  const departments = [
    'Computer Science & Engineering',
    'Data Science', 
    'Artificial Intelligence & Machine Learning',
    'Master of Computer Applications'
  ];

  // Enhanced question templates
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

  // Fetch subjects and stats
  useEffect(() => {
    fetchSubjects();
    fetchStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check feedback status for all subjects efficiently
  const checkFeedbackStatus = async () => {
    if (subjects.length === 0) return;
    
    const subjectIds = subjects.map(s => s._id);
    const statusMap: {[key: string]: {midterm: number, endterm: number}} = {};
    
    try {
      // Batch check for midterm feedback
      const midtermResponse = await api.post('/api/feedback/batch-check?feedbackType=midterm', {
        subjectIds: subjectIds
      });
      
      // Batch check for endterm feedback  
      const endtermResponse = await api.post('/api/feedback/batch-check?feedbackType=endterm', {
        subjectIds: subjectIds
      });
      
      // Build status map
      for (const subjectId of subjectIds) {
        statusMap[subjectId] = {
          midterm: midtermResponse.data[subjectId]?.feedbackCount || 0,
          endterm: endtermResponse.data[subjectId]?.feedbackCount || 0
        };
      }
      
      setFeedbackStatus(statusMap);
      console.log('✅ Feedback status loaded for', Object.keys(statusMap).length, 'subjects');
      
    } catch (error: any) {
      console.warn('Error checking feedback status:', error.message);
      
      // Fallback: Initialize all subjects with 0 counts and try individual checks
      for (const subjectId of subjectIds) {
        statusMap[subjectId] = { midterm: 0, endterm: 0 };
      }
      
      // Try fallback approach with individual checks if batch fails
      if (error.response?.status === 404) {
        console.log('Batch endpoint not available, falling back to individual checks...');
        await checkFeedbackStatusFallback(statusMap, subjectIds);
      }
      
      setFeedbackStatus(statusMap);
    }
  };

  // Fallback method for checking feedback status individually
  const checkFeedbackStatusFallback = async (statusMap: {[key: string]: {midterm: number, endterm: number}}, subjectIds: string[]) => {
    for (const subjectId of subjectIds) {
      try {
        // Check midterm feedback
        const midtermResponse = await api.get(`/api/feedback/check/${subjectId}?feedbackType=midterm`);
        statusMap[subjectId] = { 
          ...statusMap[subjectId],
          midterm: midtermResponse.data.feedbackCount || 0
        };
      } catch {
        // Keep default 0 value
      }
      
      try {
        // Check endterm feedback
        const endtermResponse = await api.get(`/api/feedback/check/${subjectId}?feedbackType=endterm`);
        statusMap[subjectId] = { 
          ...statusMap[subjectId],
          endterm: endtermResponse.data.feedbackCount || 0
        };
      } catch {
        // Keep default 0 value
      }
    }
  };

  // Check feedback status when subjects change
  useEffect(() => {
    if (subjects.length > 0 && !loading) {
      checkFeedbackStatus();
    }
  }, [subjects]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter subjects based on search and filters
  useEffect(() => {
    let filtered = subjects;

    if (searchTerm) {
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(subject => subject.department === selectedDepartment);
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter(subject => subject.year.toString() === selectedYear);
    }

    if (selectedTerm !== 'all') {
      filtered = filtered.filter(subject => subject.term.toString() === selectedTerm);
    }

    setFilteredSubjects(filtered);
  }, [subjects, searchTerm, selectedDepartment, selectedYear, selectedTerm]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        // Close all dropdowns
        const dropdowns = document.querySelectorAll('[id^="dropdown-"], [id^="grid-dropdown-"]');
        dropdowns.forEach(dropdown => {
          dropdown.classList.add('hidden');
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/api/subjects');
      setSubjects(response.data);
    } catch (error) {
      showError('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/subjects/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  // Apply auto-generated questions
  const applyAutoQuestions = () => {
    if (autoQuestionsEnabled) {
      let questionsToUse;
      
      if (selectedTemplate === 'mixed') {
        const allTemplates = Object.values(questionTemplates).flat();
        const shuffled = [...allTemplates].sort(() => 0.5 - Math.random());
        questionsToUse = shuffled.slice(0, 10);
      } else {
        questionsToUse = questionTemplates[selectedTemplate as keyof typeof questionTemplates];
      }
      
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

  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  // Handle section selection
  const handleSectionChange = (section: string) => {
    const updatedSections = form.sections.includes(section)
      ? form.sections.filter(s => s !== section)
      : [...form.sections, section];
    setForm({ ...form, sections: updatedSections });
  };

  // Handle subject selection for bulk operations
  const handleSubjectSelection = (subjectId: string) => {
    const updated = selectedSubjects.includes(subjectId)
      ? selectedSubjects.filter(id => id !== subjectId)
      : [...selectedSubjects, subjectId];
    setSelectedSubjects(updated);
    setShowBulkActions(updated.length > 0);
  };

  // Select all subjects
  const handleSelectAll = () => {
    if (selectedSubjects.length === filteredSubjects.length) {
      setSelectedSubjects([]);
      setShowBulkActions(false);
    } else {
      setSelectedSubjects(filteredSubjects.map(s => s._id));
      setShowBulkActions(true);
    }
  };

  // Bulk delete subjects
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedSubjects.length} subjects?`)) return;

    try {
      await api.delete('/api/subjects/bulk', { data: { ids: selectedSubjects } });
      setSubjects(subjects.filter(s => !selectedSubjects.includes(s._id)));
      setSelectedSubjects([]);
      setShowBulkActions(false);
      showSuccess(`Successfully deleted ${selectedSubjects.length} subjects`);
    } catch (error) {
      showError('Failed to delete subjects');
    }
  };

  // Export subjects as CSV
  const handleExportCSV = () => {
    const csvData = filteredSubjects.map(subject => ({
      Name: subject.name,
      Code: subject.code,
      Instructor: subject.instructor,
      Department: subject.department,
      Year: subject.year,
      Term: subject.term,
      Branches: subject.branch.join(', '),
      Sections: (subject.sections || []).join(', '), // Added sections to CSV
      Questions: subject.questions.length
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subjects-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Add new subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.branch || form.branch.length === 0) {
      showWarning('Please select at least one branch');
      return;
    }

    if (!form.sections || form.sections.length === 0) {
      showWarning('Please select at least one section');
      return;
    }

    const hasEmpty = form.questions.some(q => q.trim() === '');
    if (hasEmpty) {
      showWarning('Please fill all 10 questions');
      return;
    }

    try {
      const response = await api.post('/api/subjects', form);
      setSubjects([...subjects, response.data]);
      setForm({
        name: '',
        code: '',
        instructor: '',
        department: '',
        year: '',
        term: '',
        branch: [],
        sections: [], // Added sections reset
        questions: ['', '', '', '', '', '', '', '', '', '']
      });
      setShowAddForm(false);
      showSuccess('Subject added successfully');
    } catch (error) {
      showError('Failed to add subject');
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
      sections: subject.sections || [], // Handle existing subjects without sections
      questions: [...subject.questions]
    });
    setShowAddForm(true);
  };

  // Update subject
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    try {
      const response = await api.put(`/api/subjects/${editingSubject._id}`, form);
      setSubjects(subjects.map(s => s._id === response.data._id ? response.data : s));
      setEditingSubject(null);
      setForm({
        name: '',
        code: '',
        instructor: '',
        department: '',
        year: '',
        term: '',
        branch: [],
        sections: [], // Added sections reset
        questions: ['', '', '', '', '', '', '', '', '', '']
      });
      setShowAddForm(false);
      showSuccess('Subject updated successfully');
    } catch (error) {
      showError('Failed to update subject');
    }
  };

  // Delete subject
  const handleDelete = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    
    try {
      await api.delete(`/api/subjects/${subjectId}`);
      setSubjects(subjects.filter(s => s._id !== subjectId));
      showSuccess('Subject deleted successfully');
    } catch (error) {
      showError('Failed to delete subject');
    }
  };

  // Download feedback CSV for a subject
  const handleDownloadFeedbackCSV = async (subjectId: string, subjectName: string, feedbackType: 'midterm' | 'endterm' = 'midterm') => {
    try {
      showWarning('Checking feedback availability...');
      
      // First check if feedback exists
      const checkResponse = await api.get(`/api/feedback/check/${subjectId}?feedbackType=${feedbackType}`);
      
      showWarning(`Generating CSV with complete comments... (${checkResponse.data.feedbackCount} responses found)`);
      
      // If check passed, download the actual CSV
      const response = await api.get(`/api/feedback/export-csv/${subjectId}?feedbackType=${feedbackType}`, {
        responseType: 'blob'
      });
      
      // Create and download the file
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${subjectName.replace(/[^a-z0-9]/gi, '_')}_${feedbackType}_feedback_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      showSuccess(`✅ ${feedbackType} feedback CSV downloaded successfully (${checkResponse.data.feedbackCount} responses)`);
    } catch (error: any) {
      console.error('CSV download error:', error);
      
      if (error.response?.status === 404) {
        const errorData = error.response?.data;
        if (errorData && errorData.subjectName) {
          // Show detailed notification with subject information
          showError(
            `📋 No ${feedbackType} feedback available!\n\n` +
            `Subject: "${errorData.subjectName}" (${errorData.subjectCode})\n` +
            `Instructor: ${errorData.instructor}\n\n` +
            `❌ ${feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)} feedback has not been submitted yet by any student for this subject.\n\n` +
            `💡 Please check back after students have completed their feedback submissions.`
          );
        } else {
          showError(`❌ No ${feedbackType} feedback available!\n\nStudents have not yet submitted feedback for "${subjectName}". Please try again later.`);
        }
      } else if (error.response?.status === 500) {
        showError('❌ Server error while generating CSV file. Please contact system administrator.');
      } else if (error.code === 'ECONNREFUSED' || !error.response) {
        showError('❌ Cannot connect to server. Please ensure the backend is running and try again.');
      } else {
        showError('❌ Failed to download feedback data. Please try again or contact support.');
      }
    }
  };

  // New function for anonymous faculty report
  const handleDownloadFacultyReport = async (subjectId: string, subjectName: string, feedbackType: 'midterm' | 'endterm' = 'midterm') => {
    try {
      showWarning('Checking feedback availability...');
      
      // First check if feedback exists
      const checkResponse = await api.get(`/api/feedback/check/${subjectId}?feedbackType=${feedbackType}`);
      
      showWarning(`Generating anonymous faculty feedback report... (${checkResponse.data.feedbackCount} responses found)`);
      
      // If check passed, download the actual report
      const response = await api.get(`/api/feedback/faculty-report/${subjectId}?feedbackType=${feedbackType}`, {
        responseType: 'blob'
      });
      
      // Create and download the file
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${subjectName.replace(/[^a-z0-9]/gi, '_')}_Faculty_Report_${feedbackType}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      showSuccess(`✅ Anonymous faculty report downloaded successfully (${checkResponse.data.feedbackCount} responses)`);
    } catch (error: any) {
      console.error('Faculty report download error:', error);
      
      if (error.response?.status === 404) {
        const errorData = error.response?.data;
        if (errorData && errorData.subjectName) {
          // Show detailed notification with subject information
          showError(
            `📊 No ${feedbackType} feedback available for Faculty Report!\n\n` +
            `Subject: "${errorData.subjectName}" (${errorData.subjectCode})\n` +
            `Instructor: ${errorData.instructor}\n\n` +
            `❌ ${feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)} feedback has not been submitted yet by any student for this subject.\n\n` +
            `💡 Faculty reports are generated from student feedback. Please check back after students have completed their feedback submissions.`
          );
        } else {
          showError(`❌ No ${feedbackType} feedback available for Faculty Report!\n\nStudents have not yet submitted feedback for "${subjectName}". Please try again later.`);
        }
      } else if (error.response?.status === 500) {
        showError('❌ Server error while generating faculty report. Please contact system administrator.');
      } else {
        showError('❌ Failed to download faculty report. Please try again or contact support.');
      }
    }
  };

  // New function for detailed student responses report
  const handleDownloadDetailedResponses = async (subjectId: string, subjectName: string, feedbackType: 'midterm' | 'endterm' = 'midterm') => {
    try {
      showWarning('Checking feedback availability...');
      
      // First check if feedback exists
      const checkResponse = await api.get(`/api/feedback/check/${subjectId}?feedbackType=${feedbackType}`);
      
      showWarning(`Generating detailed student responses report... (${checkResponse.data.feedbackCount} responses found)`);
      
      // If check passed, download the actual report
      const response = await api.get(`/api/feedback/detailed-responses/${subjectId}?feedbackType=${feedbackType}`, {
        responseType: 'blob'
      });
      
      // Create and download the file
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${subjectName.replace(/[^a-z0-9]/gi, '_')}_Detailed_Student_Responses_${feedbackType}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      showSuccess(`✅ Detailed student responses downloaded successfully (${checkResponse.data.feedbackCount} responses with timestamps)`);
    } catch (error: any) {
      console.error('Detailed responses download error:', error);
      
      if (error.response?.status === 404) {
        const errorData = error.response?.data;
        if (errorData && errorData.subjectName) {
          // Show detailed notification with subject information
          showError(
            `📊 No ${feedbackType} feedback available for Detailed Student Responses!\n\n` +
            `Subject: "${errorData.subjectName}" (${errorData.subjectCode})\n` +
            `Instructor: ${errorData.instructor}\n\n` +
            `❌ ${feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)} feedback has not been submitted yet by any student for this subject.\n\n` +
            `💡 Detailed responses include individual student feedback with timestamps. Please check back after students have completed their feedback submissions.`
          );
        } else {
          showError(`❌ No ${feedbackType} feedback available for Detailed Student Responses!\n\nStudents have not yet submitted feedback for "${subjectName}". Please try again later.`);
        }
      } else if (error.response?.status === 500) {
        showError('❌ Server error while generating detailed responses report. Please contact system administrator.');
      } else {
        showError('❌ Failed to download detailed responses report. Please try again or contact support.');
      }
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
        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Advanced Subject Management</h1>
              <p className="text-gray-600 text-lg">Comprehensive subject administration with enhanced features</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Subject
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalSubjects}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Instructors</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalInstructors}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Departments</p>
                    <p className="text-2xl font-semibold text-gray-900">{Object.keys(stats.departmentDistribution).length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-orange-100">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Sections</p>
                    <p className="text-2xl font-semibold text-gray-900">{sections.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search subjects, codes, or instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>

            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Terms</option>
              <option value="1">Term 1</option>
              <option value="2">Term 2</option>
              <option value="3">Term 3</option>
              <option value="4">Term 4</option>
            </select>

            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Sections</option>
              {sections.map(section => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-blue-800 font-medium">
                  {selectedSubjects.length} subject(s) selected
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => {
                    setSelectedSubjects([]);
                    setShowBulkActions(false);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Subject Form */}
        {showAddForm && (
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
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
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

              {/* Section Selection */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Assignment</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select which sections this subject will be available to. Students in selected sections will be able to view and provide feedback for this subject.
                </p>
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="font-semibold text-gray-800 mb-3">Available Sections</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {sections.map((section) => (
                      <label key={section} className="flex items-center p-3 rounded-lg hover:bg-indigo-50 cursor-pointer border">
                        <input
                          type="checkbox"
                          checked={form.sections.includes(section)}
                          onChange={() => handleSectionChange(section)}
                          className="w-4 h-4 text-indigo-600 mr-3"
                        />
                        <div>
                          <div className="font-medium">Section {section}</div>
                          <div className="text-sm text-gray-500">
                            Students in section {section}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {form.sections.length > 0 && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                      <p className="text-sm text-indigo-800">
                        <strong>Selected sections:</strong> {form.sections.join(', ')}
                      </p>
                      <p className="text-xs text-indigo-600 mt-1">
                        Students in these sections will be able to access this subject for feedback.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Questions Section */}
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
                        <button
                          type="button"
                          onClick={applyAutoQuestions}
                          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                          Apply Template
                        </button>
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
                <button
                  type="button"
                  onClick={() => {
                    setEditingSubject(null);
                    setForm({
                      name: '', code: '', instructor: '', department: '', year: '', term: '', branch: [], sections: [], questions: ['', '', '', '', '', '', '', '', '', '']
                    });
                    setShowAddForm(false);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  {editingSubject ? 'Update Subject' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subjects Display */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Subjects ({filteredSubjects.length})</h2>
              <p className="text-sm text-gray-600">Manage your academic subjects and curriculum</p>
            </div>
            {filteredSubjects.length > 0 && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedSubjects.length === filteredSubjects.length}
                  onChange={handleSelectAll}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            )}
          </div>
          
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      <input
                        type="checkbox"
                        checked={selectedSubjects.length === filteredSubjects.length && filteredSubjects.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Instructor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Academic</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Branches</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sections</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subject) => (
                      <tr key={subject._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedSubjects.includes(subject._id)}
                            onChange={() => handleSubjectSelection(subject._id)}
                          />
                        </td>
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
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(subject.sections || []).map((section, i) => (
                              <span key={i} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">Section {section}</span>
                            ))}
                            {(!subject.sections || subject.sections.length === 0) && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">No sections assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 space-x-2">
                          <button
                            onClick={() => handleEdit(subject)}
                            className="px-3 py-1 border border-blue-300 text-blue-700 rounded hover:bg-blue-50 text-sm"
                          >
                            Edit
                          </button>
                          <div className="inline-block relative dropdown-container">
                            <button
                              onClick={() => {
                                const dropdown = document.getElementById(`dropdown-${subject._id}`);
                                if (dropdown) {
                                  dropdown.classList.toggle('hidden');
                                }
                              }}
                              className="px-3 py-1 border border-green-300 text-green-700 rounded hover:bg-green-50 text-sm"
                            >
                              Download CSV ▼
                            </button>
                            <div id={`dropdown-${subject._id}`} className="hidden absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                              <button
                                onClick={() => {
                                  handleDownloadFeedbackCSV(subject._id, subject.name, 'midterm');
                                  const dropdown = document.getElementById(`dropdown-${subject._id}`);
                                  if (dropdown) dropdown.classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                              >
                                <span>� Midterm Anonymous Report</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  feedbackStatus[subject._id]?.midterm > 0 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {feedbackStatus[subject._id]?.midterm > 0 
                                    ? `${feedbackStatus[subject._id].midterm} responses` 
                                    : 'No data'
                                  }
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  handleDownloadFeedbackCSV(subject._id, subject.name, 'endterm');
                                  const dropdown = document.getElementById(`dropdown-${subject._id}`);
                                  if (dropdown) dropdown.classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                              >
                                <span>� Endterm Anonymous Report</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  feedbackStatus[subject._id]?.endterm > 0 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {feedbackStatus[subject._id]?.endterm > 0 
                                    ? `${feedbackStatus[subject._id].endterm} responses` 
                                    : 'No data'
                                  }
                                </span>
                              </button>
                              <hr className="my-1 border-gray-200" />
                              <button
                                onClick={() => {
                                  handleDownloadFacultyReport(subject._id, subject.name, 'midterm');
                                  const dropdown = document.getElementById(`dropdown-${subject._id}`);
                                  if (dropdown) dropdown.classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 font-medium flex items-center justify-between"
                              >
                                <span>� Midterm Faculty Summary</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  feedbackStatus[subject._id]?.midterm > 0 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {feedbackStatus[subject._id]?.midterm > 0 
                                    ? `${feedbackStatus[subject._id].midterm} responses` 
                                    : 'No data'
                                  }
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  handleDownloadFacultyReport(subject._id, subject.name, 'endterm');
                                  const dropdown = document.getElementById(`dropdown-${subject._id}`);
                                  if (dropdown) dropdown.classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 font-medium flex items-center justify-between"
                              >
                                <span>� Endterm Faculty Summary</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  feedbackStatus[subject._id]?.endterm > 0 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {feedbackStatus[subject._id]?.endterm > 0 
                                    ? `${feedbackStatus[subject._id].endterm} responses` 
                                    : 'No data'
                                  }
                                </span>
                              </button>
                              <hr className="my-1 border-gray-200" />
                              <button
                                onClick={() => {
                                  handleDownloadDetailedResponses(subject._id, subject.name, 'midterm');
                                  const dropdown = document.getElementById(`dropdown-${subject._id}`);
                                  if (dropdown) dropdown.classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 font-medium flex items-center justify-between"
                              >
                                <span>🔍 Midterm Detailed Responses</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  feedbackStatus[subject._id]?.midterm > 0 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {feedbackStatus[subject._id]?.midterm > 0 
                                    ? `${feedbackStatus[subject._id].midterm} responses` 
                                    : 'No data'
                                  }
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  handleDownloadDetailedResponses(subject._id, subject.name, 'endterm');
                                  const dropdown = document.getElementById(`dropdown-${subject._id}`);
                                  if (dropdown) dropdown.classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 font-medium flex items-center justify-between"
                              >
                                <span>🔍 Endterm Detailed Responses</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  feedbackStatus[subject._id]?.endterm > 0 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {feedbackStatus[subject._id]?.endterm > 0 
                                    ? `${feedbackStatus[subject._id].endterm} responses` 
                                    : 'No data'
                                  }
                                </span>
                              </button>
                            </div>
                          </div>
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
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        {searchTerm || selectedDepartment !== 'all' || selectedYear !== 'all' || selectedTerm !== 'all'
                          ? 'No subjects match your current filters.'
                          : 'No subjects found. Add your first subject using the button above.'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubjects.map((subject) => (
                  <div key={subject._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{subject.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">Code: {subject.code}</p>
                        <p className="text-sm text-gray-600">{subject.instructor}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject._id)}
                        onChange={() => handleSubjectSelection(subject._id)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Department:</span>
                        <span className="text-xs text-gray-700 text-right">{subject.department}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Year {subject.year}</span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Term {subject.term}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(subject.branch) ? subject.branch : [subject.branch]).map((branch, i) => (
                          <span key={i} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">{branch}</span>
                        ))}
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-xs text-gray-500">Sections:</span>
                        <div className="flex flex-wrap gap-1">
                          {(subject.sections || []).map((section, i) => (
                            <span key={i} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">Section {section}</span>
                          ))}
                          {(!subject.sections || subject.sections.length === 0) && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">No sections assigned</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="flex-1 px-3 py-2 border border-blue-300 text-blue-700 rounded hover:bg-blue-50 text-sm"
                        >
                          Edit
                        </button>
                        <div className="flex-1 relative dropdown-container">
                          <button
                            onClick={() => {
                              const dropdown = document.getElementById(`grid-dropdown-${subject._id}`);
                              if (dropdown) {
                                dropdown.classList.toggle('hidden');
                              }
                            }}
                            className="w-full px-3 py-2 border border-green-300 text-green-700 rounded hover:bg-green-50 text-sm"
                          >
                            CSV ▼
                          </button>
                          <div id={`grid-dropdown-${subject._id}`} className="hidden absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button
                              onClick={() => {
                                handleDownloadFeedbackCSV(subject._id, subject.name, 'midterm');
                                const dropdown = document.getElementById(`grid-dropdown-${subject._id}`);
                                if (dropdown) dropdown.classList.add('hidden');
                              }}
                              className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                            >
                              Midterm (Students)
                            </button>
                            <button
                              onClick={() => {
                                handleDownloadFeedbackCSV(subject._id, subject.name, 'endterm');
                                const dropdown = document.getElementById(`grid-dropdown-${subject._id}`);
                                if (dropdown) dropdown.classList.add('hidden');
                              }}
                              className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                            >
                              Endterm (Students)
                            </button>
                            <hr className="my-1 border-gray-200" />
                            <button
                              onClick={() => {
                                handleDownloadFacultyReport(subject._id, subject.name, 'midterm');
                                const dropdown = document.getElementById(`grid-dropdown-${subject._id}`);
                                if (dropdown) dropdown.classList.add('hidden');
                              }}
                              className="block w-full text-left px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 font-medium"
                            >
                              📊 Midterm Faculty
                            </button>
                            <button
                              onClick={() => {
                                handleDownloadFacultyReport(subject._id, subject.name, 'endterm');
                                const dropdown = document.getElementById(`grid-dropdown-${subject._id}`);
                                if (dropdown) dropdown.classList.add('hidden');
                              }}
                              className="block w-full text-left px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 font-medium"
                            >
                              📊 Endterm Faculty
                            </button>
                            <hr className="my-1 border-gray-200" />
                            <button
                              onClick={() => {
                                handleDownloadDetailedResponses(subject._id, subject.name, 'midterm');
                                const dropdown = document.getElementById(`grid-dropdown-${subject._id}`);
                                if (dropdown) dropdown.classList.add('hidden');
                              }}
                              className="block w-full text-left px-3 py-2 text-xs text-purple-700 hover:bg-purple-50 font-medium"
                            >
                              🔍 Midterm Detailed
                            </button>
                            <button
                              onClick={() => {
                                handleDownloadDetailedResponses(subject._id, subject.name, 'endterm');
                                const dropdown = document.getElementById(`grid-dropdown-${subject._id}`);
                                if (dropdown) dropdown.classList.add('hidden');
                              }}
                              className="block w-full text-left px-3 py-2 text-xs text-purple-700 hover:bg-purple-50 font-medium"
                            >
                              🔍 Endterm Detailed
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(subject._id)}
                          className="flex-1 px-3 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredSubjects.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 012.184 1.327 3.42 3.42 0 01.63 2.248 3.42 3.42 0 01-.956 2.054 3.42 3.42 0 01-.62 3.135 3.42 3.42 0 01-2.054.956 3.42 3.42 0 01-2.184 1.327 3.42 3.42 0 01-4.438 0 3.42 3.42 0 01-2.184-1.327 3.42 3.42 0 01-2.054-.956 3.42 3.42 0 01-.62-3.135 3.42 3.42 0 01-.956-2.054 3.42 3.42 0 01.63-2.248 3.42 3.42 0 012.184-1.327z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No subjects found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || selectedDepartment !== 'all' || selectedYear !== 'all' || selectedTerm !== 'all'
                      ? 'No subjects match your current filters.'
                      : 'Get started by adding your first subject.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}