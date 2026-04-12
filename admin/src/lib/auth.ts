const TOKEN_KEY = 'admin_token';
const REFRESH_KEY = 'admin_refresh_token';

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

export function getToken(): string | null {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_KEY, refreshToken);
  }
}

export function clearTokens(): void {
  if (!hasWindow()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}
