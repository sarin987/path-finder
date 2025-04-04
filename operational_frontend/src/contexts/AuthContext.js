import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ROUTES } from '../config';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    // Check for stored token when app loads
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    try {
      const [storedToken, userData] = await AsyncStorage.multiGet([
        'userToken',
        'userData'
      ]);
      
      if (storedToken[1] && userData[1]) {
        setToken(storedToken[1]);
        setUser(JSON.parse(userData[1]));
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken[1]}`;
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      // Clear potentially corrupted data
      await AsyncStorage.multiRemove(['userToken', 'userData']);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post(`${API_ROUTES.auth}/login`, credentials);
      const { token: newToken, user: userData } = response.data;
      
      // Store auth data
      await AsyncStorage.multiSet([
        ['userToken', newToken],
        ['userData', JSON.stringify(userData)]
      ]);
      
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      // Clear any existing auth data on login failure
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      setToken(null);
      setUser(null);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const googleSignIn = async (googleToken, userType) => {
    try {
      const response = await axios.post(`${API_ROUTES.auth}/google`, {
        token: googleToken,
        userType
      });
      
      const { token, user: userData } = response.data;
      
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      setToken(token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Google sign-in failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_ROUTES.auth}/register`, userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      // Clear auth data
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      const response = await axios.put(
        `${API_ROUTES.users}/${user.id}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const updatedUser = { ...user, ...response.data };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Profile update failed'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        googleSignIn,
        register,
        logout,
        updateProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
