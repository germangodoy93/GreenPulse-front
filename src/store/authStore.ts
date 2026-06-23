import { create } from 'zustand';

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('gp_token'),
  setToken: (token) => {
    localStorage.setItem('gp_token', token);
    set({ token });
  },
  clearToken: () => {
    localStorage.removeItem('gp_token');
    set({ token: null });
  },
}));
