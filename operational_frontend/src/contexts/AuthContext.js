import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import * as authService from '../services/authService';
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

      // Use auth service to handle logout
      await authService.logout();

      // Clear user state
      delete axios.defaults.headers.common.Authorization;

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
        withCredentials: true, // Send refresh token cookie if using httpOnly cookies
      });

      const { token, user: userData } = response.data;

      if (token) {
        // Update token in storage and axios header
        await secureStorage.setItem('userToken', token);
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;

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
        secureStorage.getItem('userData'),
      ]);

      if (token && userData) {
        // Set axios default auth header
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
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
          secureStorage.getItem('userData'),
        ]);

        if (token && userData) {
          console.log('User token found, initializing session...');

          // Set axios default auth header
          axios.defaults.headers.common.Authorization = `Bearer ${token}`;

          // Try to fetch the latest user profile
          try {
            const api = require('../services/api').default;
            console.log('Fetching user profile...');

            // First try the user ID endpoint
            try {
              const profileRes = await api.get(`/users/${userData.id}`);
              if (profileRes.data) {
                console.log('User profile fetched successfully');
                // Update user data with profile information
                const updatedUser = { ...userData, ...profileRes.data };
                await secureStorage.setItem('userData', updatedUser);
                setUser(updatedUser);
                resetSessionTimer();
                return;
              }
            } catch (profileError) {
              console.warn('Could not fetch user profile by ID, trying general endpoint...', profileError.message);

              // Fallback to general profile endpoint
              try {
                const profileRes = await api.get('/users/me');
                if (profileRes.data) {
                  console.log('User profile fetched from /me endpoint');
                  const updatedUser = { ...userData, ...profileRes.data };
                  await secureStorage.setItem('userData', updatedUser);
                  setUser(updatedUser);
                  resetSessionTimer();
                  return;
                }
              } catch (meError) {
                console.warn('Could not fetch user profile from /me endpoint:', meError.message);
                // Continue with existing user data
              }
            }
          } catch (e) {
            console.warn('Error fetching user profile:', e.message);
            // Continue with existing user data
          }

          // If we get here, we'll use the existing user data
          console.log('Using existing user data from storage');
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
    if (!user) {return;}

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

  // Login user with phone and password or token
  const login = useCallback(async (credentials) => {
    try {
      console.log('[AUTH] Starting login process...');
      setLoading(true);
      setAuthError(null);

      // Determine the login method based on provided credentials
      const loginMethod = credentials.token ? 'token' :
                         (credentials.otp ? 'otp' : 'password');

      console.log(`[AUTH] Login method: ${loginMethod}`);
      console.log('[AUTH] Credentials:', {
        phone: credentials.phone,
        hasPassword: !!credentials.password,
        hasOtp: !!credentials.otp,
        hasToken: !!credentials.token,
      });

      let response;

      if (loginMethod === 'otp') {
        // Handle OTP verification (now moved to LoginScreen)
        console.log('[AUTH] OTP verification should be handled by the LoginScreen');
        throw new Error('OTP verification should be handled by the LoginScreen');
      } else if (loginMethod === 'token') {
        // Handle token-based login (after OTP verification)
        console.log('[AUTH] Processing token-based login');

        // For token-based login, we already have the user data in credentials
        // No need to make an additional API call
        console.log('[AUTH] Using provided user data for token-based login');
        response = {
          data: {
            token: credentials.token,
            ...credentials,
          },
        };
        console.log('[AUTH] Token-based login successful');
      } else {
        // Handle password login
        console.log('[AUTH] Attempting password login...');
        response = await axios.post(API_ROUTES.auth.login, {
          phone: credentials.phone,
          password: credentials.password,
        });
        console.log('[AUTH] Password login response received');
      }

      console.log('[AUTH] Processing authentication response...');
      const { token, ...userData } = response.data;

      if (!token || !userData) {
        console.error('[AUTH] Invalid response from server - missing token or user data');
        throw new Error('Invalid response from server');
      }

      console.log('[AUTH] Token received. User data:', userData);

      // Store token and user data
      console.log('[AUTH] Storing authentication data...');
      await Promise.all([
        secureStorage.setItem('userToken', token).then(() => console.log('[AUTH] Token stored successfully')),
        secureStorage.setItem('userData', userData).then(() => console.log('[AUTH] User data stored successfully')),
      ]);

      // Set axios default auth header
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      console.log('[AUTH] Axios auth header set');

      setUser(userData);
      resetSessionTimer();
      console.log('[AUTH] Login successful');

      return { success: true, user: userData };
    } catch (error) {
      console.error('[AUTH] Login error:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
        } : 'No response',
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
        },
      });

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
      if (!user) {return false;}
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
        'Content-Type': 'application/json',
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
