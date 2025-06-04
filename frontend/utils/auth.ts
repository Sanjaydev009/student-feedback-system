const TOKEN_KEY = 'token';

// Helper to check if we're running in the browser
const isBrowser = typeof window !== 'undefined';

export const setToken = (token: string): void => {
  if (isBrowser) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const getToken = (): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = (): void => {
  if (isBrowser) {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};