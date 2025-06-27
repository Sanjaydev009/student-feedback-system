import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001',
  timeout: 10000, // Set timeout to 10 seconds
});

// Add token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Handle response errors globally
api.interceptors.response.use(
  response => response,
  async (error) => {
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
    
    // Network errors
    else if (error.code === 'ECONNABORTED' || !error.response) {
      console.error('Network error:', error.message);
    }
    
    // Log detailed error info for debugging - safely handle errors with any structure
    try {
      console.error('API Error:', {
        url: error?.config?.url || 'unknown',
        method: error?.config?.method || 'unknown',
        status: error?.response?.status || 'unknown',
        statusText: error?.response?.statusText || 'unknown',
        message: error?.message || 'Unknown error'
      });
    } catch (logError) {
      console.error('Error logging API error:', logError);
      console.error('Original error:', error);
    }
    
    return Promise.reject(error);
  }
);

// Utility function to check server health
export const checkServerHealth = async (timeoutMs = 3000): Promise<boolean> => {
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
      const response = await fetch('http://localhost:5001/api/health', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (fetchError) {
      console.error('Fetch error during health check:', fetchError);
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // Catch any other errors in the outer try block
    try {
      console.error('Server health check failed:', error);
    } catch (logError) {
      console.error('Error logging health check failure');
    }
    return false;
  }
};

export default api;