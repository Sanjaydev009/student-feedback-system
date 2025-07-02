'use client';

import { useState } from 'react';
import api from '@/utils/api';

export default function EmailTestPanel() {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [emailStatus, setEmailStatus] = useState<any>(null);

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/api/test/test-email', { email: testEmail });
      setMessage(`✅ ${response.data.message}`);
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.message || 'Failed to send test email'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkEmailStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/test/email-status');
      setEmailStatus(response.data);
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.message || 'Failed to check email status'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">📧 Email Configuration Test</h3>
      
      <div className="space-y-4">
        {/* Email Status Check */}
        <div>
          <button
            onClick={checkEmailStatus}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Email Configuration'}
          </button>
          
          {emailStatus && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Email Service Status:</h4>
              <div className="text-sm space-y-1">
                <p>Service Ready: {emailStatus.emailServiceReady ? '✅ Yes' : '❌ No'}</p>
                <p>Email User: {emailStatus.configuration.emailUser}</p>
                <p>Email Password: {emailStatus.configuration.emailPassword}</p>
                <p>Email Service: {emailStatus.configuration.emailService}</p>
                {emailStatus.configuration.smtpHost !== 'Not configured' && (
                  <p>SMTP Host: {emailStatus.configuration.smtpHost}</p>
                )}
              </div>
              
              {emailStatus.configurationCheck && !emailStatus.configurationCheck.isConfigured && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <h5 className="font-medium text-red-800 mb-2">⚠️ Configuration Issues:</h5>
                  <ul className="text-sm text-red-700 space-y-1">
                    {emailStatus.configurationCheck.issues.map((issue: string, index: number) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                  <h5 className="font-medium text-red-800 mt-3 mb-2">💡 Suggestions:</h5>
                  <ul className="text-sm text-red-700 space-y-1">
                    {emailStatus.configurationCheck.suggestions.map((suggestion: string, index: number) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {emailStatus.configurationCheck?.isConfigured && !emailStatus.emailServiceReady && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <h5 className="font-medium text-yellow-800 mb-2">🔧 Gmail Setup Required:</h5>
                  <p className="text-sm text-yellow-700 mb-2">
                    Configuration looks correct, but authentication is failing. 
                    For Gmail, you need an <strong>App Password</strong>:
                  </p>
                  <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://myaccount.google.com/security" target="_blank" className="underline">Google Account Security</a></li>
                    <li>Enable "2-Step Verification" if not already enabled</li>
                    <li>Click "App passwords" → "Mail" → "Other"</li>
                    <li>Generate a 16-character App Password</li>
                    <li>Update your .env file with this App Password</li>
                  </ol>
                  <p className="text-sm text-yellow-600 mt-2">
                    📖 See <code>GMAIL_SETUP_GUIDE.md</code> for detailed instructions.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test Email Form */}
        <form onSubmit={handleTestEmail} className="space-y-3">
          <div>
            <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Test Email Address:
            </label>
            <input
              type="email"
              id="testEmail"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email to send test message"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Test Email'}
          </button>
        </form>

        {/* Results */}
        {message && (
          <div className={`p-3 rounded ${
            message.startsWith('✅') 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h4 className="font-medium text-blue-900 mb-2">📋 Setup Instructions:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Configure your email settings in the backend .env file</li>
            <li>For Gmail: Enable 2FA and create an App Password</li>
            <li>Use the "Check Email Configuration" button to verify setup</li>
            <li>Send a test email to confirm emails are working</li>
            <li>Once configured, all user registrations will automatically send login credentials</li>
          </ol>
          <p className="text-sm text-blue-600 mt-2">
            📖 See EMAIL_SETUP.md for detailed configuration instructions.
          </p>
        </div>
      </div>
    </div>
  );
}
