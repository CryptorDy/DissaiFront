import axios from 'axios';
import { API_URL } from '../config/api';
import { AUTH_ENDPOINTS, LoginRequest, RegisterRequest, EmailConfirmationRequest, AuthResponse } from '../config/auth';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем перехватчик для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface UserProfile {
  nickname: string;
  email: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.login, { email, password });
      const data = response.data;
      
      if (data.Success && data.Token) {
        localStorage.setItem('auth_token', data.Token);
      }
      
      return {
        ...data,
        token: data.Token
      };
    } catch (error: any) {
      // Если сервер вернул ответ с ошибкой
      if (error.response?.data) {
        return error.response.data;
      }
      // Если произошла другая ошибка
      throw error;
    }
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.register, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post(AUTH_ENDPOINTS.logout);
    } finally {
      localStorage.removeItem('auth_token');
    }
  },

  confirmEmail: async (data: EmailConfirmationRequest): Promise<AuthResponse> => {
    const response = await api.post(AUTH_ENDPOINTS.confirmEmail, data);
    return response.data;
  },

  googleAuth: async (accessToken: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/google', { accessToken });
      const data = response.data;
      
      if (data.Token) {
        localStorage.setItem('auth_token', data.Token);
      }
      
      return {
        ...data,
        token: data.Token
      };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await api.get('/Account/profile');
      return {
        nickname: response.data.Nickname || '',
        email: response.data.Email || ''
      };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  setNickname: async (nickname: string, token: string): Promise<void> => {
    try {
      await api.post('/Account/nickname', { nickname }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }
};