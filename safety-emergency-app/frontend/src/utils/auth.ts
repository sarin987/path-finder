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
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
};

// Set token in localStorage
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

// Remove token from localStorage
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
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
  if (typeof window === 'undefined') return false;
  
  const token = getToken();
  if (!token) return false;
  
  return !isTokenExpired(token);
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
