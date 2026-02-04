/**
 * Mapper functions for converting file API responses to models
 */

import type { FileAPIResponse, PaginatedFilesAPIResponse } from '@/types/api/file.api';
import type { FileModel, PaginatedFiles } from '@/types/models/file.model';

/**
 * Map a single file API response to a FileModel
 */
export const mapFileFromAPI = (apiResponse: FileAPIResponse): FileModel => ({
  id: apiResponse.id,
  originalName: apiResponse.originalName,
  mimeType: apiResponse.mimeType,
  size: apiResponse.size,
  url: apiResponse.url,
  uploadedAt: new Date(apiResponse.uploadedAt),
  uploadedBy: apiResponse.uploadedBy,
});

/**
 * Map a paginated files API response to PaginatedFiles
 */
export const mapPaginatedFilesFromAPI = (apiResponse: PaginatedFilesAPIResponse): PaginatedFiles => ({
  data: apiResponse.data.map(mapFileFromAPI),
  pagination: apiResponse.pagination,
});
