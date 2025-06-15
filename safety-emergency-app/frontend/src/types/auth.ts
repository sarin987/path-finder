export type UserRole = 'user' | 'admin' | 'responder';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phoneNumber?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData extends Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastLogin'> {
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UpdateProfileData {
  name?: string;
  phoneNumber?: string;
  avatar?: File | string | null;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailData {
  token: string;
}

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  refreshToken: () => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (data: PasswordResetConfirm) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}
