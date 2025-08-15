// Import only what's needed
import { NetInfo } from 'react-native';
import { API_ROUTES, APP_CONFIG } from '../config';
// secureStorage is used in the commented-out code, so we'll keep it
import secureStorage from './secureStorage';

//   }
//   return response;
// };

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
  if (isProcessingQueue || requestQueue.length === 0) {return;}
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

// Add request to queue (commented out as it's not currently used)
// const addToQueue = (request) => {
//   return new Promise((resolve, reject) => {
//     requestQueue.push({ request, resolve, reject });
//     secureStorage.setItem('offlineQueue', requestQueue);
//   });
// };

/**
 * Make an API request with enhanced error handling and logging
 */
export const apiRequest = async (endpoint, options = {}, requiresAuth = true, authHeaders = {}) => {
  // Normalize the endpoint if needed
  if (!endpoint.startsWith('http')) {
    endpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    'X-App-Version': APP_CONFIG.version,
    ...(requiresAuth ? authHeaders : {}),
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

    // Log success (commented out as logInfo is not available)
    // console.log('API Success', { url: endpoint, data: data ? 'Received data' : 'No data' });
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
    const storedRefreshToken = await secureStorage.getItem('refreshToken');
    if (!storedRefreshToken) {return false;}

    const response = await fetch(API_ROUTES.auth.refresh, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });

    if (!response.ok) {return false;}

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

// Enhanced API methods with authHeaders support
export const api = {
  get: (endpoint, params = {}, options = {}, requiresAuth = true, authHeaders = {}) =>
    apiRequest(
      endpoint,
      {
        ...options,
        method: 'GET',
        params,
      },
      requiresAuth,
      authHeaders
    ),

  post: (endpoint, body = {}, options = {}, requiresAuth = true, authHeaders = {}) =>
    apiRequest(
      endpoint,
      {
        ...options,
        method: 'POST',
        body,
      },
      requiresAuth,
      authHeaders
    ),

  put: (endpoint, body = {}, options = {}, requiresAuth = true, authHeaders = {}) =>
    apiRequest(
      endpoint,
      {
        ...options,
        method: 'PUT',
        body,
      },
      requiresAuth,
      authHeaders
    ),

  delete: (endpoint, options = {}, requiresAuth = true, authHeaders = {}) =>
    apiRequest(
      endpoint,
      {
        ...options,
        method: 'DELETE',
      },
      requiresAuth,
      authHeaders
    ),

  patch: (endpoint, body = {}, options = {}, requiresAuth = true, authHeaders = {}) =>
    apiRequest(
      endpoint,
      {
        ...options,
        method: 'PATCH',
        body,
      },
      requiresAuth,
      authHeaders
    ),

  upload: (endpoint, file, fieldName = 'file', additionalData = {}, onProgress = null, requiresAuth = true, authHeaders = {}) =>
    uploadFile(endpoint, file, fieldName, additionalData, onProgress, requiresAuth, authHeaders),
};

// Enhanced file upload with progress tracking
export const uploadFile = async (endpoint, file, fieldName = 'file', additionalData = {}, onProgress = null, requiresAuth = true, authHeaders = {}) => {
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
    const url = endpoint.startsWith('http') ? endpoint : `${API_ROUTES.base}${endpoint}`;
    xhr.open('POST', url);

    try {
      // Set auth headers if required
      if (requiresAuth) {
        Object.entries(authHeaders).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      // Set other headers
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('X-App-Version', APP_CONFIG.version);

      // Handle progress
      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };
      }

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
