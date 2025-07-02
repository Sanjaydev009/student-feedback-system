'use client';

import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import api from '@/utils/api-debug';
import Link from 'next/link';

export default function GenerateTestData() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const { showToast } = useToast();

  const generateTestData = async () => {
    try {
      setIsLoading(true);
      setResults(['Starting test data generation...']);

      // 1. Create test users
      try {
        const usersResponse = await api.post('/api/dev/create-test-accounts');
        setResults(prev => [...prev, '✅ Created test admin and student accounts']);
      } catch (error: any) {
        if (error.response?.status === 400) {
          setResults(prev => [...prev, '⚠️ Test accounts already exist (skipping)']);
        } else {
          throw error;
        }
      }

      // 2. Create a dean account
      try {
        await api.post('/api/auth/register', {
          name: 'Test Dean',
          email: 'dean@test.com',
          password: 'dean123',
          role: 'dean'
        });
        setResults(prev => [...prev, '✅ Created dean account (dean@test.com / dean123)']);
      } catch (error: any) {
        if (error.response?.status === 400) {
          setResults(prev => [...prev, '⚠️ Dean account already exists (skipping)']);
        } else {
          throw error;
        }
      }

      // 3. Create test subjects
      try {
        // Check if we already have subjects
        const subjectsResponse = await api.get('/api/subjects');
        if (Array.isArray(subjectsResponse.data) && subjectsResponse.data.length > 0) {
          setResults(prev => [...prev, `ℹ️ ${subjectsResponse.data.length} subjects already exist (skipping creation)`]);
        } else {
          // Create some test subjects
          await api.post('/api/subjects', {
            name: 'Advanced Database Systems',
            code: 'CS501',
            semester: 5,
            branch: 'Computer Science',
            instructor: 'Dr. Jane Smith'
          });
          
          await api.post('/api/subjects', {
            name: 'Machine Learning',
            code: 'CS502',
            semester: 5,
            branch: 'Computer Science',
            instructor: 'Prof. Michael Johnson'
          });
          
          await api.post('/api/subjects', {
            name: 'Software Architecture',
            code: 'CS503',
            semester: 5,
            branch: 'Computer Science',
            instructor: 'Dr. Robert Williams'
          });
          
          setResults(prev => [...prev, '✅ Created 3 test subjects']);
        }
      } catch (error) {
        console.error('Error checking/creating subjects:', error);
        setResults(prev => [...prev, '❌ Failed to check/create subjects']);
        throw error;
      }

      // 4. Create some test feedback
      try {
        const subjectsResponse = await api.get('/api/subjects');
        if (Array.isArray(subjectsResponse.data) && subjectsResponse.data.length > 0) {
          const subject = subjectsResponse.data[0];
          
          // Try to create a feedback
          try {
            await api.post('/api/feedback', {
              subject: subject._id,
              responses: [
                { question: 'How effective were the lectures?', answer: '4' },
                { question: 'Were the assignments helpful?', answer: '5' },
                { question: 'Was the pace comfortable?', answer: '4' },
                { question: 'How well did the instructor explain?', answer: '5' },
                { question: 'Were materials adequate?', answer: '4' }
              ],
              comments: 'This is a test feedback generated for demonstration purposes.'
            });
            
            setResults(prev => [...prev, '✅ Created test feedback']);
          } catch (error: any) {
            setResults(prev => [...prev, '⚠️ Could not create test feedback (may need to be logged in as student)']);
          }
        }
      } catch (error) {
        setResults(prev => [...prev, '❌ Failed to create feedback']);
      }

      // All done!
      setResults(prev => [...prev, '✅ Test data generation complete!']);
      showToast('Test data generated successfully!', 'success');
    } catch (error: any) {
      console.error('Error generating test data:', error);
      setResults(prev => [...prev, `❌ Error: ${error.message || 'Unknown error'}`]);
      showToast(`Error generating test data: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Generate Test Data</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <p className="mb-4 text-gray-600">
          This utility will generate test data for the Student Feedback System, including:
        </p>
        <ul className="list-disc list-inside mb-6 text-gray-600">
          <li>A dean account (dean@test.com / dean123)</li>
          <li>Sample subjects</li>
          <li>Sample feedback data</li>
        </ul>
        
        <button
          onClick={generateTestData}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Generating...' : 'Generate Test Data'}
        </button>
      </div>
      
      {results.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-2">Results</h2>
          <div className="bg-gray-50 p-4 rounded-md font-mono text-sm">
            {results.map((result, index) => (
              <div key={index} className="py-1">{result}</div>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Next Steps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/debug/setup-dean" className="text-center p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg">
            Setup Dean Account
          </Link>
          <Link href="/dean-dashboard/robust" className="text-center p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg">
            Go to Robust Dashboard
          </Link>
          <Link href="/dean-dashboard" className="text-center p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg">
            Go to Dean Dashboard
          </Link>
          <Link href="/debug/token" className="text-center p-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg">
            Debug Token
          </Link>
        </div>
      </div>
    </div>
  );
}
