'use client';

import { useState } from 'react';
import BulkStudentUpload from '@/components/BulkStudentUpload';

export default function BulkUploadPage() {
  const [uploadCompleted, setUploadCompleted] = useState(false);

  const handleUploadComplete = () => {
    setUploadCompleted(true);
    
    // Reset the flag after 5 seconds to allow the user to see the success message
    setTimeout(() => {
      setUploadCompleted(false);
    }, 5000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bulk Student Upload</h1>
            <p className="text-gray-600">Upload multiple students at once using a CSV file</p>
          </div>
        </div>
        {uploadCompleted && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-green-700">Upload completed successfully!</p>
          </div>
        )}
      </div>

      {/* Bulk Upload Component */}
      <BulkStudentUpload onUploadComplete={handleUploadComplete} />
      
      {/* Instructions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Instructions</h2>
        <div className="space-y-3 text-gray-700">
          <p>Follow these steps to upload students in bulk:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Prepare a CSV file with the following columns: <code className="bg-gray-100 px-1 py-0.5 rounded">name</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">email</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">rollNumber</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">branch</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">year</code>.</li>
            <li>Ensure all required fields are completed for each student.</li>
            <li>Upload the CSV file using the form above.</li>
            <li>Review any errors that may occur during the upload process.</li>
            <li>Successfully uploaded students will receive their default password automatically.</li>
            <li>Students will be required to change their password on first login.</li>
          </ol>
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="flex items-center text-blue-700 mb-2">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              Student accounts will be created with auto-generated secure passwords.
            </p>
            <p className="flex items-center text-green-700">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
              Login credentials will be automatically sent to each student's email address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
