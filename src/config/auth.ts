export const AUTH_ENDPOINTS = {
  register: '/auth/register',
  login: '/auth/login',
  logout: '/auth/logout',
  confirmEmail: '/auth/confirm-email'
};

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface EmailConfirmationRequest {
  userId: string;
  token: string;
}

export interface AuthResponse {
  Success: boolean;
  Token?: string;
  Error?: string;
  UserId?: string;
  Email?: string;
  EmailConfirmed?: boolean;
  RequiresEmailConfirmation?: boolean;
  token?: string; // Для обратной совместимости
}