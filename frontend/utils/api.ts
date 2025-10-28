import axios from 'axios';

// Get API URL from environment variables with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

console.log('🔗 API URL:', API_URL);

// Create axios instance with production-ready configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds for production
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to add auth token and logging
api.interceptors.request.use(
  (config) => {
    // Add token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp for cache busting in production
    if (process.env.NODE_ENV === 'production' && config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() };
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname.includes('login');
      if (!isLoginPage) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    // Retry logic for server errors (500) - retry once
    if (error.response?.status === 500 && !error.config.__retry) {
      error.config.__retry = true;
      console.log('Retrying request due to server error...');
      return api.request(error.config);
    }
    
    // Network errors
    if (!error.response) {
      console.error('Network error - server may be unreachable');
      error.message = 'Unable to connect to server. Please check your internet connection.';
    }
    
    return Promise.reject(error);
  }
);

// Health check utility for monitoring
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

export default api;