import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import * as authService from '../services/authService';
import secureStorage from '../utils/secureStorage';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Constants
const TOKEN_REFRESH_THRESHOLD = 10 * 60 * 1000; // 10 minutes before token expires
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000; // Check token every 5 minutes

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Use refs for timers to persist between renders
  const sessionTimer = useRef(null);
  const tokenCheckInterval = useRef(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (sessionTimer.current) {
      clearTimeout(sessionTimer.current);
      sessionTimer.current = null;
    }
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
      tokenCheckInterval.current = null;
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      clearTimers();
      await authService.logout();
      setUser(null);
      setSessionExpired(false);
      setAuthError(null);
    } catch (error) {
      console.error('Logout error:', error);
      setAuthError('Failed to log out');
    } finally {
      setLoading(false);
    }
  }, [clearTimers]);

  // Reset session timer on user activity
  const resetSessionTimer = useCallback(() => {
    clearTimeout(sessionTimer.current);
    sessionTimer.current = setTimeout(() => {
      setSessionExpired(true);
      logout();
    }, SESSION_TIMEOUT);
  }, [logout]);

  // Check and refresh token if needed
  const checkAndRefreshToken = useCallback(async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        console.log('User not authenticated, skipping token refresh');
        return false;
      }

      const token = await secureStorage.getItem('userToken');
      if (!token) {
        console.log('No token found, skipping refresh');
        return false;
      }

      // Check if token is about to expire
      const shouldRefresh = await authService.isTokenExpiringSoon(TOKEN_REFRESH_THRESHOLD);
      if (shouldRefresh) {
        console.log('Token needs refresh, refreshing...');
        const refreshed = await authService.refreshToken();
        if (refreshed) {
          console.log('Token refreshed successfully');
          resetSessionTimer();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }, [resetSessionTimer]);

  // Login user with phone and password/OTP
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Handle both object and parameter-based calls for backward compatibility
      let loginCredentials = credentials;
      if (typeof credentials !== 'object' || credentials === null) {
        // Old format: login(phone, password)
        loginCredentials = {
          phone: credentials,
          password: arguments[1]
        };
      }
      
      const userData = await authService.login(loginCredentials);
      setUser(userData);
      resetSessionTimer();
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to login';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [resetSessionTimer]);

  // Register user
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const newUser = await authService.register(userData);
      setUser(newUser);
      resetSessionTimer();
      
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [resetSessionTimer]);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      const isAuthenticated = await authService.initAuth();
      if (isAuthenticated) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        resetSessionTimer();
      } else {
        setUser(null);
      }
      setAuthError(null);
    } catch (error) {
      console.error('Auth init error:', error);
      setAuthError('Failed to initialize authentication');
    } finally {
      setLoading(false);
    }
  }, [resetSessionTimer]);

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState) => {
    if (nextAppState === 'active') {
      // When app comes to foreground, check token
      checkAndRefreshToken().catch(console.error);
    }
  }, [checkAndRefreshToken]);

  // Set up effects
  useEffect(() => {
    // Initialize auth state
    initializeAuth();

    // Set up token refresh interval
    tokenCheckInterval.current = setInterval(() => {
      checkAndRefreshToken().catch(console.error);
    }, TOKEN_CHECK_INTERVAL);

    // Set up app state change listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on unmount
    return () => {
      clearTimers();
      subscription.remove();
    };
  }, [initializeAuth, checkAndRefreshToken, handleAppStateChange, clearTimers]);

  // Context value
  const contextValue = {
    user,
    loading,
    error: authError,
    sessionExpired,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    resetSessionTimer,
  };

  // Show loading spinner while initializing
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show session expired screen if session expired
  if (sessionExpired) {
    return (
      <AuthContext.Provider value={contextValue}>
        <SessionExpiredScreen onSessionRenew={() => {
          setSessionExpired(false);
          initializeAuth();
        }} />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
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

// Higher Order Component for protected routes
export const withAuth = (Component) => {
  return function WithAuthComponent(props) {
    const { loading, isAuthenticated, sessionExpired } = useAuth();

    if (loading) {
      return <LoadingSpinner />;
    }

    if (sessionExpired) {
      return <SessionExpiredScreen />;
    }

    if (!isAuthenticated) {
      // Redirect to login or show unauthorized
      return null; // Or your login component
    }

    return <Component {...props} />;
  };
};

export default AuthContext;
