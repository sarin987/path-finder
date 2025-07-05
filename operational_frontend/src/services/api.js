import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, WS_URL } from '../config/api';
import { Platform } from 'react-native';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log(`Making ${config.method.toUpperCase()} request to:`, config.url);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added auth token to request headers');
      } else {
        console.warn('No auth token found in storage');
      }
      
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        url: error.config.url,
        method: error.config.method,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error - No Response:', {
        url: error.config.url,
        method: error.config.method,
        message: error.message
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Try to refresh token here if needed
        // const refreshToken = await AsyncStorage.getItem('refreshToken');
        // const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        // await AsyncStorage.setItem('token', response.data.token);
        // originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
        // return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Redirect to login or handle token refresh failure
      }
    }
    
    return Promise.reject(error);
  }
);

// Export WebSocket URL
export { WS_URL };

export default api;
