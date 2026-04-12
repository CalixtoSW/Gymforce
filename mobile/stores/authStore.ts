import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { User } from '@/types';
import { api } from '@/services/api';

const isBrowser = typeof window !== 'undefined';

function getStorageKey(key: string): string {
  return `gymforce_${key}`;
}

async function setToken(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    if (isBrowser) {
      window.localStorage.setItem(getStorageKey(key), value);
    }
  }
}

async function getToken(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    if (isBrowser) {
      return window.localStorage.getItem(getStorageKey(key));
    }
    return null;
  }
}

async function deleteToken(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    if (isBrowser) {
      window.localStorage.removeItem(getStorageKey(key));
    }
  }
}

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    referralCode?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await setToken('access_token', data.access_token);
    await setToken('refresh_token', data.refresh_token);
    api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
    await get().fetchMe();
  },

  register: async (name, email, password, referralCode) => {
    const payload: Record<string, string> = { name, email, password };
    if (referralCode && referralCode.trim().length > 0) {
      payload.referral_code = referralCode.trim();
    }
    const { data } = await api.post('/auth/register', payload);
    await setToken('access_token', data.access_token);
    await setToken('refresh_token', data.refresh_token);
    api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
    await get().fetchMe();
  },

  logout: async () => {
    await deleteToken('access_token');
    await deleteToken('refresh_token');
    delete api.defaults.headers.common.Authorization;
    set({ user: null, isAuthenticated: false });
  },

  loadSession: async () => {
    try {
      const token = await getToken('access_token');
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

  refreshUser: async () => {
    try {
      await get().fetchMe();
    } catch {
      return;
    }
  },
}));
