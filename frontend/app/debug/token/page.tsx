'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';

export default function TokenDebugPage() {
  const [token, setToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
      
      if (storedToken) {
        // Try to decode the JWT token
        const payloadBase64 = storedToken.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));
        setDecodedToken(payload);
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      showToast('Failed to decode token', 'error');
    }
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Token Debug</h1>
      
      {token ? (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-md shadow">
            <h2 className="text-lg font-semibold mb-2">Token</h2>
            <div className="bg-gray-100 p-3 rounded overflow-x-auto">
              <code className="whitespace-pre-wrap break-all">{token}</code>
            </div>
          </div>
          
          {decodedToken && (
            <div className="bg-white p-4 rounded-md shadow">
              <h2 className="text-lg font-semibold mb-2">Decoded Token</h2>
              <div className="bg-gray-100 p-3 rounded overflow-x-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(decodedToken, null, 2)}
                </pre>
              </div>
              
              <div className="mt-4 p-3 border border-blue-200 bg-blue-50 rounded">
                <h3 className="font-medium text-blue-700 mb-1">Token Info</h3>
                <ul className="list-disc list-inside text-blue-900">
                  <li>User ID: {decodedToken.id || 'Not found'}</li>
                  <li>Role: {decodedToken.role || 'Not found'}</li>
                  <li>Expires: {decodedToken.exp ? new Date(decodedToken.exp * 1000).toLocaleString() : 'Not found'}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-red-700">No authentication token found in localStorage.</p>
          <p className="mt-2 text-red-600 text-sm">Please log in first to get a token.</p>
        </div>
      )}
    </div>
  );
}
