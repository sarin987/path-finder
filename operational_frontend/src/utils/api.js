import { Alert, Platform, NetInfo } from 'react-native';
import { API_ROUTES, FEATURE_FLAGS, APP_CONFIG } from '../config';
import { useAuth } from '../contexts/AuthContext';
import secureStorage from './secureStorage';

// Request queue for offline support
let requestQueue = [];
let isProcessingQueue = false;

// Check network status
const isOnline = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected;
};

// Process queued requests
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  isProcessingQueue = true;

  try {
    const queueCopy = [...requestQueue];
    requestQueue = [];

    for (const { request, resolve, reject } of queueCopy) {
      try {
        const result = await apiRequest(...request);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
  } finally {
    isProcessingQueue = false;
  }
};

// Add request to queue
const addToQueue = (request) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ request, resolve, reject });
    secureStorage.setItem('offlineQueue', requestQueue);
  });
};

/**
 * Enhanced API request with retry logic and offline support
 */
export const apiRequest = async (endpoint, options = {}, requiresAuth = true) => {
  const { getAuthHeaders } = useAuth();
  
  // Handle offline mode
  if (FEATURE_FLAGS.enableOfflineMode && !(await isOnline())) {
    if (options.queueIfOffline !== false) {
      return addToQueue([endpoint, { ...options, queueIfOffline: false }, requiresAuth]);
    }
    throw new Error('You are currently offline. Please check your connection.');
  }

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    'X-Platform': Platform.OS,
    'X-App-Version': APP_CONFIG.version,
    ...(requiresAuth ? await getAuthHeaders() : {}),
    ...(options.headers || {}),
  };

  const config = {
    method: 'GET',
    ...options,
    headers,
  };

  // Handle request body
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(endpoint.startsWith('http') ? endpoint : `${API_ROUTES.base}${endpoint}`, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle response
    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json') 
      ? await response.json() 
      : await response.text();

    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401 && requiresAuth) {
        const refreshed = await refreshToken();
        if (refreshed) {
          return apiRequest(endpoint, options, requiresAuth);
        }
        throw new Error('Session expired. Please log in again.');
      }

      const error = new Error(data?.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', {
      endpoint,
      error: error.message,
      status: error.status,
    });

    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }

    throw error;
  }
};

// Token refresh helper
const refreshToken = async () => {
  try {
    const refreshToken = await secureStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    const response = await fetch(API_ROUTES.auth.refresh, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const { token, refreshToken: newRefreshToken } = await response.json();
    
    await Promise.all([
      secureStorage.setItem('userToken', token),
      newRefreshToken && secureStorage.setItem('refreshToken', newRefreshToken),
    ].filter(Boolean));

    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// Enhanced API methods
export const api = {
  get: (endpoint, params = {}, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'GET',
      params,
    }),

  post: (endpoint, body = {}, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body,
    }),

  put: (endpoint, body = {}, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body,
    }),

  delete: (endpoint, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'DELETE',
    }),

  patch: (endpoint, body = {}, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body,
    }),

  upload: (endpoint, file, fieldName = 'file', additionalData = {}, onProgress) =>
    uploadFile(endpoint, file, fieldName, additionalData, onProgress),
};

// Enhanced file upload with progress tracking
export const uploadFile = async (endpoint, file, fieldName = 'file', additionalData = {}, onProgress = null) => {
  const { getAuthHeaders } = useAuth();
  const formData = new FormData();
  
  // Append file
  formData.append(fieldName, {
    uri: file.uri,
    type: file.type || 'application/octet-stream',
    name: file.name || 'file',
  });
  
  // Append additional data
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint.startsWith('http') ? endpoint : `${API_ROUTES.base}${endpoint}`);
    
    // Set auth headers
    (async () => {
      try {
        const headers = await getAuthHeaders();
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
        
        xhr.upload.onprogress = (event) => {
          if (onProgress && event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              resolve(xhr.responseText);
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };
        
        xhr.send(formData);
      } catch (error) {
        reject(error);
      }
    })();
  });
};

// Initialize offline queue on app start
(async () => {
  try {
    const queue = await secureStorage.getItem('offlineQueue') || [];
    if (queue.length > 0) {
      requestQueue = queue;
      if (await isOnline()) {
        processQueue();
      }
    }
  } catch (error) {
    console.error('Failed to initialize offline queue:', error);
  }
})();