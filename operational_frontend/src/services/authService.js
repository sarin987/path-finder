import axios from 'axios';
import { BASE_URL, API_VERSION } from '../config';

const API_BASE_URL = `${BASE_URL}${API_VERSION}`;
import secureStorage from '../utils/secureStorage';

// Login user with email and password
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password,
    });

    if (response.data.token) {
      // Save token and user data to secure storage
      await secureStorage.setItem('userToken', response.data.token);
      await secureStorage.setItem('userData', JSON.stringify(response.data.user));

      // Set default auth header
      axios.defaults.headers.common.Authorization = `Bearer ${response.data.token}`;

      return response.data.user;
    }

    throw new Error('Authentication failed');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    // Remove tokens and user data
    await Promise.all([
      secureStorage.removeItem('userToken'),
      secureStorage.removeItem('userData'),
    ]);

    // Remove auth header
    delete axios.defaults.headers.common.Authorization;

    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const userData = await secureStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  const token = await secureStorage.getItem('userToken');
  return !!token;
};
