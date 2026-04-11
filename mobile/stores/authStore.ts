import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { User } from '@/types';
import { api } from '@/services/api';

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  fetchMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('access_token', data.access_token);
    await SecureStore.setItemAsync('refresh_token', data.refresh_token);
    api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
    await get().fetchMe();
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    await SecureStore.setItemAsync('access_token', data.access_token);
    await SecureStore.setItemAsync('refresh_token', data.refresh_token);
    api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
    await get().fetchMe();
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    delete api.defaults.headers.common.Authorization;
    set({ user: null, isAuthenticated: false });
  },

  loadSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        await get().fetchMe();
      }
    } catch {
      await get().logout();
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMe: async () => {
    const { data } = await api.get('/auth/me');
    set({ user: data, isAuthenticated: true });
  },
}));
