/**
 * File service
 * Handles all file-related API calls with Result type pattern
 */

import { apiClient, extractErrorFromAxiosError } from './api/client';
import type { Result } from '@/types/common/result.types';
import { ok, err } from '@/types/common/result.types';
import type { AppError } from '@/types/common/error.types';
import type {
  FileAPIResponse,
  PaginatedFilesAPIResponse,
  FileFiltersRequest,
} from '@/types/api/file.api';
import type { FileModel, PaginatedFiles } from '@/types/models/file.model';
import { mapFileFromAPI, mapPaginatedFilesFromAPI } from '@/types/mappers/file.mapper';

/**
 * Upload response wrapper type
 */
type UploadResponse = {
  success: boolean;
  data: FileAPIResponse;
};

/**
 * File service type definition
 */
export type FileService = {
  readonly upload: (file: File) => Promise<Result<FileModel, AppError>>;
  readonly getAll: (filters?: FileFiltersRequest) => Promise<Result<PaginatedFiles, AppError>>;
  readonly getById: (id: string) => Promise<Result<FileModel | null, AppError>>;
  readonly delete: (id: string) => Promise<Result<boolean, AppError>>;
  readonly getStaticUrl: (filename: string) => string;
  readonly getDownloadUrl: (id: string, download?: boolean) => string;
};

/**
 * Upload a file
 */
const upload = async (file: File): Promise<Result<FileModel, AppError>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UploadResponse>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const fileModel = mapFileFromAPI(response.data.data);
    return ok(fileModel);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get all files with optional filters
 */
const getAll = async (
  filters?: FileFiltersRequest
): Promise<Result<PaginatedFiles, AppError>> => {
  try {
    const response = await apiClient.get<PaginatedFilesAPIResponse>('/files', {
      params: filters,
    });
    const paginatedFiles = mapPaginatedFilesFromAPI(response.data);
    return ok(paginatedFiles);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get a file by ID
 */
const getById = async (id: string): Promise<Result<FileModel | null, AppError>> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: FileAPIResponse }>(`/files/${id}`);
    if (!response?.data?.data) return ok(null);

    const fileModel = mapFileFromAPI(response.data.data);
    return ok(fileModel);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Delete a file
 */
const deleteFile = async (id: string): Promise<Result<boolean, AppError>> => {
  try {
    await apiClient.delete(`/files/${id}`);
    return ok(true);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get static file URL for a file
 * Uses relative URL so Vite proxy can forward to backend
 */
const getStaticUrl = (filename: string): string => {
  if (filename.startsWith('/uploads')) {
    return filename;
  }
  if (filename.includes('/uploads/')) {
    // Extract path from full URL if present
    const match = filename.match(/\/uploads\/.+$/);
    if (match) return match[0];
  }
  return `/uploads/${filename}`;
};

/**
 * Get download URL for a file using the static uploads path
 * Uses relative URL so Vite proxy can forward to backend
 */
const getDownloadUrl = (fileIdOrUrl: string, download: boolean = false): string => {
  // If it's already a full URL, extract the path
  if (fileIdOrUrl.startsWith('http://') || fileIdOrUrl.startsWith('https://')) {
    try {
      const url = new URL(fileIdOrUrl);
      return url.pathname + url.search;
    } catch {
      return fileIdOrUrl;
    }
  }
  // If it starts with /uploads, return as-is
  if (fileIdOrUrl.startsWith('/uploads/')) {
    return fileIdOrUrl;
  }
  // For backward compatibility, use the API endpoint for file IDs
  const queryParam = download ? '?download=true' : '';
  return `/api/v1/files/${fileIdOrUrl}/download${queryParam}`;
};

/**
 * File service instance
 */
export const fileService: FileService = {
  upload,
  getAll,
  getById,
  delete: deleteFile,
  getStaticUrl,
  getDownloadUrl,
};

// Named exports for convenience
export const uploadFile = upload;
export const getAllFiles = getAll;
export const getFileById = getById;
export { deleteFile };
export { getStaticUrl };
export { getDownloadUrl };
