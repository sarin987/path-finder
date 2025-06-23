import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  id: string;
  role: string;
  exp: number;
  [key: string]: any;
}

const TOKEN_KEY = 'auth_token';

// Get token from localStorage
export const getToken = (): string | null => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Set token in localStorage
export const setToken = (token: string): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      // Also store a flag to know we have a token
      sessionStorage.setItem('hasAuthToken', 'true');
    }
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

// Remove token from localStorage
export const removeToken = (): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem('hasAuthToken');
    }
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Get token expiration timestamp
export const getTokenExpiration = (token: string): number | null => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.exp * 1000; // Convert to milliseconds
  } catch (error) {
    return null;
  }
};

// Get authorization header with token
export const getAuthHeader = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  try {
    // First check if we have the token flag in sessionStorage
    const hasToken = sessionStorage.getItem('hasAuthToken') === 'true';
    if (!hasToken) return false;
    
    // Then verify the token
    const token = getToken();
    if (!token) return false;
    
    return !isTokenExpired(token);
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

// Get user info from token
export const getUserFromToken = (): { id: string; role: string } | null => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return {
      id: decoded.id,
      role: decoded.role,
    };
  } catch (error) {
    return null;
  }
};

// Check if user has specific role
export const hasRole = (requiredRole: string): boolean => {
  const user = getUserFromToken();
  return user?.role === requiredRole;
};

// Get user role from token
export const getUserRole = (): string | null => {
  const user = getUserFromToken();
  return user?.role || null;
};

// Check if current user is admin
export const isAdmin = (): boolean => {
  const user = getUserFromToken();
  return user?.role === 'admin';
};

// Check if current user is a responder
export const isResponder = (): boolean => {
  const user = getUserFromToken();
  return user?.role === 'responder';
};

// Check if current user is a regular user
export const isRegularUser = (): boolean => {
  const user = getUserFromToken();
  return user?.role === 'user';
};
