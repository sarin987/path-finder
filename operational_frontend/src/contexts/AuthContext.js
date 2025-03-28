import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for stored token when app loads
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      if (storedToken) {
        setToken(storedToken);
        // Load user data using the token
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/login`, credentials);
      const { token, user: userData } = response.data;
      
      // Store token and user data
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      setToken(token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const googleSignIn = async (googleToken, userType) => {
    try {
      const response = await axios.post(`${API_URL}/google`, {
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
      const response = await axios.post(`${API_URL}/register`, userData);
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
      // Clear socket connection if exists
      if (socket?.connected) {
        socket.disconnect();
      }

      // Clear all stored tokens and user data
      await AsyncStorage.multiRemove([
        'userToken',
        'userRole',
        'userId',
        'phone',
        'user'
      ]);

      // Reset user state
      setUser(null);
      setIsAuthenticated(false);

      // Optional: Call backend logout endpoint if needed
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`,
          },
        });
      } catch (error) {
        console.log('Backend logout error:', error);
        // Continue with local logout even if backend fails
      }

    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      const response = await axios.put(
        `${API_URL}/users/${user.id}`,
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
