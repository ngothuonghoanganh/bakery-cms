/**
 * File entity types and interfaces
 * Supports file upload and metadata storage
 */

import { Result } from './result.types';
import { AppError } from './error.types';

/**
 * Core File entity
 */
export type File = {
  readonly id: string;
  readonly originalName: string;
  readonly storagePath: string;
  readonly mimeType: string;
  readonly size: number;
  readonly uploadedBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

/**
 * Data Transfer Object for creating a file record
 */
export type CreateFileDTO = {
  readonly originalName: string;
  readonly storagePath: string;
  readonly mimeType: string;
  readonly size: number;
  readonly uploadedBy: string;
};

/**
 * File response DTO with computed URL
 */
export type FileResponseDTO = {
  readonly id: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly url: string;
  readonly uploadedAt: Date;
  readonly uploadedBy: string;
};

/**
 * Filters for querying files
 */
export type FileFilters = {
  readonly mimeType?: string;
  readonly uploadedBy?: string;
};

/**
 * Paginated file response
 */
export type PaginatedFiles = {
  readonly files: readonly FileResponseDTO[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
};

/**
 * File repository interface (Dependency Inversion Principle)
 */
export type FileRepository = {
  readonly findById: (id: string) => Promise<File | null>;
  readonly findAll: (filters?: FileFilters, page?: number, limit?: number) => Promise<readonly File[]>;
  readonly create: (data: CreateFileDTO) => Promise<File>;
  readonly delete: (id: string) => Promise<boolean>;
  readonly count: (filters?: FileFilters) => Promise<number>;
};

/**
 * File service interface (Dependency Inversion Principle)
 */
export type FileService = {
  readonly getFileById: (id: string) => Promise<Result<File, AppError>>;
  readonly getAllFiles: (
    filters?: FileFilters,
    page?: number,
    limit?: number
  ) => Promise<Result<PaginatedFiles, AppError>>;
  readonly uploadFile: (
    file: Express.Multer.File,
    uploadedBy: string
  ) => Promise<Result<FileResponseDTO, AppError>>;
  readonly deleteFile: (id: string) => Promise<Result<void, AppError>>;
};

/**
 * Upload configuration constants
 */
export const FILE_UPLOAD_CONFIG = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  DEFAULT_UPLOAD_DIR: './uploads',
} as const;
