import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import { API_ROUTES } from '../config';
import secureStorage from '../utils/secureStorage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SessionExpiredScreen from '../screens/auth/SessionExpiredScreen';
import LoginScreen from '../screens/auth/LoginScreen';

// Constants
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before token expires
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  
  // Use refs for timers to persist between renders
  const sessionTimer = useRef(null);
  const tokenRefreshTimer = useRef(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (sessionTimer.current) {
      clearTimeout(sessionTimer.current);
      sessionTimer.current = null;
    }
    if (tokenRefreshTimer.current) {
      clearTimeout(tokenRefreshTimer.current);
      tokenRefreshTimer.current = null;
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      clearTimers();
      
      // Clear secure storage
      await Promise.all([
        secureStorage.removeItem('userToken'),
        secureStorage.removeItem('userData')
      ]);
      
      // Clear axios auth header
      delete axios.defaults.headers.common['Authorization'];
      
      setUser(null);
      setSessionExpired(false);
      setAuthError(null);
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      setAuthError('Failed to log out');
      return false;
    } finally {
      setLoading(false);
    }
  }, [clearTimers]);

  // Reset session timer on user activity
  const resetSessionTimer = useCallback(() => {
    clearTimers();
    sessionTimer.current = setTimeout(() => {
      setSessionExpired(true);
      logout();
    }, SESSION_TIMEOUT);
  }, [clearTimers, logout]);

  // Refresh token before it expires
  const refreshToken = useCallback(async () => {
    try {
      const response = await axios.post(API_ROUTES.auth.refreshToken, {}, {
        withCredentials: true // Send refresh token cookie if using httpOnly cookies
      });
      
      const { token, user: userData } = response.data;
      
      if (token) {
        // Update token in storage and axios header
        await secureStorage.setItem('userToken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update user data if provided
        if (userData) {
          await secureStorage.setItem('userData', userData);
          setUser(userData);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh token is invalid, log the user out
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        await logout();
      }
      return false;
    }
  }, [logout]);
  
  // Schedule token refresh
  const scheduleTokenRefresh = useCallback((expiresInMs) => {
    if (tokenRefreshTimer.current) {
      clearTimeout(tokenRefreshTimer.current);
    }
    
    // Schedule refresh 5 minutes before token expires
    const refreshTime = Math.max(expiresInMs - TOKEN_REFRESH_THRESHOLD, 0);
    
    tokenRefreshTimer.current = setTimeout(async () => {
      const success = await refreshToken();
      if (success) {
        // Schedule next refresh
        const newExpiresIn = expiresInMs - (Date.now() - (expiresInMs - refreshTime));
        scheduleTokenRefresh(newExpiresIn);
      }
    }, refreshTime);
  }, [refreshToken]);

  // Check authentication state
  const checkAuthState = useCallback(async () => {
    try {
      const [token, userData] = await Promise.all([
        secureStorage.getItem('userToken'),
        secureStorage.getItem('userData')
      ]);

      if (token && userData) {
        // Set axios default auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        resetSessionTimer();
      }
    } catch (error) {
      console.error('Auth state check error:', error);
      setAuthError('Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  }, [resetSessionTimer]);

  // Check authentication state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const [token, userData] = await Promise.all([
          secureStorage.getItem('userToken'),
          secureStorage.getItem('userData')
        ]);

        if (token && userData) {
          // Set axios default auth header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(userData);
          resetSessionTimer();
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setAuthError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
    
    // Cleanup on unmount
    return () => {
      clearTimers();
    };
  }, [clearTimers, resetSessionTimer]);

  // Handle user activity
  useEffect(() => {
    if (!user) return;
    
    let subscription;
    
    // Reset timer on app state change (app comes to foreground)
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        resetSessionTimer();
      }
    };
    
    // Import AppState dynamically to avoid SSR issues
    import('react-native').then(({ AppState }) => {
      // Initial reset
      resetSessionTimer();
      
      // Subscribe to app state changes
      subscription = AppState.addEventListener('change', handleAppStateChange);
    });
    
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [user, resetSessionTimer]);

  // Login user with phone and password or OTP
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Determine if this is a password or OTP login
      const isOtpLogin = credentials.hasOwnProperty('otp');
      
      let response;
      
      if (isOtpLogin) {
        // Handle OTP login
        response = await axios.post(API_ROUTES.auth.verifyOtp, {
          phone: credentials.phone,
          otp: credentials.otp
        });
      } else {
        // Handle password login
        response = await axios.post(API_ROUTES.auth.login, {
          phone: credentials.phone,
          password: credentials.password
        });
      }
      
      const { token, ...userData } = response.data;
      
      if (!token || !userData) {
        throw new Error('Invalid response from server');
      }
      
      // Store token and user data
      await Promise.all([
        secureStorage.setItem('userToken', token),
        secureStorage.setItem('userData', userData),
      ]);
      
      // Set axios default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      resetSessionTimer();
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Failed to sign in';
      
      // Handle specific error cases
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        switch (error.response.status) {
          case 401:
            errorMessage = 'Invalid phone number or password';
            break;
          case 429:
            errorMessage = 'Too many attempts. Please try again later.';
            break;
          case 403:
            errorMessage = 'This account has been disabled';
            break;
          default:
            errorMessage = error.response.data?.message || 'An error occurred during sign in';
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [resetSessionTimer]);
  
  // Update user data
  const updateUser = useCallback(async (userData) => {
    try {
      if (!user) return false;
      const updatedUser = { ...user, ...userData };
      await secureStorage.setItem('userData', updatedUser);
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  }, [user]);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!user;
  }, [user]);

  // Get authentication headers for API calls
  const getAuthHeaders = useCallback(async () => {
    try {
      const token = await secureStorage.getItem('userToken');
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Failed to get auth headers:', error);
      return {};
    }
  }, []);

  // Reset session when it expires
  const resetSession = useCallback(() => {
    setSessionExpired(false);
    resetSessionTimer();
  }, [resetSessionTimer]);

  const contextValue = {
    user,
    loading,
    error: authError,
    login,
    logout,
    isAuthenticated,
    updateUser,
    getAuthHeaders,
    resetSession,
    sessionExpired,
    resetError: () => setAuthError(null),
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {sessionExpired ? (
        <SessionExpiredScreen onRetry={resetSession} />
      ) : loading ? (
        <LoadingSpinner />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher Order Component for protected routes
export const withAuth = (Component) => {
  return (props) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
      return <LoadingSpinner />;
    }
    
    if (!isAuthenticated()) {
      return <LoginScreen />;
    }
    
    return <Component {...props} />;
  };
};
