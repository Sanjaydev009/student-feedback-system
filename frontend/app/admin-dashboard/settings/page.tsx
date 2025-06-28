'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/utils/api';

interface SystemSettings {
  _id: string;
  feedbackPeriodStart: string;
  feedbackPeriodEnd: string;
  allowAnonymousFeedback: boolean;
  emailNotifications: boolean;
  defaultQuestions: string[];
  customWelcomeMessage: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isClient, setIsClient] = useState(false);
  
  // Set client-side flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch settings data
  useEffect(() => {
    if (!isClient) return;
    
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // This would call the real API in production
        // For now, we'll mock the data
        // const response = await api.get('/api/admin/settings');
        // setSettings(response.data);
        
        // Mock data
        setSettings({
          _id: 'setting-1',
          feedbackPeriodStart: '2023-11-01T00:00',
          feedbackPeriodEnd: '2023-11-30T23:59',
          allowAnonymousFeedback: true,
          emailNotifications: true,
          defaultQuestions: [
            'How would you rate the instructor\'s teaching effectiveness?',
            'How clear were the course materials and explanations?',
            'How accessible was the instructor outside of class hours?',
            'How relevant were the assignments to the course objectives?',
            'How would you rate the overall course content?'
          ],
          customWelcomeMessage: 'Welcome to the Student Feedback System! Your opinion matters to us.'
        });
        setError('');
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isClient]);

  const handleSettingsChange = (field: keyof SystemSettings, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [field]: value
    });
  };

  const handleQuestionChange = (index: number, value: string) => {
    if (!settings) return;
    
    const updatedQuestions = [...settings.defaultQuestions];
    updatedQuestions[index] = value;
    
    setSettings({
      ...settings,
      defaultQuestions: updatedQuestions
    });
  };

  const handleAddQuestion = () => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      defaultQuestions: [...settings.defaultQuestions, '']
    });
  };

  const handleRemoveQuestion = (index: number) => {
    if (!settings) return;
    
    const updatedQuestions = settings.defaultQuestions.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      defaultQuestions: updatedQuestions
    });
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    setSuccess('');
    setError('');
    
    try {
      // This would call the real API in production
      // await api.put('/api/admin/settings', settings);
      
      // Mock successful save
      setTimeout(() => {
        setSuccess('Settings saved successfully!');
        setSaving(false);
      }, 800);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
      setSaving(false);
    }
  };

  // Simple loading state for SSR
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/admin-dashboard" className="mr-4 text-white hover:text-blue-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-white">System Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Error and Success Messages */}
        {error && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md" role="alert">
            <p className="font-bold">Success</p>
            <p>{success}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        ) : settings ? (
          <div className="space-y-6">
            {/* Feedback Period Settings */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">Feedback Period</h2>
                <p className="mt-1 text-sm text-gray-500">Configure when students can submit feedback</p>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      value={settings.feedbackPeriodStart}
                      onChange={(e) => handleSettingsChange('feedbackPeriodStart', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      value={settings.feedbackPeriodEnd}
                      onChange={(e) => handleSettingsChange('feedbackPeriodEnd', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* General Settings */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
                <p className="mt-1 text-sm text-gray-500">System-wide configuration options</p>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anonymous-feedback"
                    checked={settings.allowAnonymousFeedback}
                    onChange={(e) => handleSettingsChange('allowAnonymousFeedback', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="anonymous-feedback" className="ml-2 block text-sm text-gray-900">
                    Allow anonymous feedback submissions
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingsChange('emailNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-900">
                    Send email notifications for new feedback
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Welcome Message</label>
                  <textarea
                    value={settings.customWelcomeMessage}
                    onChange={(e) => handleSettingsChange('customWelcomeMessage', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a custom welcome message for users..."
                  />
                </div>
              </div>
            </div>

            {/* Default Questions */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">Default Questions</h2>
                <p className="mt-1 text-sm text-gray-500">Configure the standard questions for feedback forms</p>
              </div>
              <div className="px-6 py-4 space-y-4">
                {settings.defaultQuestions.map((question, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => handleQuestionChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter question..."
                    />
                    <button
                      onClick={() => handleRemoveQuestion(index)}
                      className="p-2 text-red-600 hover:text-red-800 rounded-md"
                      title="Remove Question"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={handleAddQuestion}
                  className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add New Question
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className={`
                  px-6 py-2 rounded-md text-white font-medium
                  ${saving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}
                `}
              >
                {saving ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : 'Save Settings'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
