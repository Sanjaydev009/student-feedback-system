'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import api from '@/utils/api';

export default function DEANSettingsPage() {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notificationPreferences: {
      emailReports: true,
      weeklyDigest: true,
      lowRatingAlerts: true,
      newFeedbackNotifications: false,
    },
    reportSettings: {
      defaultTimeRange: '30',
      includeAnonymousData: true,
      autoGenerateReports: false,
    },
    displaySettings: {
      showBranchComparison: true,
      showTrendAnalysis: true,
      defaultChartType: 'bar',
    }
  });
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/settings/user');
      
      // Update settings from API response
      setSettings({
        notificationPreferences: response.data.notificationPreferences,
        reportSettings: response.data.reportSettings,
        displaySettings: response.data.displaySettings
      });
      
      showToast('Settings loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('Failed to load settings', 'error');
      // Leave default settings in place if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await api.put('/api/settings/user', settings);
      showToast('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            DEAN Dashboard Settings
          </h3>
          
          <div className="space-y-6">
            {/* Notification Preferences */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Notification Preferences</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-sm text-gray-700">Email Reports</label>
                    <p className="text-xs text-gray-500">Receive monthly performance reports via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.notificationPreferences.emailReports}
                      onChange={(e) => updateSetting('notificationPreferences', 'emailReports', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-sm text-gray-700">Weekly Digest</label>
                    <p className="text-xs text-gray-500">Weekly summary of feedback activities</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.notificationPreferences.weeklyDigest}
                      onChange={(e) => updateSetting('notificationPreferences', 'weeklyDigest', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-sm text-gray-700">Low Rating Alerts</label>
                    <p className="text-xs text-gray-500">Get notified when ratings drop below threshold</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.notificationPreferences.lowRatingAlerts}
                      onChange={(e) => updateSetting('notificationPreferences', 'lowRatingAlerts', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Report Settings */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Report Settings</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Time Range for Reports
                  </label>
                  <select
                    value={settings.reportSettings.defaultTimeRange}
                    onChange={(e) => updateSetting('reportSettings', 'defaultTimeRange', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 3 months</option>
                    <option value="365">Last year</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-sm text-gray-700">Include Anonymous Data</label>
                    <p className="text-xs text-gray-500">Show anonymous feedback in reports</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.reportSettings.includeAnonymousData}
                      onChange={(e) => updateSetting('reportSettings', 'includeAnonymousData', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Display Settings</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Chart Type
                  </label>
                  <select
                    value={settings.displaySettings.defaultChartType}
                    onChange={(e) => updateSetting('displaySettings', 'defaultChartType', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="area">Area Chart</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-sm text-gray-700">Show Branch Comparison</label>
                    <p className="text-xs text-gray-500">Display branch comparison in analytics</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.displaySettings.showBranchComparison}
                      onChange={(e) => updateSetting('displaySettings', 'showBranchComparison', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-sm text-gray-700">Show Trend Analysis</label>
                    <p className="text-xs text-gray-500">Display trend analysis charts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.displaySettings.showTrendAnalysis}
                      onChange={(e) => updateSetting('displaySettings', 'showTrendAnalysis', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                saving
                  ? 'bg-purple-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
