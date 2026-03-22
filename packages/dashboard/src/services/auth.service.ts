import { api, getErrorMessage } from '@/lib/api';
import { ApiResponse, LoginResponse, User } from '@/types';

export const authService = {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
  }): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/register', data);
    const result = response.data.data;
    if (!result) throw new Error('Registration failed');
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    return result;
  },

  async login(data: { email: string; password: string }): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
    const result = response.data.data;
    if (!result) throw new Error('Login failed');
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    return result;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    const result = response.data.data;
    if (!result) throw new Error('Failed to get profile');
    return result;
  },

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('accessToken');
  },

  getErrorMessage,
};
