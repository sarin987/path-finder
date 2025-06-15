import { api } from './api';
import type {
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  User,
  AuthResponse,
  PasswordResetRequest,
  PasswordResetConfirm,
  VerifyEmailData,
} from '@/types/auth';

const AUTH_ENDPOINT = '/auth';

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  // Register a new user
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        `${AUTH_ENDPOINT}/register`,
        userData
      );
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        `${AUTH_ENDPOINT}/login`,
        credentials
      );
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await api.post(`${AUTH_ENDPOINT}/logout`);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await api.post<RefreshTokenResponse>(
        `${AUTH_ENDPOINT}/refresh-token`,
        { refreshToken }
      );
      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    try {
      return await api.get<User>(`${AUTH_ENDPOINT}/me`);
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(userData: UpdateProfileData): Promise<User> {
    try {
      const formData = new FormData();
      
      // Append all fields to form data
      Object.entries(userData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File || typeof value === 'string' || value instanceof Blob) {
            formData.append(key, value);
          } else if (typeof value === 'object') {
            // Stringify objects
            formData.append(key, JSON.stringify(value));
          } else {
            // Convert other types to string
            formData.append(key, String(value));
          }
        }
      });

      return await api.patch<User>(`${AUTH_ENDPOINT}/me`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await api.post<PasswordResetRequest>(
        `${AUTH_ENDPOINT}/forgot-password`,
        { email }
      );
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  },

  // Reset password with token
  async resetPassword(data: PasswordResetConfirm): Promise<void> {
    try {
      await api.post(`${AUTH_ENDPOINT}/reset-password`, data);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  // Verify email with token
  async verifyEmail(token: string): Promise<void> {
    try {
      await api.post<VerifyEmailData>(`${AUTH_ENDPOINT}/verify-email`, { token });
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  },

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<void> {
    try {
      await api.post(`${AUTH_ENDPOINT}/resend-verification`, { email });
    } catch (error) {
      console.error('Resend verification email error:', error);
      throw error;
    }
  },
};

export default authService;
