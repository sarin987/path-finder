import axios from 'axios';
import { BASE_URL, API_VERSION } from '../config';
import secureStorage from '../utils/secureStorage';

const API_BASE_URL = `${BASE_URL}${API_VERSION}`;

// Set auth token in axios headers and storage
const setAuthToken = async (token) => {
  try {
    if (!token) {
      console.log('No token provided, removing auth header');
      delete axios.defaults.headers.common['Authorization'];
      await secureStorage.removeItem(secureStorage.KEYS.USER_TOKEN);
      return;
    }
    
    // Validate token format before setting
    if (typeof token !== 'string' || !token.trim()) {
      console.error('Invalid token format: token must be a non-empty string');
      throw new Error('Invalid token format');
    }
    
    // If the token doesn't have the expected format, log a warning but still set it
    // This allows for custom token formats if needed
    if (!isValidTokenFormat(token)) {
      console.warn('Token does not match expected JWT format, but setting it anyway');
    }
    
    // Set the token in axios headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Store the token in secure storage
    await secureStorage.setToken(token);
    
    // Log token info (without exposing the actual token)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresIn = payload.exp ? Math.floor((payload.exp * 1000 - Date.now()) / 60000) : null;
      console.log(`Auth token set, expires in ${expiresIn} minutes`);
    } catch (e) {
      console.log('Auth token set (unable to parse payload)');
    }
    
  } catch (error) {
    console.error('Error setting auth token:', error);
    // Clear auth data if we can't set the token properly
    await secureStorage.removeItem(secureStorage.KEYS.USER_TOKEN);
    delete axios.defaults.headers.common['Authorization'];
    throw error; // Re-throw to allow callers to handle the error
  }
};

// Initialize auth token from storage and validate it
export const initAuth = async () => {
  try {
    const token = await secureStorage.getToken();
    
    // No token means not authenticated
    if (!token) {
      console.log('No auth token found in storage');
      return false;
    }
    
    // Check token format
    if (!isValidTokenFormat(token)) {
      console.error('Invalid token format found in storage');
      await secureStorage.clearAuthData();
      return false;
    }
    
    // Set the token in axios headers for the validation request
    setAuthToken(token);
    
    // Check if token is expired or about to expire
    const remainingTime = await getTokenTimeRemaining();
    const isTokenExpired = remainingTime <= 0;
    const isTokenExpiringSoon = remainingTime < (TOKEN_REFRESH_THRESHOLD / 1000);
    
    if (isTokenExpired) {
      console.log('Token is expired, attempting to refresh...');
      const refreshed = await refreshToken();
      if (!refreshed) {
        console.log('Token refresh failed, clearing auth data');
        await secureStorage.clearAuthData();
        return false;
      }
      console.log('Token refreshed successfully');
      return true;
    }
    
    // If token is valid but expiring soon, refresh it in the background
    if (isTokenExpiringSoon) {
      console.log('Token is expiring soon, refreshing in background...');
      // Don't await this, let it happen in the background
      refreshToken().catch(error => {
        console.error('Background token refresh failed:', error);
      });
    }
    
    // Validate the token with the server
    try {
      await authRequest({
        method: 'get',
        url: `${API_BASE_URL}/api/auth/validate`,
        // Don't retry validation to avoid infinite loops
        retryCount: 0
      });
      
      console.log(`Token is valid, expires in ${Math.floor(remainingTime / 60)} minutes`);
      return true;
      
    } catch (error) {
      console.error('Token validation failed:', error);
      
      // If the token is invalid, try to refresh it
      if (error.response?.status === 401) {
        console.log('Token validation failed with 401, attempting refresh...');
        const refreshed = await refreshToken();
        return refreshed;
      }
      
      // For other errors, clear auth data to be safe
      await secureStorage.clearAuthData();
      return false;
    }
    
  } catch (error) {
    console.error('Auth initialization error:', error);
    
    // Only clear auth data for certain errors
    if (error.response?.status === 401 || 
        error.message?.includes('token') || 
        error.message?.includes('auth')) {
      console.log('Clearing auth data due to error');
      await secureStorage.clearAuthData();
    }
    
    return false;
  }
};

