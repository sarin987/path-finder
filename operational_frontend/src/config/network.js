import axios from 'axios';
import { Storage, StorageKeys } from '../utils/storage';
import { BASE_URL, API_VERSION } from '.';
import { logError } from '../utils/logger';

// Use the centralized base URL configuration
const API_BASE_URL = BASE_URL;
console.log('Using backend URL:', API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

console.log('API Base URL:', `${API_BASE_URL}${API_VERSION}`);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    // const token = await Storage.getItem(StorageKeys.AUTH_TOKEN);
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    logError('Request Error', { error: error.message });
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle HTTP errors
      logError('API Error Response', {
        status: error.response.status,
        url: error.config.url,
        method: error.config.method,
        data: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      logError('No Response', {
        url: error.config?.url,
        method: error.config?.method,
        error: error.message
      });
    } else {
      // Something happened in setting up the request
      logError('Request Setup Error', { error: error.message });
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error) => {
  console.error('API Error:', {
    message: error.message,
    config: {
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
      baseURL: error.config?.baseURL,
    },
    response: error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
      headers: error.response.headers,
    } : undefined,
    request: error.request ? {
      // request information if available
    } : undefined,
    stack: error.stack,
  });

  let errorMessage = 'An error occurred';
  let statusCode = null;
  let data = null;

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    statusCode = error.response.status;
    data = error.response.data;
    
    if (statusCode === 401) {
      errorMessage = 'Your session has expired. Please login again.';
      // Clear any existing auth tokens
      Storage.removeItem(StorageKeys.AUTH_TOKEN);
    } else if (statusCode === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (statusCode === 404) {
      errorMessage = 'The requested resource was not found.';
    } else if (statusCode === 422) {
      // Handle validation errors
      if (data?.errors) {
        errorMessage = Object.values(data.errors).flat().join('\n');
      } else {
        errorMessage = data?.message || 'Validation failed';
      }
    } else if (statusCode >= 500) {
      errorMessage = 'Server error. Our team has been notified. Please try again later.';
    } else {
      errorMessage = data?.message || `Request failed with status code ${statusCode}`;
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received from server. Request details:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
    });
    errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
  } else if (error.message === 'Network Error') {
    // Network error (no internet connection)
    console.error('Network Error - No internet connection');
    errorMessage = 'Network error. Please check your internet connection and try again.';
  } else if (error.code === 'ECONNABORTED') {
    // Timeout error
    console.error('Request timeout:', error.config?.timeout);
    errorMessage = 'The request timed out. Please check your connection and try again.';
  } else if (error.message?.includes('timeout')) {
    errorMessage = 'The request took too long. Please check your connection and try again.';
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Request setup error:', error.message);
    errorMessage = error.message || 'An unexpected error occurred';
  }

  // Log the error with more context
  const errorContext = {
    timestamp: new Date().toISOString(),
    message: errorMessage,
    status: statusCode,
    url: error.config?.url,
    method: error.config?.method,
    baseURL: error.config?.baseURL,
    errorDetails: {
      originalError: error.message,
      stack: error.stack,
      responseData: data || error.response?.data,
    },
  };

  console.error('Error Context:', JSON.stringify(errorContext, null, 2));
  logError('API Error', errorContext);

  return {
    success: false,
    error: errorMessage,
    status: statusCode,
    data: data || error.response?.data,
    originalError: error,
  };
};

// Helper function to log API calls
const logApiCall = (method, url, data = {}) => {
  console.log(`API Call: ${method.toUpperCase()} ${url}`, {
    timestamp: new Date().toISOString(),
    data
  });
};

export const AuthAPI = {
  register: async (userData) => {
    const url = '/auth/register';
    logApiCall('post', url, { phone: userData.phone });
    
    try {
      const response = await api.post(url, userData);
      console.log('Register API Response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Register API Error:', error);
      return handleApiError(error);
    }
  },
  
  login: async (credentials) => {
    const url = '/auth/login';
    logApiCall('post', url, { phone: credentials.phone });
    
    try {
      const response = await api.post(url, credentials);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Login API Error:', error);
      return handleApiError(error);
    }
  },
  
  verifyOtp: async (otpData) => {
    const url = '/auth/verify-otp';
    logApiCall('post', url, { phone: otpData.phone });
    
    try {
      const response = await api.post(url, otpData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Verify OTP API Error:', error);
      return handleApiError(error);
    }
  },
  
  googleAuth: async (userData) => {
    const url = '/auth/google';
    logApiCall('post', url, { email: userData.email });
    
    try {
      const response = await api.post(url, userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Google Auth API Error:', error);
      return handleApiError(error);
    }
  }
};

// Export the configured axios instance
export default api;