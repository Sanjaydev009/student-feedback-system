import axios from 'axios';

// Get API URL from environment variables or fallback to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// For debugging
console.log('API_URL is:', API_URL);

// Check if we're in a browser environment before making CORS debugging statements
if (typeof window !== 'undefined') {
  console.log('🔍 CORS debugging enabled - Your current origin is:', window.location.origin);
  console.log('🔄 Will be making cross-origin requests to:', API_URL);
}

// Create custom axios instance with proper CORS configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 20000, // Increase timeout to 20 seconds for slow connections
  withCredentials: false, // Disable sending cookies with cross-origin requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'X-Requested-With': 'XMLHttpRequest' // Add this for better CORS compatibility
  }
});

// Add token and cache-busting to all requests
api.interceptors.request.use(config => {
  // Add token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add cache-busting parameter to GET requests - UPDATED WITH FINAL UNIQUE IDENTIFIER
  if (config.method === 'get') {
    console.log('🚨🚨🚨 API UTILITY: Cache-busting active for request:', config.url);
    config.params = config.params || {};
    config.params['_t'] = new Date().getTime();
    
    // Disable browser caching for GET requests
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Handle response errors globally
api.interceptors.response.use(
  response => response,
  async (error) => {
    // Log the detailed error for debugging
    console.group('API Error Details');
    console.error('Original error:', error);
    console.error('Request URL:', error.config?.url);
    console.error('Request method:', error.config?.method);
    console.error('Request headers:', error.config?.headers);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    console.groupEnd();
    
    // Detect if error is related to CORS or network
    const isCorsOrNetworkError = !error.response && (
      error.message.includes('Network Error') || 
      error.message.includes('Failed to fetch') || 
      error.message.toLowerCase().includes('cors') || 
      error.message.includes('cross-origin') ||
      error.message.includes('blocked by CORS policy')
    );
      
    if (isCorsOrNetworkError) {
      console.error('CORS or Network Error detected:', error.message);
      // Try to provide more helpful error message
      error.message = 'Unable to connect to the server. Please check your connection and CORS configuration.';
      
      // Add extra debugging info
      error.corsDetails = {
        detectedType: 'CORS/Network Error',
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers
      };
    }
    
    // Handle session expiration or unauthorized access
    if (error.response?.status === 401) {
      // Avoid showing multiple alerts by checking if we're already on the login page
      const isLoginPage = window.location.pathname.includes('login');
      if (!isLoginPage) {
        console.log('Session expired. Redirecting to login page.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    // Handle 500 Internal Server Errors
    else if (error.response?.status === 500) {
      console.error('Server error (500):', error.message);
      console.error('Response data:', error.response.data);
      error.message = 'The server encountered an internal error. Please try again later or contact support.';
      
      // Log additional debugging info
      console.error('Request details for 500 error:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
    }
    
    // Network errors
    else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error.message);
      error.message = 'Request timed out. The server took too long to respond.';
    }
    else if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    // Log detailed error info for debugging - safely handle errors with any structure
    try {
      console.error('API Error:', {
        url: error?.config?.url || 'unknown',
        method: error?.config?.method || 'unknown',
        status: error?.response?.status || 'unknown',
        statusText: error?.response?.statusText || 'unknown',
        message: error?.message || 'Unknown error',
        stack: error?.stack
      });
    } catch (logError) {
      console.error('Error logging API error:', logError);
      console.error('Original error:', error);
    }
    
    return Promise.reject(error);
  }
);

// Utility function to check server health
export const checkServerHealth = async (timeoutMs = 5000): Promise<boolean> => {
  // Even in development mode, we want to actually check the server
  // This helps catch CORS issues during development
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try {
        controller.abort();
      } catch (abortError) {
        console.error('Error aborting health check:', abortError);
      }
    }, timeoutMs);
    
    try {
      // Verify that we are using the correct API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      console.log(`📡 Checking server health at: ${apiUrl}/api/health`);
      
      // Try the dedicated health endpoint first with mode: 'cors' to explicitly test CORS
      try {
        const response = await fetch(`${apiUrl}/api/health`, {
          signal: controller.signal,
          method: 'GET',
          mode: 'cors', // Explicitly request CORS
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Accept': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        // Check if CORS headers are present
        const corsHeaders = {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-methods': response.headers.get('access-control-allow-methods')
        };
        
        console.log('Health check CORS headers:', corsHeaders);
        
        // Log the successful health check
        if (response.ok) {
          try {
            const data = await response.clone().json();
            console.log('✅ Server is healthy:', data);
          } catch (parseError) {
            console.log('✅ Server responded but could not parse JSON');
          }
          return true;
        } else {
          console.error('❌ Server returned non-OK status:', response.status);
          return false;
        }
      } catch (error) {
        console.error('❌ Health endpoint failed with error:', error);
        
        // Try root path as fallback
        console.log('Trying root path as fallback...');
        const rootResponse = await fetch(`${apiUrl}/`, {
          signal: controller.signal,
          method: 'GET',
          mode: 'cors',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (rootResponse.ok) {
          console.log('✅ Root path is accessible');
          return true;
        } else {
          console.error('❌ Root path returned non-OK status:', rootResponse.status);
          return false;
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('❌ All health checks failed:', fetchError);
      
      // Check if it's a CORS error
      const errorString = String(fetchError);
      if (errorString.includes('CORS') || errorString.includes('cross-origin')) {
        console.error('🚫 CORS ERROR DETECTED: Your browser is blocking cross-origin requests');
        console.error('Please ensure the backend server has proper CORS headers enabled');
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Server health check failed with unexpected error:', error);
    return false;
  }
};

export default api;