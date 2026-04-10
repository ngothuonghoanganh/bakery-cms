/**
 * Axios API client configuration
 * Centralized HTTP client with interceptors for requests and responses
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import {
  ErrorCode,
  createNetworkError,
  createInternalError,
  type AppError,
} from '@/types/common/error.types';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

/**
 * API Configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;
const PUBLIC_AUTH_ENDPOINT_PREFIXES = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/oauth/',
];

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshAuthPromise: Promise<string | null> | null = null;

const getRequestUrl = (config?: InternalAxiosRequestConfig): string => {
  return config?.url ?? '';
};

const isPublicAuthRequest = (config?: InternalAxiosRequestConfig): boolean => {
  const url = getRequestUrl(config);
  return PUBLIC_AUTH_ENDPOINT_PREFIXES.some(
    (prefix) => url.startsWith(prefix) || url.includes(`/api/v1${prefix}`)
  );
};

const getOrCreateRefreshPromise = (): Promise<string | null> => {
  if (!refreshAuthPromise) {
    refreshAuthPromise = (async () => {
      const authState = useAuthStore.getState();
      await authState.refreshAuth();
      return useAuthStore.getState().token;
    })().finally(() => {
      refreshAuthPromise = null;
    });
  }

  return refreshAuthPromise;
};

const handleExpiredSession = (): void => {
  const authState = useAuthStore.getState();
  const notificationState = useNotificationStore.getState();

  authState.clearAuth();
  notificationState.error(
    'Authentication Error',
    'Your session has expired. Please login again.'
  );

  window.location.href = '/login';
};

/**
 * Create Axios instance with default configuration
 */
const createAPIClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      // Add authentication token if available
      const authState = useAuthStore.getState();
      if (authState.token) {
        config.headers.Authorization = `Bearer ${authState.token}`;
      }

      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      if (config.params) {
        config.params._t = timestamp;
      } else {
        config.params = { _t: timestamp };
      }

      // Log requests in development
      if (import.meta.env.DEV) {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.params);
      }

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
      // Log responses in development
      if (import.meta.env.DEV) {
        console.log(
          `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
          response.data
        );
      }
      return response;
    },
    async (error: AxiosError<{ error?: AppError }>): Promise<never> => {
      // Log errors in development
      if (import.meta.env.DEV) {
        console.error('[API Error]', error);
      }

      const originalRequest = error.config as RetryableRequestConfig | undefined;

      // Handle authentication errors with token refresh
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isPublicAuthRequest(originalRequest)
      ) {
        originalRequest._retry = true;

        try {
          // Refresh once for concurrent 401 responses, then reuse the same promise.
          const newToken = await getOrCreateRefreshPromise();

          // Retry the original request with new token
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          if (!newToken) {
            throw new Error('No token returned from refresh');
          }

          return client(originalRequest);
        } catch (refreshError) {
          handleExpiredSession();
          return Promise.reject(refreshError);
        }
      }

      // Re-throw with structured error
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * API client instance
 */
export const apiClient = createAPIClient();

/**
 * Extract AppError from Axios error
 */
export const extractErrorFromAxiosError = (error: unknown): AppError => {
  if (!axios.isAxiosError(error)) {
    return createInternalError('An unexpected error occurred');
  }

  const axiosError = error as AxiosError<{ error?: AppError }>;

  // Network error (no response)
  if (!axiosError.response) {
    if (axiosError.code === 'ECONNABORTED') {
      return {
        code: ErrorCode.TIMEOUT_ERROR,
        message: 'Request timeout',
        statusCode: 0,
        timestamp: new Date(),
      };
    }
    return createNetworkError('Network error - unable to reach the server');
  }

  // Server returned an error
  const { response } = axiosError;
  const serverError = response.data?.error;

  if (serverError) {
    return serverError;
  }

  // Generic error based on status code
  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: response.statusText || 'An error occurred',
    statusCode: response.status,
    timestamp: new Date(),
  };
};
