'use client';

import { useState } from 'react';
import { parse } from 'papaparse';
import api from '@/utils/api';

interface StudentData {
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
}

export default function BulkStudentUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<StudentData[]>([]);
  const [uploadSummary, setUploadSummary] = useState<{
    total: number;
    success: number;
    failed: number;
    failures: { email: string; reason: string }[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setError('');
    setUploadStatus('idle');
    
    // Parse CSV for preview
    if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
      parse(selectedFile, {
        header: true,
        complete: (results) => {
          try {
            const allData = results.data as any[];
            
            // Filter out empty rows for validation and preview
            const data = allData.filter(row => {
              // Check if the row has any meaningful data
              const hasAnyData = row.name || row.email || row.rollNumber || row.branch;
              return hasAnyData;
            });
            
            // Validate required columns
            const requiredColumns = ['name', 'email', 'rollNumber', 'branch'];
            const headers = Object.keys(data[0] || {});
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));
            
            if (missingColumns.length > 0) {
              setError(`CSV file is missing required columns: ${missingColumns.join(', ')}`);
              return;
            }
            
            if (data.length === 0) {
              setError('CSV file appears to be empty or contains no valid data rows');
              return;
            }
            
            setPreview(data.slice(0, 5) as StudentData[]);
          } catch (err) {
            setError('Invalid CSV format. Please check your file.');
          }
        },
        error: (error) => {
          setError(`Failed to parse CSV: ${error.message}`);
        }
      });
    } else {
      setError('Please upload a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    setUploadStatus('loading');
    setError('');
    
    try {
      // Parse CSV data
      const parseResult = await new Promise<any>((resolve, reject) => {
        parse(file, {
          header: true,
          complete: (results) => resolve(results.data),
          error: (error) => reject(new Error(`Failed to parse CSV: ${error.message}`))
        });
      });
      
      // Filter out empty rows and validate data
      const allStudents = parseResult as StudentData[];
      
      // Filter out completely empty rows (common at the end of CSV files)
      const students = allStudents.filter(student => {
        // Check if all fields are empty/undefined/null
        const hasAnyData = student.name || student.email || student.rollNumber || student.branch;
        return hasAnyData;
      });
      
      console.log('Total rows from CSV:', allStudents.length);
      console.log('Valid rows after filtering:', students.length);
      console.log('First few rows:', students.slice(0, 3));
      
      const validationErrors = students.reduce<{index: number; message: string}[]>((errors, student, index) => {
        // Trim whitespace from all fields
        const trimmedStudent = {
          name: student.name?.trim() || '',
          email: student.email?.trim() || '',
          rollNumber: student.rollNumber?.trim() || '',
          branch: student.branch?.trim() || ''
        };
        
        console.log(`Row ${index + 1}:`, trimmedStudent);
        
        if (!trimmedStudent.name || !trimmedStudent.email || !trimmedStudent.rollNumber || !trimmedStudent.branch) {
          errors.push({
            index,
            message: `Row ${index + 1} is missing required fields (name: '${trimmedStudent.name}', email: '${trimmedStudent.email}', rollNumber: '${trimmedStudent.rollNumber}', branch: '${trimmedStudent.branch}')`
          });
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedStudent.email)) {
          errors.push({
            index,
            message: `Row ${index + 1} has an invalid email format`
          });
        }
        return errors;
      }, []);
      
      if (validationErrors.length > 0) {
        setError(`Found ${validationErrors.length} errors. First error: ${validationErrors[0].message}`);
        setUploadStatus('error');
        return;
      }
      
      if (students.length === 0) {
        setError('No valid student data found in the CSV file');
        setUploadStatus('error');
        return;
      }
      
      // Clean and prepare data for upload
      const cleanedStudents = students.map(student => ({
        name: student.name?.trim() || '',
        email: student.email?.trim() || '',
        rollNumber: student.rollNumber?.trim() || '',
        branch: student.branch?.trim() || ''
      }));
      
      // Send data to API
      const response = await api.post('/api/auth/register/bulk', {
        students: cleanedStudents
      });
      
      setUploadSummary(response.data.results);
      setUploadStatus('success');
      onUploadComplete();
      
    } catch (err: any) {
      console.error('Bulk upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload students. Please try again.');
      setUploadStatus('error');
    }
  };
  
  const handleReset = () => {
    setFile(null);
    setError('');
    setUploadStatus('idle');
    setPreview([]);
    setUploadSummary(null);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Bulk Student Upload</h2>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-2">Upload a CSV file with the following columns:</p>
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <code>name, email, rollNumber, branch</code>
        </div>
      </div>
      
      {uploadStatus !== 'success' ? (
        <>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">CSV file only</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".csv" 
                onChange={handleFileChange} 
              />
            </label>
          </div>
          
          {file && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="font-medium">Selected file: {file.name}</p>
              
              {preview.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium mb-2">Preview (first 5 rows):</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Email</th>
                          <th className="px-4 py-2 text-left">Roll Number</th>
                          <th className="px-4 py-2 text-left">Branch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((student, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2">{student.name}</td>
                            <td className="px-4 py-2">{student.email}</td>
                            <td className="px-4 py-2">{student.rollNumber}</td>
                            <td className="px-4 py-2">{student.branch}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {error && <p className="mt-4 text-red-500">{error}</p>}
          
          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleUpload}
              disabled={!file || uploadStatus === 'loading'}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                !file || uploadStatus === 'loading' 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {uploadStatus === 'loading' ? 'Uploading...' : 'Upload Students'}
            </button>
            
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-700 font-medium">Upload completed successfully!</p>
            </div>
          </div>
          
          {uploadSummary && (
            <div className="mb-4">
              <p className="font-medium mb-2">Summary:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Total processed: {uploadSummary.total}</li>
                <li className="text-green-600">Successfully added: {uploadSummary.success}</li>
                {uploadSummary.failed > 0 && (
                  <li className="text-red-600">Failed: {uploadSummary.failed}</li>
                )}
              </ul>
              
              {uploadSummary.failures.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium mb-2">Failures:</p>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Email</th>
                          <th className="px-4 py-2 text-left">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadSummary.failures.map((failure, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2">{failure.email}</td>
                            <td className="px-4 py-2 text-red-600">{failure.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Upload Another File
          </button>
        </div>
      )}
    </div>
  );
}
