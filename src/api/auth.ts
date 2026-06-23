import api from './axios';
import type { AuthResponse } from '../types';

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { email, password });

export const register = (email: string, password: string) =>
  api.post<{ message: string }>('/auth/register', { email, password });
