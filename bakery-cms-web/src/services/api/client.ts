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

      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Handle authentication errors with token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token
          const authState = useAuthStore.getState();
          await authState.refreshAuth();

          // Retry the original request with new token
          const newToken = useAuthStore.getState().token;
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          return client(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          const authState = useAuthStore.getState();
          const notificationState = useNotificationStore.getState();

          authState.clearAuth();
          notificationState.error(
            'Authentication Error',
            'Your session has expired. Please login again.'
          );

          // Redirect to login page
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // Handle authorization errors
      if (error.response?.status === 403) {
        const notificationState = useNotificationStore.getState();
        notificationState.error(
          'Authorization Error',
          'You do not have permission to perform this action.'
        );
      }

      // Handle server errors
      if (error.response?.status && error.response.status >= 500) {
        const notificationState = useNotificationStore.getState();
        notificationState.error(
          'Server Error',
          'An error occurred on the server. Please try again later.'
        );
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
