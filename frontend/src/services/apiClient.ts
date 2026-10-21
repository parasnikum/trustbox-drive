import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function isTokenExpired(token: string | null, bufferSeconds = 60): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return payload.exp * 1000 - bufferSeconds * 1000 < Date.now();
  } catch {
    return true;
  }
}

let refreshPromise: Promise<string | null> | null = null;

export async function ensureFreshToken(): Promise<string | null> {
  const currentToken = localStorage.getItem('trustBox_token');
  const refreshToken = localStorage.getItem('TrustBox_refresh_token');

  if (currentToken && !isTokenExpired(currentToken, 60)) {
    return currentToken;
  }

  if (!refreshToken && !currentToken) {
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await axios.post(
        '/api/auth/refresh',
        { refreshToken },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            ...(refreshToken ? { 'x-refresh-token': refreshToken } : {}),
          },
        }
      );

      const { accessToken, refreshToken: newRefreshToken, user } = res.data;
      if (accessToken) {
        localStorage.setItem('trustBox_token', accessToken);
      }
      if (newRefreshToken) {
        localStorage.setItem('TrustBox_refresh_token', newRefreshToken);
      }

      window.dispatchEvent(
        new CustomEvent('TrustBox:token-refreshed', {
          detail: { accessToken, user },
        })
      );

      return accessToken || null;
    } catch (err: any) {

      localStorage.removeItem('trustBox_token');
      localStorage.removeItem('TrustBox_refresh_token');
      window.dispatchEvent(new CustomEvent('TrustBox:auth-expired'));
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

apiClient.interceptors.request.use(async (config) => {
  const isAuthRoute =
    config.url?.includes('/auth/login') ||
    config.url?.includes('/auth/register') ||
    config.url?.includes('/auth/refresh') ||
    config.url?.includes('/auth/forgot-password') ||
    config.url?.includes('/auth/reset-password');

  let token = localStorage.getItem('trustBox_token');

  if (!isAuthRoute && isTokenExpired(token, 45)) {

    const freshToken = await ensureFreshToken();
    if (freshToken) {
      token = freshToken;
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token?: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token || undefined);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const freshToken = await ensureFreshToken();
        if (!freshToken) {
          throw new Error('Unable to renew session');
        }

        processQueue(null, freshToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
