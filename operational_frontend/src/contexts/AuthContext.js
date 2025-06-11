import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { auth } from '../services/firebaseConfig';
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
      
      // Sign out from Firebase
      await auth.signOut();
      
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
  const scheduleTokenRefresh = useCallback((expiresIn) => {
    if (tokenRefreshTimer.current) {
      clearTimeout(tokenRefreshTimer.current);
    }
    const refreshTime = Math.max(expiresIn - TOKEN_REFRESH_THRESHOLD, 0);
    
    tokenRefreshTimer.current = setTimeout(async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken(true);
          await secureStorage.setItem('userToken', token);
          // Schedule next refresh
          const decodedToken = await currentUser.getIdTokenResult();
          const newExpiresIn = new Date(decodedToken.expirationTime).getTime() - Date.now();
          scheduleTokenRefresh(newExpiresIn);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, refreshTime);
  }, []);

  // Check authentication state
  const checkAuthState = useCallback(async () => {
    try {
      const [token, userData] = await Promise.all([
        secureStorage.getItem('userToken'),
        secureStorage.getItem('userData')
      ]);

      if (token && userData) {
        // Verify token is still valid
        const decodedToken = await auth.currentUser?.getIdTokenResult();
        if (!decodedToken || !decodedToken.exp || decodedToken.exp * 1000 < Date.now()) {
          // Token expired, log user out
          await logout();
          return;
        }
        
        setUser(userData);
        
        // Schedule token refresh
        const expiresIn = new Date(decodedToken.expirationTime).getTime() - Date.now();
        if (expiresIn > 0) {
          scheduleTokenRefresh(expiresIn);
        }
      }
    } catch (error) {
      console.error('Auth state check error:', error);
      setAuthError('Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  }, [logout, scheduleTokenRefresh]);

  // Check authentication state on mount
  useEffect(() => {
    checkAuthState();
    
    // Cleanup on unmount
    return () => {
      clearTimers();
    };
  }, [checkAuthState, clearTimers]);

  // Handle user activity
  useEffect(() => {
    if (user) {
      resetSessionTimer();
      // Set up event listeners for user activity
      const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
      events.forEach(event => {
        document.addEventListener(event, resetSessionTimer, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, resetSessionTimer, true);
        });
      };
    }
  }, [user, resetSessionTimer]);

  // Login user
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Sign in with Firebase
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const { user: authUser } = userCredential;
      
      // Get the ID token
      const token = await authUser.getIdToken();
      const decodedToken = await authUser.getIdTokenResult();
      
      // Prepare user data to store
      const userData = {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName || '',
        photoURL: authUser.photoURL || null,
        emailVerified: authUser.emailVerified,
      };
      
      // Store token and user data
      await Promise.all([
        secureStorage.setItem('userToken', token),
        secureStorage.setItem('userData', userData),
      ]);
      
      setUser(userData);
      
      // Schedule token refresh
      const expiresIn = new Date(decodedToken.expirationTime).getTime() - Date.now();
      if (expiresIn > 0) {
        scheduleTokenRefresh(expiresIn);
      }
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Failed to sign in';
      
      // Handle specific error cases
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        default:
          errorMessage = error.message || 'An error occurred during sign in';
      }
      
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [scheduleTokenRefresh]);
  
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