// Register a new user
export const register = async (userData) => {
  try {
    // Validate required fields
    if (!userData?.email || !userData?.password) {
      throw new Error('Email and password are required');
    }
    
    // Clean up and validate user data
    const email = userData.email.trim().toLowerCase();
    const password = userData.password.trim();
    const name = userData.name?.trim();
    
    // Basic validation
    if (!email || !password) {
      throw new Error('Email and password cannot be empty');
    }
    
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    const cleanedData = {
      ...userData,
      email,
      password,
      name: name || '',
      phone: userData.phone || '',
      gender: userData.gender || 'other'
    };

    // Make the registration request using the correct endpoint
    const response = await authRequest({
      method: 'post',
      url: `${API_BASE_URL}/role-register/register/user`,
      data: cleanedData,
      // Don't retry registration requests on 401
      retryCount: 0
    });
    
    console.log('Registration response:', response.data);
    
    if (!response.data?.token) {
      throw new Error('Registration failed: No token received from server');
    }
    
    // Validate token format before storing
    const { token, refreshToken, user } = response.data;
    
    if (!isValidTokenFormat(token)) {
      throw new Error('Invalid token format received from server');
    }
    
    // Store tokens and user data
    await Promise.all([
      setAuthToken(token),
      refreshToken && secureStorage.setRefreshToken(refreshToken),
      user && secureStorage.setUserData(user)
    ]);
    
    console.log(`User ${user?.id || 'unknown'} registered and logged in successfully`);
    return user || {};
    
  } catch (error) {
    let errorMessage = 'Registration failed';
    
    if (error.response) {
      // Handle different HTTP status codes
      const { status, data } = error.response;
      
      if (status === 400) {
        errorMessage = data?.message || 'Invalid registration data';
      } else if (status === 409) {
        errorMessage = data?.message || 'User with this email already exists';
      } else if (status >= 500) {
        errorMessage = 'Server error during registration. Please try again later.';
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server. Please check your connection.';
    } else if (error.message) {
      // Something happened in setting up the request
      errorMessage = error.message;
    }
    
    console.error('Registration error:', errorMessage, error);
    throw new Error(errorMessage);
  }
};

// Login user with phone and password/OTP
export const login = async (credentials) => {
  try {
    // Handle both object and parameter-based calls for backward compatibility
    let phone, password, otp;
    
    if (typeof credentials === 'object') {
      // New format: login({ phone, password }) or login({ phone, otp })
      phone = credentials.phone;
      password = credentials.password;
      otp = credentials.otp;
    } else {
      // Old format: login(phone, password) - for backward compatibility
      phone = credentials;
      password = arguments[1];
    }
    
    // Validate inputs
    if (!phone) {
      throw new Error('Phone number is required');
    }
    
    // Remove any non-digit characters and ensure it starts with country code
    const formattedPhone = phone.replace(/\D/g, '');
    
    if (formattedPhone.length < 10) {
      throw new Error('Please enter a valid phone number');
    }
    
    // Check if we're using password or OTP for login
    const isOtpLogin = !!otp;
    
    if (!isOtpLogin && !password) {
      throw new Error('Password or OTP is required');
    }
    
    // Prepare login data based on login method
    const loginData = isOtpLogin 
      ? { phone: formattedPhone, otp }
      : { phone: formattedPhone, password };
    
    // Make the login request
    const response = await authRequest({
      method: 'post',
      url: `${API_BASE_URL}/api/auth/login`,
      data: loginData,
      // Don't retry login requests on 401
      retryCount: 0
    });

    if (!response.data?.token) {
      throw new Error('Authentication failed: No token received from server');
    }

    // Extract response data
    const { token, refreshToken, user } = response.data;
    
    // Validate token format before storing
    if (!isValidTokenFormat(token)) {
      throw new Error('Invalid token format received from server');
    }

    // Store tokens and user data
    await Promise.all([
      setAuthToken(token),
      refreshToken && secureStorage.setRefreshToken(refreshToken),
      user && secureStorage.setUserData(user)
    ]);
    
    // Log successful login
    console.log(`User ${user?.id || 'unknown'} logged in successfully`);
    return user || {};
    
  } catch (error) {
    let errorMessage = 'Login failed';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      if (status === 401) {
        errorMessage = data?.message || 'Invalid phone number or password';
      } else if (status === 400) {
        errorMessage = data?.message || 'Invalid request';
      } else if (status === 403) {
        errorMessage = data?.message || 'Account not found or not verified';
      } else if (status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server. Please check your connection.';
    }
    
    console.error('Login error:', errorMessage, error);
    throw new Error(errorMessage);
  }
};

// Logout user and clear all auth data
export const logout = async () => {
  let userId = 'unknown';
  
  try {
    // Get user info before logging out for logging purposes
    try {
      const user = await getCurrentUser();
      userId = user?.id || 'unknown';
    } catch (e) {
      console.warn('Could not get current user during logout:', e.message);
    }
    
    console.log(`Logging out user: ${userId}`);
    
    // Clear the auth token first
    await setAuthToken(null);
    
    // Clear all other auth data
    await secureStorage.clearAuthData();
    
    // Clear any pending requests or caches if needed
    // Example: clearRequestCache();
    
    // Clear any axios interceptors or other auth-related state
    // This prevents any pending requests from using old tokens
    if (axios.defaults.headers.common['Authorization']) {
      delete axios.defaults.headers.common['Authorization'];
    }
    
    console.log(`User ${userId} logged out successfully`);
    return true;
    
  } catch (error) {
    console.error(`Error during logout for user ${userId}:`, error);
    
    // Make sure we clear everything even if there was an error
    try {
      // Clear auth token
      if (axios.defaults.headers.common['Authorization']) {
        delete axios.defaults.headers.common['Authorization'];
      }
      
      // Clear all auth data
      await secureStorage.clearAuthData().catch(e => {
        console.error('Error clearing auth data during logout cleanup:', e);
      });
      
    } catch (cleanupError) {
      console.error('Error during logout cleanup:', cleanupError);
    }
    
    // Don't throw the error to prevent blocking the logout flow
    // The user should still be able to log out even if there was an error
    return false;
  }
};

// Get current user with validation
export const getCurrentUser = async (forceRefresh = false) => {
  try {
    // If not forcing refresh, return cached user data if available
    if (!forceRefresh) {
      const cachedUser = await secureStorage.getUserData();
      if (cachedUser) {
        // Verify the token is still valid when getting the user
        const isTokenValid = await isValidToken();
        if (isTokenValid) {
          return cachedUser;
        }
        console.log('Cached user found but token is invalid, attempting refresh...');
      }
    }
    
    // If we get here, either we're forcing a refresh or the token is invalid
    // Try to refresh the user data from the server
    const token = await secureStorage.getToken();
    if (!token) {
      console.log('No auth token available to fetch user data');
      return null;
    }
    
    // Fetch fresh user data from the server
    const response = await authRequest({
      method: 'get',
      url: `${API_BASE_URL}/api/auth/me`
    });
    
    if (response.data) {
      // Update the stored user data
      await secureStorage.setUserData(response.data);
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    
    // If we get a 401, the token might be invalid, so clear auth data
    if (error.response?.status === 401) {
      console.log('Session expired, logging out...');
      await logout();
    }
    
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const token = await secureStorage.getToken();
    return !!token;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

// Check if token is about to expire
// thresholdMs: time in milliseconds before expiration to consider the token as expiring soon
export const isTokenExpiringSoon = async (thresholdMs = 10 * 60 * 1000) => {
  try {
    const token = await secureStorage.getToken();
    if (!token) return true; // No token means it's expired
    
    // Decode the token (without verification, since we just want the expiration)
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return true; // No expiration means it's invalid
    
    const now = Date.now() / 1000; // Convert to seconds
    const expiresIn = payload.exp - now;
    
    // Return true if token expires within the threshold
    return expiresIn < (thresholdMs / 1000);
  } catch (error) {
    console.error('Token expiration check error:', error);
    return true; // On error, assume token is expired
  }
};

// Get token expiration timestamp (in seconds since epoch)
export const getTokenExpiration = async () => {
  try {
    const token = await secureStorage.getToken();
    if (!token) return null;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp || null;
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

// Validate token format (does not verify signature)
export const isValidTokenFormat = (token) => {
  try {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  } catch (error) {
    console.error('Error validating token format:', error);
    return false;
  }
};

// Refresh access token with retry logic
export const refreshToken = async (maxRetries = 1) => {
  let attempts = 0;
  let lastError = null;
  
  while (attempts <= maxRetries) {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken) {
        console.log('No refresh token available');
        return false;
      }

      // Make the refresh token request
      const response = await authRequest({
        method: 'post',
        url: `${API_BASE_URL}/api/auth/refresh-token`,
        data: { refreshToken },
        // Don't retry refresh token requests to avoid infinite loops
        retryCount: 0
      });

      if (response.data.token) {
        // Update the access token
        await setAuthToken(response.data.token);
        
        // Update refresh token if a new one was provided
        if (response.data.refreshToken) {
          await secureStorage.setRefreshToken(response.data.refreshToken);
        }
        
        // Update user data if provided
        if (response.data.user) {
          await secureStorage.setUserData(response.data.user);
        }
        
        console.log('Token refreshed successfully');
        return true;
      }
      
      // If we got here, the response didn't contain a token
      lastError = new Error('No token in refresh response');
      
    } catch (error) {
      console.error(`Token refresh attempt ${attempts + 1} failed:`, error);
      lastError = error;
      
      // If it's a non-retryable error, break the loop
      if (error.response?.status === 401 || // Unauthorized
          error.response?.status === 403 || // Forbidden
          attempts === maxRetries) {
        break;
      }
      
      // Wait before retrying (exponential backoff with jitter)
      const baseDelay = Math.min(1000 * Math.pow(2, attempts), 10000);
      const jitter = Math.random() * 1000; // Add up to 1s of jitter
      await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
    }
    
    attempts++;
  }
  
  // If we get here, all attempts failed
  console.error('All token refresh attempts failed, logging out...');
  
  // Only log out if the error wasn't due to network issues
  if (lastError?.response || lastError?.message !== 'Network Error') {
    await logout();
  }
  
  return false;
};

// Decode and return the token payload
export const getTokenPayload = async () => {
  try {
    const token = await secureStorage.getToken();
    if (!token) return null;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Check if user has a specific role/claim
export const hasRole = async (role) => {
  try {
    // First check user data
    const user = await getCurrentUser();
    if (user?.roles?.includes(role)) return true;
    
    // Then check token claims as fallback
    const payload = await getTokenPayload();
    return payload?.roles?.includes(role) || false;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
};

export const hasAnyRole = async (roles = []) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return false;
  }

  try {
    // First check user object from storage
    const user = await getCurrentUser();
    if (user?.roles?.some(role => roles.includes(role))) {
      return true;
    }

    // Then check token claims as fallback
    const payload = await getTokenPayload();
    return payload?.roles?.some(role => roles.includes(role)) || false;
  } catch (error) {
    console.error('Error checking user roles:', error);
    return false;
  }
};

// Get remaining time until token expires (in milliseconds)
export const getTokenTimeRemaining = async (tokenToCheck = null) => {
  try {
    const token = tokenToCheck || await secureStorage.getToken();
    
    // No token means no time remaining
    if (!token) {
      return 0;
    }
    
    // Extract payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format: expected 3 parts');
      return 0;
    }
    
    // Parse the payload
    let payload;
    try {
      payload = JSON.parse(atob(parts[1]));
    } catch (e) {
      console.error('Error parsing token payload:', e);
      return 0;
    }
    
    // Check if token has expiration
    if (typeof payload.exp !== 'number') {
      console.error('Token does not have expiration time');
      return 0;
    }
    
    // Calculate remaining time (exp is in seconds, convert to ms)
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const expiresAt = payload.exp; // Expiration time in seconds
    const remainingSeconds = Math.max(0, expiresAt - now);
    
    // Convert to milliseconds for consistency
    return remainingSeconds * 1000;
    
  } catch (error) {
    console.error('Error getting token time remaining:', error);
    return 0; // On error, assume token is expired/invalid
  }
};

// Check if token is valid and not expired
export const isValidToken = async (tokenToCheck = null) => {
  try {
    const token = tokenToCheck || await secureStorage.getToken();
    
    // Check if token exists
    if (!token) {
      console.log('No token found');
      return false;
    }
    
    // Check token format
    if (!isValidTokenFormat(token)) {
      console.error('Invalid token format');
      return false;
    }
    
    // Check expiration
    const remaining = await getTokenTimeRemaining(token);
    const isValid = remaining > 0;
    
    if (!isValid) {
      console.log(`Token is expired, remaining time: ${remaining}ms`);
    }
    
    return isValid;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

// Default timeout for API requests (10 seconds)
const DEFAULT_TIMEOUT = 10000;

// Track if we're currently refreshing the token
let isRefreshing = false;
let refreshSubscribers = [];

/**
 * Add a request to the refresh queue
 * @param {Function} callback - Function to call when token is refreshed
 */
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

/**
 * Process all queued requests after token refresh
 * @param {string} token - The new access token
 */
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

/**
 * Make an authenticated API request with automatic token refresh
 * @param {Object} config - Axios request config
 * @param {number} retryCount - Number of retry attempts (default: 1)
 * @returns {Promise} - Axios response
 */
export const authRequest = async (config, retryCount = 1) => {
  // Set default timeout if not specified
  if (!config.timeout) {
    config.timeout = DEFAULT_TIMEOUT;
  }

  // Add request timestamp for debugging
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
  // Log request details
  console.log(`[${requestId}] ${config.method?.toUpperCase() || 'GET'} ${config.url}`, {
    data: config.data,
    params: config.params,
    timeout: config.timeout
  });

  try {
    // Get the current token
    let token = await secureStorage.getToken();
    
    // If no token and this is a protected endpoint, throw an error
    const isAuthEndpoint = config.url.includes('/auth/') || config.url.includes('/role-register/');
    if (!token && !isAuthEndpoint) {
      throw new Error('No authentication token available');
    }
    
    // Add the authorization header if this is a protected endpoint and we have a token
    if (token && !isAuthEndpoint) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
        'X-Request-ID': requestId
      };
    } else {
      // Still add request ID for non-auth requests
      config.headers = {
        ...config.headers,
        'X-Request-ID': requestId
      };
    }
    
    try {
      // Make the request
      const response = await axios({
        ...config,
        validateStatus: (status) => status >= 200 && status < 500 // Don't throw for 4xx errors
      });
      
      // Log successful response
      console.log(`[${requestId}] ${response.status} ${response.statusText}`, {
        data: response.data,
        headers: response.headers
      });
      
      return response;
      
    } catch (error) {
      // If we get a 401 and we have a token, try to refresh it
      if (error.response?.status === 401 && token && retryCount > 0) {
        // If we're already refreshing, wait for the new token
        if (isRefreshing) {
          console.log(`[${requestId}] Token refresh in progress, queuing request`);
          
          // Return a promise that will resolve when the token is refreshed
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((newToken) => {
              // Update the token and retry the request
              config.headers.Authorization = `Bearer ${newToken}`;
              authRequest(config, retryCount - 1)
                .then(resolve)
                .catch(reject);
            });
          });
        }
        
        console.log(`[${requestId}] Token expired, attempting to refresh...`);
        isRefreshing = true;
        
        try {
          const refreshed = await refreshToken();
          isRefreshing = false;
          
          if (refreshed) {
            // Update the token and retry the request
            token = await secureStorage.getToken();
            config.headers.Authorization = `Bearer ${token}`;
            
            // Notify all queued requests
            onTokenRefreshed(token);
            
            // Retry the original request
            return authRequest(config, retryCount - 1);
          } else {
            // If refresh failed, clear auth and throw
            console.error(`[${requestId}] Token refresh failed`);
            await logout();
            throw new Error('Session expired. Please log in again.');
          }
        } catch (refreshError) {
          isRefreshing = false;
          console.error(`[${requestId}] Token refresh error:`, refreshError);
          await logout();
          throw new Error('Session expired. Please log in again.');
        }
      }
      
      // For other errors or if we've exhausted retries, rethrow
      throw error;
    }
  } catch (error) {
    // Log error details
    console.error(`[${requestId}] API request failed:`, {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      } : null,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data,
        timeout: error.config?.timeout
      },
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Enhance the error with more context if available
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      if (status === 400) {
        error.message = data?.message || 'Invalid request. Please check your input.';
      } else if (status === 401) {
        error.message = data?.message || 'Session expired. Please log in again.';
      } else if (status === 403) {
        error.message = data?.message || 'You do not have permission to perform this action.';
      } else if (status === 404) {
        error.message = data?.message || 'The requested resource was not found.';
      } else if (status === 408 || error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. Please check your connection and try again.';
      } else if (status >= 500) {
        error.message = data?.message || 'Server error. Please try again later.';
      }
    } else if (error.request) {
      // The request was made but no response was received
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. Please check your connection and try again.';
      } else if (error.code === 'ERR_NETWORK') {
        error.message = 'Network error. Please check your internet connection.';
      } else {
        error.message = 'No response from server. Please try again later.';
      }
    }
    
    // Add request ID to error for debugging
    error.requestId = requestId;
    throw error;
  }
};

