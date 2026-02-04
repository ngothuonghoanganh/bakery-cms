/**
 * File DTOs (Data Transfer Objects)
 * Type definitions for API request/response payloads
 */

/**
 * File response DTO
 * Returned in API responses
 */
export type FileResponseDto = {
  readonly id: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly url: string;
  readonly uploadedAt: string;
  readonly uploadedBy: string;
};

/**
 * File list query parameters
 * Expected in GET /files
 */
export type FileListQueryDto = {
  readonly page?: number;
  readonly limit?: number;
  readonly mimeType?: string;
  readonly uploadedBy?: string;
};

/**
 * Paginated file list response
 */
export type FileListResponseDto = {
  readonly data: readonly FileResponseDto[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
};

/**
 * Upload file request DTO (internal use)
 * Created from Multer file object
 */
export type UploadFileDto = {
  readonly originalName: string;
  readonly storagePath: string;
  readonly mimeType: string;
  readonly size: number;
  readonly uploadedBy: string;
};
