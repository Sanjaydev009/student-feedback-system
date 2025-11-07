'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../utils/api';

interface FeedbackPeriod {
  _id: string;
  title: string;
  description: string;
  feedbackType: 'midterm' | 'endterm';
  academicYear: string;
  term: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  branches: string[];
  years: number[];
  createdBy: {
    _id: string;
    name: string;
  };
  statistics: {
    totalStudents: number;
    totalSubmissions: number;
    completionRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function FeedbackPeriodsPage() {
  const [feedbackPeriods, setFeedbackPeriods] = useState<FeedbackPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<FeedbackPeriod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Helper function to format date for datetime-local input
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to get default dates for new feedback period
  const getDefaultDates = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(now.getHours() + 1, 0, 0, 0); // Start 1 hour from now, rounded to the hour
    
    const end = new Date(start);
    end.setDate(end.getDate() + 7); // End 7 days from start
    
    return {
      startDate: formatDateForInput(start),
      endDate: formatDateForInput(end)
    };
  };

  // Helper function to get initial form data with default dates
  const getInitialFormData = () => {
    const { startDate, endDate } = getDefaultDates();
    return {
      title: '',
      description: '',
      feedbackType: 'midterm' as 'midterm' | 'endterm',
      academicYear: '',
      term: 1,
      startDate,
      endDate,
      allowedBranches: [] as string[],
      allowedYears: [] as number[]
    };
  };

  const [formData, setFormData] = useState(() => getInitialFormData());

  const branches = ['Computer Science', 'Information Technology', 'MCA Regular', 'MCA DS', 'CSE', 'AIML', 'DS'];
  const years = [1, 2, 3, 4];

  useEffect(() => {
    fetchFeedbackPeriods();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFeedbackPeriods = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await api.get('/api/feedback-periods/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFeedbackPeriods(response.data);
    } catch (error: any) {
      console.error('Error fetching feedback periods:', error);
      setError(error.response?.data?.message || 'Failed to fetch feedback periods');
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('End date must be after start date');
      return;
    }

    if (formData.allowedBranches.length === 0 || formData.allowedYears.length === 0) {
      setError('Please select at least one branch and year');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const token = localStorage.getItem('token');

      // Transform data to match backend expected field names
      // Convert local datetime-local values to proper ISO strings
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      const requestData = {
        title: formData.title,
        description: formData.description,
        feedbackType: formData.feedbackType,
        academicYear: formData.academicYear,
        term: formData.term,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        branches: formData.allowedBranches,
        years: formData.allowedYears,
        subjects: [], // Default empty array
        instructions: '' // Default empty string
      };

      await api.post('/api/feedback-periods', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowCreateForm(false);
      setFormData(getInitialFormData());
      
      await fetchFeedbackPeriods();
    } catch (error: any) {
      console.error('Error creating feedback period:', error);
      setError(error.response?.data?.message || 'Failed to create feedback period');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditForm = (period: FeedbackPeriod) => {
    setEditingPeriod(period);
    setFormData({
      title: period.title,
      description: period.description || '',
      feedbackType: period.feedbackType,
      academicYear: period.academicYear,
      term: period.term,
      startDate: formatDateForInput(new Date(period.startDate)),
      endDate: formatDateForInput(new Date(period.endDate)),
      allowedBranches: period.branches || [],
      allowedYears: period.years || []
    });
    setShowEditForm(true);
  };

  const handleUpdatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingPeriod) return;
    
    if (!formData.title || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('End date must be after start date');
      return;
    }

    if (formData.allowedBranches.length === 0 || formData.allowedYears.length === 0) {
      setError('Please select at least one branch and year');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const token = localStorage.getItem('token');

      // Convert local datetime-local values to proper ISO strings
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      const requestData = {
        title: formData.title,
        description: formData.description,
        feedbackType: formData.feedbackType,
        academicYear: formData.academicYear,
        term: formData.term,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        branches: formData.allowedBranches,
        years: formData.allowedYears
      };

      await api.put(`/api/feedback-periods/${editingPeriod._id}`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowEditForm(false);
      setEditingPeriod(null);
      setFormData(getInitialFormData());
      
      await fetchFeedbackPeriods();
    } catch (error: any) {
      console.error('Error updating feedback period:', error);
      setError(error.response?.data?.message || 'Failed to update feedback period');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePeriodStatus = async (periodId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const action = currentStatus ? 'deactivate' : 'activate';
      
      await api.patch(`/api/feedback-periods/${periodId}/toggle`, {
        action: action
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchFeedbackPeriods();
    } catch (error: any) {
      console.error('Error toggling period status:', error);
      setError(error.response?.data?.message || 'Failed to update period status');
    }
  };

  const completePeriod = async (periodId: string) => {
    if (!confirm('Are you sure you want to mark this feedback period as completed?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.patch(`/api/feedback-periods/${periodId}/toggle`, {
        action: 'complete'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchFeedbackPeriods();
    } catch (error: any) {
      console.error('Error completing period:', error);
      setError(error.response?.data?.message || 'Failed to complete period');
    }
  };

  const cancelPeriod = async (periodId: string) => {
    if (!confirm('Are you sure you want to cancel this feedback period?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.patch(`/api/feedback-periods/${periodId}/toggle`, {
        action: 'cancel'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchFeedbackPeriods();
    } catch (error: any) {
      console.error('Error canceling period:', error);
      setError(error.response?.data?.message || 'Failed to cancel period');
    }
  };

  const deletePeriod = async (periodId: string) => {
    if (!confirm('Are you sure you want to delete this feedback period? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/feedback-periods/${periodId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchFeedbackPeriods();
    } catch (error: any) {
      console.error('Error deleting period:', error);
      setError(error.response?.data?.message || 'Failed to delete period');
    }
  };

  const handleBranchChange = (branch: string) => {
    setFormData(prev => ({
      ...prev,
      allowedBranches: prev.allowedBranches.includes(branch)
        ? prev.allowedBranches.filter(b => b !== branch)
        : [...prev.allowedBranches, branch]
    }));
  };

  const handleYearChange = (year: number) => {
    setFormData(prev => ({
      ...prev,
      allowedYears: prev.allowedYears.includes(year)
        ? prev.allowedYears.filter(y => y !== year)
        : [...prev.allowedYears, year]
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    // Format the date in local timezone
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleString('en-US', options);
  };

  const getStatusBadge = (period: FeedbackPeriod) => {
    const now = new Date();
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);

    // Use backend status if available, otherwise fall back to computed status
    if (period.status) {
      switch (period.status) {
        case 'draft':
          return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Draft</span>;
        case 'active':
          if (period.isActive && now >= start && now <= end) {
            return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
          } else if (now < start) {
            return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Scheduled</span>;
          } else if (now > end) {
            return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Expired</span>;
          }
          return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactive</span>;
        case 'completed':
          return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Completed</span>;
        case 'cancelled':
          return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Cancelled</span>;
        default:
          return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Unknown</span>;
      }
    }

    // Fallback to old logic if status is not available
    if (!period.isActive) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactive</span>;
    }
    
    if (now < start) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Scheduled</span>;
    }
    
    if (now > end) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Expired</span>;
    }
    
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading feedback periods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Feedback Periods Management</h1>
              <p className="mt-2 text-gray-600">Create and manage feedback collection periods</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Period
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create Feedback Period</h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreatePeriod} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Mid-Term Feedback 2024"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Feedback Type *
                      </label>
                      <select
                        value={formData.feedbackType}
                        onChange={(e) => setFormData(prev => ({ ...prev, feedbackType: e.target.value as 'midterm' | 'endterm' }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="midterm">Mid-Term</option>
                        <option value="endterm">End-Term</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Academic Year *
                      </label>
                      <input
                        type="text"
                        value={formData.academicYear}
                        onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 2024-25"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Term *
                      </label>
                      <select
                        value={formData.term}
                        onChange={(e) => setFormData(prev => ({ ...prev, term: parseInt(e.target.value) }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={1}>Term 1</option>
                        <option value={2}>Term 2</option>
                        <option value={3}>Term 3</option>
                        <option value={4}>Term 4</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Brief description of this feedback period..."
                    />
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Allowed Branches */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed Branches *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {branches.map(branch => (
                        <label key={branch} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.allowedBranches.includes(branch)}
                            onChange={() => handleBranchChange(branch)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{branch}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Allowed Years */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed Years *
                    </label>
                    <div className="flex space-x-4">
                      {years.map(year => (
                        <label key={year} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.allowedYears.includes(year)}
                            onChange={() => handleYearChange(year)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Year {year}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Creating...' : 'Create Period'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form Modal */}
        {showEditForm && editingPeriod && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Edit Feedback Period</h2>
                    <p className="text-sm text-gray-600 mt-1">Extend deadline or modify period details</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingPeriod(null);
                      setFormData(getInitialFormData());
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleUpdatePeriod} className="space-y-6">
                  {/* Show warning for active periods */}
                  {editingPeriod.status === 'active' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Active Period:</strong> You can extend the deadline but cannot change feedback type or term for active periods.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Mid-Term Feedback 2024"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Feedback Type *
                      </label>
                      <select
                        value={formData.feedbackType}
                        onChange={(e) => setFormData(prev => ({ ...prev, feedbackType: e.target.value as 'midterm' | 'endterm' }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={editingPeriod.status === 'active'}
                      >
                        <option value="midterm">Mid-Term</option>
                        <option value="endterm">End-Term</option>
                      </select>
                      {editingPeriod.status === 'active' && (
                        <p className="text-xs text-gray-500 mt-1">Cannot be changed for active periods</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Academic Year *
                      </label>
                      <input
                        type="text"
                        value={formData.academicYear}
                        onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 2024-25"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Term *
                      </label>
                      <select
                        value={formData.term}
                        onChange={(e) => setFormData(prev => ({ ...prev, term: parseInt(e.target.value) }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={editingPeriod.status === 'active'}
                      >
                        <option value={1}>Term 1</option>
                        <option value={2}>Term 2</option>
                        <option value={3}>Term 3</option>
                        <option value={4}>Term 4</option>
                      </select>
                      {editingPeriod.status === 'active' && (
                        <p className="text-xs text-gray-500 mt-1">Cannot be changed for active periods</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Brief description of this feedback period..."
                    />
                  </div>

                  {/* Date Range - Highlight end date for extension */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="flex items-center">
                          End Date & Time *
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Extend Here
                          </span>
                        </span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full p-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        💡 You can extend the deadline to give students more time
                      </p>
                    </div>
                  </div>

                  {/* Allowed Branches */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed Branches *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {branches.map(branch => (
                        <label key={branch} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.allowedBranches.includes(branch)}
                            onChange={() => handleBranchChange(branch)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{branch}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Allowed Years */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed Years *
                    </label>
                    <div className="flex space-x-4">
                      {years.map(year => (
                        <label key={year} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.allowedYears.includes(year)}
                            onChange={() => handleYearChange(year)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Year {year}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingPeriod(null);
                        setFormData(getInitialFormData());
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : (
                        <>
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Update Period
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Periods List */}
        <div className="bg-white rounded-lg shadow">
          {feedbackPeriods.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                📋
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback periods found</h3>
              <p className="text-gray-600 mb-4">Create your first feedback period to get started.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Feedback Period
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target Audience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statistics
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feedbackPeriods.map((period) => (
                    <tr key={period._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{period.title}</div>
                          {period.description && (
                            <div className="text-sm text-gray-500">{period.description}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(period.startDate)} - {formatDate(period.endDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            period.feedbackType === 'midterm' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {period.feedbackType === 'midterm' ? 'Mid-Term' : 'End-Term'}
                          </span>
                          <div>{getStatusBadge(period)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            Years: {period.years?.join(', ') || 'Not specified'}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Branches: {period.branches?.slice(0, 2).join(', ') || 'Not specified'}
                            {period.branches && period.branches.length > 2 && ` +${period.branches.length - 2} more`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {period.statistics?.totalSubmissions || 0} / {period.statistics?.totalStudents || 0} responses
                          </div>
                          <div className="text-gray-500">
                            {period.statistics?.completionRate || 0}% completion
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditForm(period)}
                            className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 font-medium transition-colors"
                            title="Edit feedback period"
                          >
                            Edit
                          </button>
                          
                          {/* Toggle Active Status */}
                          {period.status !== 'completed' && period.status !== 'cancelled' && (
                            <button
                              onClick={() => togglePeriodStatus(period._id, period.isActive)}
                              className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                                period.isActive
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {period.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                          
                          {/* Complete Period */}
                          {period.isActive && period.status === 'active' && (
                            <button
                              onClick={() => completePeriod(period._id)}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 font-medium transition-colors"
                            >
                              Complete
                            </button>
                          )}
                          
                          {/* Cancel Period */}
                          {period.status === 'active' && (
                            <button
                              onClick={() => cancelPeriod(period._id)}
                              className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          
                          {/* Delete Period */}
                          <button
                            onClick={() => deletePeriod(period._id)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-medium transition-colors"
                            title="Permanently delete this period"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}