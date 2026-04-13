import * as SecureStore from 'expo-secure-store';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const isBrowser = typeof window !== 'undefined';

function resolveApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  if (__DEV__) {
    if (isBrowser) {
      const host =
        window.location.hostname === 'localhost'
          ? '127.0.0.1'
          : window.location.hostname;
      return `${window.location.protocol}//${host}:8001/api/v1`;
    }
    return 'http://localhost:8001/api/v1';
  }

  return 'https://api.gymforce.app/api/v1';
}

const API_BASE_URL = resolveApiBaseUrl();

function getStorageKey(key: string): string {
  return `gymforce_${key}`;
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

async function setToken(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    if (isBrowser) {
      window.localStorage.setItem(getStorageKey(key), value);
    }
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

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
    ) {
      originalRequest._retry = true;

      try {
        const refresh = await getToken('refresh_token');
        if (!refresh) {
          throw new Error('No refresh token');
        }

        const { data } = await api.post('/auth/refresh', { refresh_token: refresh });

        await setToken('access_token', data.access_token);
        api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        }

        return api(originalRequest);
      } catch {
        await deleteToken('access_token');
        await deleteToken('refresh_token');
        delete api.defaults.headers.common.Authorization;
      }
    }

    return Promise.reject(error);
  },
);
