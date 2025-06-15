import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import type { User } from '../types/auth';
import { getToken, setToken, removeToken } from '@/utils/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<User>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in on mount
  useEffect(() => {
    console.log('AuthProvider: Starting auth check...');
    const checkAuth = async () => {
      try {
        const token = getToken();
        console.log('AuthProvider: Token from storage:', token ? 'exists' : 'not found');
        
        if (!token) {
          console.log('AuthProvider: No token found, setting user to null');
          setUser(null);
          return;
        }

        // Verify token
        try {
          console.log('AuthProvider: Decoding token...');
          const decoded: any = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          console.log('AuthProvider: Token decoded, exp:', decoded.exp, 'current time:', currentTime);
          
          if (decoded.exp && decoded.exp < currentTime) {
            // Token expired
            console.log('AuthProvider: Token expired');
            removeToken();
            setUser(null);
            return;
          }


          // Token is valid, set mock user
          const mockUser: User = {
            id: decoded.sub || '1',
            name: decoded.name || 'Test User',
            email: decoded.email || 'test@example.com',
            role: (decoded.role || 'user') as 'user' | 'admin' | 'responder',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          console.log('AuthProvider: Setting user from token:', mockUser);
          setUser(mockUser);
        } catch (err) {
          console.error('Error decoding token:', err);
          removeToken();
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        console.log('AuthProvider: Auth check complete, setting loading to false');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []); // Empty dependency array since we don't use any external values

  // Login function
  const login = async (email: string, _password: string) => {
    try {
      console.log('AuthProvider: Attempting login for:', email);
      
      // Mock login - in a real app, this would be an API call
      // Using a properly formatted JWT token for testing
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2MjM5MDc5ODUsImV4cCI6MTY1NTQ2NTU4NX0.7d9d9a2f9d9a2f9d9a2f9d9a2f9d9a2f9d9a2f9d9a2f9d9a2f9d9a2f9d9a2f9';
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        email,
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Set token in storage
      setToken(mockToken);
      
      // Update user state
      setUser(mockUser);
      
      console.log('AuthProvider: Login successful, user:', mockUser);
      navigate('/dashboard');
    } catch (error) {
      console.error('AuthProvider: Login failed:', error);
      removeToken();
      setUser(null);
      throw error; // Re-throw to be handled by the component
    }
  };

  // Register function
  const register = async (userData: { name: string; email: string; password: string }) => {
    try {
      console.log('AuthProvider: Attempting to register user:', userData.email);
      
      // Mock registration - in a real app, this would be an API call
      // Using a properly formatted JWT token for testing
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIiLCJuYW1lIjoiTmV3IFVzZXIiLCJlbWFpbCI6Im5ld0BleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjIzOTA3OTg1LCJleHAiOjE2NTU0NjU1ODV9.8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e';
      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9), // Generate a random ID
        name: userData.name,
        email: userData.email,
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Set token in storage
      setToken(mockToken);
      
      // Update user state
      setUser(mockUser);
      
      console.log('AuthProvider: Registration successful, user:', mockUser);
      navigate('/dashboard');
      
      return mockUser;
    } catch (error) {
      console.error('AuthProvider: Registration failed:', error);
      removeToken();
      setUser(null);
      throw error; // Re-throw to be handled by the component
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('AuthProvider: Logging out user');
      
      // Clear token from storage
      removeToken();
      
      // Clear user state
      setUser(null);
      
      // Clear any sensitive data from localStorage if needed
      // Example: localStorage.removeItem('someSensitiveData');
      
      console.log('AuthProvider: Logout successful');
      
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('AuthProvider: Error during logout:', error);
      // Even if there's an error, we should try to clear the auth state
      removeToken();
      setUser(null);
      navigate('/login');
      throw error; // Re-throw to be handled by the component
    }
  };

  // Update profile function
  const updateProfile = async (userData: Partial<User>): Promise<User> => {
    try {
      console.log('AuthProvider: Updating user profile');
      
      if (!user) {
        const error = new Error('No user logged in');
        console.error('AuthProvider: Update profile failed -', error.message);
        throw error;
      }
      
      const updatedUser: User = {
        ...user,
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      console.log('AuthProvider: Profile updated successfully:', updatedUser);
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('AuthProvider: Error updating profile:', error);
      throw error; // Re-throw to be handled by the component
    }
  };

  // The value that will be passed to the context consumers
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access the auth context
 * @returns {AuthContextType} The auth context value
 * @throws {Error} If used outside of an AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    const error = new Error('useAuth must be used within an AuthProvider');
    console.error(error);
    throw error;
  }
  
  return context;
};

// Export the context itself
export default AuthContext;
