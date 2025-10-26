'use client';

// Help & Documentation page for Student Feedback System
import AdminNavbar from '@/components/AdminNavbar';
import AdminSidebar from '@/components/AdminSidebar';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="flex pt-16">
        <AdminSidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Help & Documentation</h1>
            
            <div className="space-y-8">
              {/* Quick Start Guide */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-blue-600">🚀 Quick Start Guide</h2>
                <div className="space-y-3">
                  <p className="text-gray-700">Welcome to the Student Feedback System! Here's how to get started:</p>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li><strong>Configure Email:</strong> Set up email credentials for sending user passwords</li>
                    <li><strong>Add Subjects:</strong> Create subjects that students will provide feedback for</li>
                    <li><strong>Register Students:</strong> Add students individually or in bulk via CSV upload</li>
                    <li><strong>Register Faculty:</strong> Add faculty members who teach the subjects</li>
                    <li><strong>Create Feedback Periods:</strong> Set up time periods when feedback collection is active</li>
                    <li><strong>Monitor & Analyze:</strong> Use the dashboard to view feedback reports and analytics</li>
                  </ol>
                </div>
              </div>

              {/* System Features */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-green-600">📋 System Features</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">User Management</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Student registration (individual & bulk)</li>
                      <li>• Faculty and staff management</li>
                      <li>• Role-based access control</li>
                      <li>• Automatic password generation</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Feedback Collection</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Anonymous feedback system</li>
                      <li>• Multiple question types</li>
                      <li>• Subject-wise feedback</li>
                      <li>• Scheduled feedback periods</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Analytics & Reporting</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Real-time dashboard analytics</li>
                      <li>• Subject performance reports</li>
                      <li>• Faculty feedback summaries</li>
                      <li>• Exportable data formats</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">System Administration</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Subject and branch management</li>
                      <li>• Email configuration testing</li>
                      <li>• User activity monitoring</li>
                      <li>• System health checks</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Email Configuration */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-orange-600">📧 Email Configuration</h2>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    The system automatically sends login credentials to new users via email. 
                    To enable this feature, you need to configure email settings:
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-medium mb-2">For Gmail Setup:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                      <li>Go to <a href="https://myaccount.google.com/security" target="_blank" className="text-blue-600 underline">Google Account Security</a></li>
                      <li>Enable "2-Step Verification" if not already enabled</li>
                      <li>Go to "App passwords" → Select "Mail" → Select "Other"</li>
                      <li>Generate a 16-character App Password</li>
                      <li>Use this App Password (not your regular Gmail password) in the system</li>
                    </ol>
                  </div>

                  <div className="bg-blue-50 p-4 rounded">
                    <h3 className="font-medium mb-2">💡 Pro Tips:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                      <li>Test your email configuration using the "Settings" → "Email Test" panel</li>
                      <li>Keep your App Password secure and don't share it</li>
                      <li>If emails aren't sending, check your email service status first</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* User Roles */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-purple-600">👥 User Roles & Permissions</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2 text-purple-700">Admin</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Full system access</li>
                      <li>• User management</li>
                      <li>• Subject management</li>
                      <li>• System configuration</li>
                      <li>• Analytics and reports</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-blue-700">Student</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Submit feedback</li>
                      <li>• View own subjects</li>
                      <li>• Update profile</li>
                      <li>• Change password</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-green-700">HOD (Head of Department)</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• View department analytics</li>
                      <li>• Faculty performance reports</li>
                      <li>• Department subject management</li>
                      <li>• Student feedback summaries</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-red-700">Dean</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Institution-wide analytics</li>
                      <li>• Cross-department reports</li>
                      <li>• Performance comparisons</li>
                      <li>• Strategic insights</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Troubleshooting */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-red-600">🔧 Troubleshooting</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Common Issues & Solutions:</h3>
                    <div className="space-y-3">
                      <div className="border-l-4 border-yellow-400 pl-4">
                        <h4 className="font-medium text-yellow-800">Emails not sending</h4>
                        <p className="text-sm text-yellow-700">
                          Check email configuration in Settings → Email Test. 
                          Ensure you're using an App Password for Gmail, not your regular password.
                        </p>
                      </div>
                      <div className="border-l-4 border-blue-400 pl-4">
                        <h4 className="font-medium text-blue-800">Students can't login</h4>
                        <p className="text-sm text-blue-700">
                          Verify the student was registered properly and received their login credentials. 
                          Check if their email address is correct.
                        </p>
                      </div>
                      <div className="border-l-4 border-green-400 pl-4">
                        <h4 className="font-medium text-green-800">Feedback not appearing</h4>
                        <p className="text-sm text-green-700">
                          Ensure there's an active feedback period and students are registered for the correct subjects.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact & Support */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-600">📞 Contact & Support</h2>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    For technical support or system-related questions:
                  </p>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><strong>System Status:</strong> Check the dashboard for real-time system health</p>
                      <p><strong>Email Issues:</strong> Use the Email Test panel to diagnose problems</p>
                      <p><strong>Data Export:</strong> Reports can be exported from the Analytics section</p>
                      <p><strong>User Management:</strong> Bulk operations available via CSV upload</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}