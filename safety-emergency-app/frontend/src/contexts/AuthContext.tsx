import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { 
  getToken, 
  setToken as setAuthToken, 
  removeToken as removeAuthToken,
  isTokenExpired,
  getUserFromToken 
} from '@/utils/auth';

interface TokenPayload {
  id: string;
  role: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  exp?: number;
  iat?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber?: string;
  avatar?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<User | null>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getToken());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Verify authentication status on mount
  useEffect(() => {
    let isMounted = true;
    
    const verifyAuth = async () => {
      try {
        const currentToken = getToken();
        
        if (!currentToken) {
          if (isMounted) {
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setIsLoading(true);
          setError(null);
        }
        
        // Set the token in the API service
        setAuthToken(currentToken);
        
        try {
          // Verify the token with the backend
          const response = await api.get('/auth/me');
          
          if (isMounted && response) {
            const userData = response.data;
            setUser({
              id: userData.id || 'temp-id',
              name: userData.name || 'User',
              email: userData.email || '',
              role: userData.role || 'user',
              phoneNumber: userData.phoneNumber,
              ...userData
            });
            setToken(currentToken);
            setIsAuthenticated(true);
          }
        } catch (error: any) {
          // If connection failed but we have a valid token, use offline mode
          if (error.message.includes('connect') || error.message.includes('timeout')) {
            console.warn('Running in offline mode:', error.message);
            const tokenData = getToken();
            if (tokenData) {
              try {
                const userData = getUserFromToken() as TokenPayload;
                if (userData) {
                  setUser({
                    id: userData.id,
                    name: userData.name || 'User',
                    email: userData.email || `${userData.id}@user.com`,
                    role: userData.role || 'user',
                    phoneNumber: userData.phoneNumber || ''
                  });
                  setIsAuthenticated(true);
                  return;
                }
              } catch (e) {
                console.error('Error parsing token data:', e);
                // Continue to error handling
              }
            }
          }
          throw error; // Re-throw to be caught by outer catch
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        if (isMounted) {
          // Don't clear auth state immediately, keep the user logged in
          // and try to refresh the token if possible
          try {
            const currentToken = getToken();
            if (currentToken && !isTokenExpired(currentToken)) {
              // If token is still valid, just update the user state
              const userData = getUserFromToken();
              if (userData) {
                setUser({
                  id: userData.id,
                  name: 'User',
                  email: '',
                  role: userData.role,
                  phoneNumber: ''
                });
                setIsAuthenticated(true);
                return;
              }
            }
            // If we can't recover, log out
            logout();
          } catch (e) {
            console.error('Error during auth recovery:', e);
            logout();
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifyAuth();
    
    return () => {
      isMounted = false;
    };

    // Set up storage event listener for cross-tab sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        if (e.newValue) {
          setToken(e.newValue);
          setAuthToken(e.newValue);
          verifyAuth();
        } else {
          logout();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = useCallback(async (phone: string, password: string): Promise<User | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('AuthContext: Sending login request...');
      const response = await api.post('/auth/login', { phone, password });
      console.log('AuthContext: Login response:', response);
      
      // Handle different response formats
      const responseData = response?.data || {};
      const newToken = responseData.token || responseData.accessToken;
      const userData = responseData.user || responseData;
      
      if (!newToken) {
        console.error('AuthContext: No token in response:', responseData);
        throw new Error('Authentication failed: No token received');
      }
      
      if (!userData) {
        console.error('AuthContext: No user data in response:', responseData);
        throw new Error('Authentication failed: No user data received');
      }
      
      console.log('AuthContext: Setting auth token and user data');
      setAuthToken(newToken);
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      window.dispatchEvent(new Event('authTokenUpdated'));
      
      return userData;
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      let errorMessage = 'Failed to login. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('AuthContext: Error response data:', error.response.data);
        console.error('AuthContext: Error status:', error.response.status);
        console.error('AuthContext: Error headers:', error.response.headers);
        
        errorMessage = error.response.data?.message || 
                     error.response.data?.error || 
                     error.message || 
                     'Authentication failed';
      } else if (error.request) {
        // The request was made but no response was received
        console.error('AuthContext: No response received:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('AuthContext: Request setup error:', error.message);
        errorMessage = error.message || 'Request setup failed';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, phone: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.post('/auth/register', { name, phone, password });
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Try to call the logout endpoint if possible
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.error('Error during logout API call:', error);
        // Continue with local logout even if API call fails
      }
      
      // Clear all auth-related data
      removeAuthToken();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear any cached data
      localStorage.removeItem('authState');
      sessionStorage.clear();
      
      // Navigate to login
      navigate('/login');
      
      // Force a full page reload to clear any state
      window.location.reload();
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, try to clear everything
      removeAuthToken();
      localStorage.removeItem('authState');
      sessionStorage.clear();
      window.location.href = '/login';
    }
  }, [navigate]);

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<User> => {
    try {
      if (!user) {
        throw new Error('No user is currently logged in');
      }
      
      setIsLoading(true);
      setError(null);
      
      const response = await api.put('/auth/profile', updates);
      const updatedUser = { ...user, ...response.data };
      setUser(updatedUser);
      return updatedUser;
    } catch (error: any) {
      console.error('Update profile error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const contextValue = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
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

export default AuthContext;
