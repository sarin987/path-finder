import { BASE_URL, API_VERSION } from '../config';
import { logError } from './logger';

/**
 * Builds a complete API URL from a relative path
 * @param {string} path - The API endpoint path
 * @returns {string} The complete URL
 */
export const buildApiUrl = (path) => {
  try {
    // Remove leading slashes from the path
    const cleanPath = path.replace(/^\/+/, '');
    
    // Ensure BASE_URL doesn't end with a slash
    let baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    
    // If the path already includes the API version, don't add it again
    const apiPath = path.includes(API_VERSION) ? '' : API_VERSION;
    
    // Build the URL parts
    const urlParts = [baseUrl];
    
    // Add API version if it's not empty and not already in the path
    if (apiPath) {
      urlParts.push(apiPath.replace(/^\/+|\/+$/g, ''));
    }
    
    // Add the clean path
    urlParts.push(cleanPath);
    
    // Join all parts with a single slash between them
    const fullUrl = urlParts
      .filter(part => part) // Remove empty parts
      .join('/')
      .replace(/([^:]\/)\/+/g, '$1'); // Remove duplicate slashes
    
    // Log the built URL in development
    if (__DEV__) {
      console.log(`[URL Utils] Built URL: ${fullUrl}`);
    }
    
    return fullUrl;
  } catch (error) {
    logError('Error building API URL', {
      path,
      error: error.message,
      stack: error.stack,
    });
    throw new Error('Failed to construct API URL');
  }
};

/**
 * Validates if a URL is properly formatted
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL is valid
 */
export const isValidUrl = (url) => {
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Ensures a URL has the correct protocol
 * @param {string} url - The URL to check
 * @returns {string} The URL with the correct protocol
 */
export const ensureHttps = (url) => {
  if (!url) return url;
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  if (!url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

/**
 * Adds query parameters to a URL
 * @param {string} url - The base URL
 * @param {Object} params - The query parameters to add
 * @returns {string} The URL with query parameters
 */
export const addQueryParams = (url, params) => {
  if (!params || Object.keys(params).length === 0) return url;
  
  try {
    const urlObj = new URL(url);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });
    
    return urlObj.toString();
  } catch (error) {
    logError('Error adding query params', {
      url,
      params,
      error: error.message,
    });
    return url;
  }
};
