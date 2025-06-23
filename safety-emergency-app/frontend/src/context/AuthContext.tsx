import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import type { User } from '../types/auth';
import { getToken, setToken, removeToken } from '@/utils/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, phoneNumber: string) => Promise<void>;
  register: (userData: { name: string; email: string; password: string; phoneNumber: string; role: string }) => Promise<User>;
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
          setIsLoading(false);
          return;
        }

        // Verify token
        try {
          console.log('AuthProvider: Decoding token...');
          const decoded: any = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          console.log('AuthProvider: Token decoded, exp:', new Date(decoded.exp * 1000).toISOString(), 'current time:', new Date().toISOString());
          
          if (decoded.exp && decoded.exp < currentTime) {
            // Token expired
            console.log('AuthProvider: Token expired');
            await logout();
            return;
          }
          
          // Token is valid, fetch user data
          console.log('AuthProvider: Fetching current user data...');
          const userData = await fetchCurrentUser();
          if (!userData) {
            throw new Error('Failed to fetch user data');
          }
          console.log('AuthProvider: User data loaded:', userData.email);
          setUser(userData);
        } catch (error) {
          console.error('AuthProvider: Error during auth check:', error);
          await logout();
        }
      } catch (error) {
        console.error('AuthProvider: Error in auth check:', error);
        setUser(null);
      } finally {
        console.log('AuthProvider: Auth check complete, setting loading to false');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []); 

  // Fetch current user data
  const fetchCurrentUser = async (): Promise<User | null> => {
    try {
      const token = getToken();
      if (!token) {
        console.log('No token found');
        return null;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userData = await response.json();
      
      // Validate the response data
      if (!userData?.id) {
        console.error('Invalid user data received:', userData);
        throw new Error('Invalid user data received from server');
      }
      
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      await logout();
      return null;
    }
  };

  // Login function
  const login = async (email: string, password: string, phoneNumber: string) => {
    try {
      console.log('AuthProvider: Attempting login for:', email);
      
      if (!email || !password || !phoneNumber) {
        throw new Error('Missing required fields: ' + 
          (!email ? 'email ' : '') + 
          (!password ? 'password ' : '') + 
          (!phoneNumber ? 'phone number' : ''));
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, phoneNumber }),
        credentials: 'include',
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Login failed');
      }

      if (!responseData.user || !responseData.token) {
        throw new Error('Invalid response from server');
      }
      
      setToken(responseData.token);
      setUser(responseData.user);
      console.log('AuthProvider: Login successful, user:', responseData.user.email);
      return responseData.user;
    } catch (error) {
      console.error('AuthProvider: Login error:', error);
      // Clear any partial auth state on error
      await logout();
      throw error;
    }
  };

  // Register function
  const register = async (userData: { name: string; email: string; password: string; phoneNumber: string; role: string }) => {
    try {
      console.log('AuthProvider: Attempting to register user:', userData.email);
      
      if (!userData.name || !userData.email || !userData.password || !userData.phoneNumber || !userData.role) {
        throw new Error('Missing required fields: ' + 
          (!userData.name ? 'name ' : '') + 
          (!userData.email ? 'email ' : '') + 
          (!userData.password ? 'password ' : '') + 
          (!userData.phoneNumber ? 'phoneNumber ' : '') +
          (!userData.role ? 'role' : ''));
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          phoneNumber: userData.phoneNumber,
          role: userData.role
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      if (!data.user || !data.token) {
        throw new Error('Invalid response from server');
      }
      
      setToken(data.token);
      setUser(data.user);
      console.log('AuthProvider: Registration successful, user:', data.user.email);
      return data.user;
    } catch (error) {
      console.error('AuthProvider: Registration failed:', error);
      await logout();
      throw error;
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
