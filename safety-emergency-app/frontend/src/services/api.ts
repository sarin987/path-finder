import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

// Extend the InternalAxiosRequestConfig interface to include our custom properties
declare module 'axios' {
  interface InternalAxiosRequestConfig<D = any> {
    _cleanup?: () => void;
  }
}
import { getToken, setToken, removeToken } from '@/utils/auth';
import type { ApiErrorResponse } from '@/types/auth';

// Use the operational backend URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Log the API base URL for debugging
console.log('API Base URL:', API_BASE_URL);

class ApiService {
  private api: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000, // 10 seconds
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
      validateStatus: (status) => {
        // Consider status codes less than 500 as success
        return status < 500;
      }
    });

    this.initializeInterceptors();
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = new Promise<string>(async (resolve, reject) => {
      try {
        const response = await axios.post<{ accessToken: string }>(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const { accessToken } = response.data;
        if (accessToken) {
          // Update the token in both storage and memory
          setToken(accessToken);
          // Dispatch an event to notify other tabs about the token update
          window.dispatchEvent(new Event('authTokenUpdated'));
          resolve(accessToken);
        } else {
          throw new Error('No access token in response');
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // Clear token and notify other tabs
        removeToken();
        window.dispatchEvent(new Event('authTokenRemoved'));
        reject(error);
      } finally {
        this.refreshTokenPromise = null;
      }
    });

    return this.refreshTokenPromise;
  }

  private initializeInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = getToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Always include credentials
        config.withCredentials = true;
        
        // Ensure signal is properly handled if provided
        const signal = config.signal as AbortSignal | undefined;
        if (signal) {
          const onAbort = () => {
            const source = axios.CancelToken.source();
            source.cancel('Request was aborted');
            config.cancelToken = source.token;
          };
          
          if (signal.aborted) {
            onAbort();
          } else {
            const abortHandler = () => onAbort();
            signal.addEventListener('abort', abortHandler);
            // Clean up the event listener
            config._cleanup = () => {
              signal.removeEventListener('abort', abortHandler);
            };
          }
        }
        
        return config;
      },
      (error: AxiosError) => {
        // Clean up any signal event listeners
        const cleanup = error.config?._cleanup;
        if (typeof cleanup === 'function') {
          cleanup();
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        // Clean up any signal event listeners
        const cleanup = response.config._cleanup;
        if (typeof cleanup === 'function') {
          cleanup();
        }
        return response.data;
      },
      async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        
        if (!originalRequest) {
          return Promise.reject(error);
        }

        // If error is 401 and we haven't retried yet, try to refresh the token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newToken = await this.refreshAccessToken();
            // Update the Authorization header
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            // Retry the original request
            return this.api(originalRequest);
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
            // Dispatch custom event for unauthorized access
            removeToken();
            window.dispatchEvent(new Event('unauthorized'));
            return Promise.reject(refreshError);
          }
        }

        // For 401 errors, dispatch unauthorized event
        if (error.response?.status === 401) {
          removeToken();
          window.dispatchEvent(new Event('unauthorized'));
        }
        
        // Return a user-friendly message based on error type
        let errorMessage = 'An error occurred';
        
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please check your connection.';
        } else if (!error.response) {
          // No response from server
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        const errorWithDetails = new Error(errorMessage);
        (errorWithDetails as any).status = error.response?.status;
        return Promise.reject(errorWithDetails);
      }
    );
  }

  // HTTP Methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response as T;
  }

  public async post<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response as T;
  }

  public async put<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response as T;
  }

  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response as T;
  }

  public async patch<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response as T;
  }
}

export const api = new ApiService();
