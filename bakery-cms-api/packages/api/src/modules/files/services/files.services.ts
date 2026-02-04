/**
 * File services
 * Business logic layer for files
 * Uses Result type for error handling
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { Result, ok, err } from 'neverthrow';
import { AppError, isImageMimeType } from '@bakery-cms/common';
import { FileRepository } from '../repositories/files.repositories';
import {
  FileResponseDto,
  FileListQueryDto,
  FileListResponseDto,
} from '../dto/files.dto';
import {
  toFileResponseDto,
  toFileResponseDtoList,
  toFileCreationAttributes,
  toUploadFileDto,
} from '../mappers/files.mappers';
import {
  createNotFoundError,
  createDatabaseError,
  createInvalidInputError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';
import { getEnvConfig } from '../../../config/env';

const logger = getLogger();

/**
 * File service interface
 * Defines all business operations for files
 */
export type FileService = {
  readonly uploadFile: (
    file: Express.Multer.File,
    uploadedBy: string
  ) => Promise<Result<FileResponseDto, AppError>>;
  readonly getFileById: (id: string) => Promise<Result<FileResponseDto, AppError>>;
  readonly getFilePath: (id: string) => Promise<Result<string, AppError>>;
  readonly getAllFiles: (query: FileListQueryDto) => Promise<Result<FileListResponseDto, AppError>>;
  readonly deleteFile: (id: string) => Promise<Result<void, AppError>>;
};

/**
 * Create file service
 * Factory function that returns service implementation
 * Uses dependency injection for repository
 */
export const createFileService = (
  repository: FileRepository
): FileService => {
  const config = getEnvConfig();

  /**
   * Upload file and create database record
   */
  const uploadFile = async (
    file: Express.Multer.File,
    uploadedBy: string
  ): Promise<Result<FileResponseDto, AppError>> => {
    try {
      logger.info('Uploading file', {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      });

      // Validate file size based on type
      const maxSize = isImageMimeType(file.mimetype)
        ? config.MAX_IMAGE_SIZE
        : config.MAX_VIDEO_SIZE;

      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        return err(
          createInvalidInputError(
            `File size exceeds maximum allowed (${maxSizeMB}MB)`
          )
        );
      }

      // Generate unique filename
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueFilename = `${crypto.randomUUID()}${ext}`;
      const storagePath = path.join(config.UPLOAD_DIR, uniqueFilename);

      // Move file from temp to permanent location (if using memory storage, write buffer)
      if (file.buffer) {
        // Memory storage - write buffer to disk
        await fs.mkdir(config.UPLOAD_DIR, { recursive: true });
        await fs.writeFile(storagePath, file.buffer);
      } else if (file.path) {
        // Disk storage - file is already in the right place
        // Just update the storage path if needed
      }

      // Create file record
      const uploadDto = toUploadFileDto(file, storagePath, uploadedBy);
      const attributes = toFileCreationAttributes(uploadDto);
      const fileRecord = await repository.create(attributes);

      logger.info('File uploaded successfully', {
        fileId: fileRecord.id,
        storagePath,
      });

      return ok(toFileResponseDto(fileRecord));
    } catch (error) {
      logger.error('Failed to upload file', { error });
      return err(createDatabaseError('Failed to upload file', error));
    }
  };

  /**
   * Get file by ID
   */
  const getFileById = async (
    id: string
  ): Promise<Result<FileResponseDto, AppError>> => {
    try {
      logger.debug('Fetching file by ID', { fileId: id });

      const file = await repository.findById(id);

      if (!file) {
        logger.warn('File not found', { fileId: id });
        return err(createNotFoundError('File', id));
      }

      return ok(toFileResponseDto(file));
    } catch (error) {
      logger.error('Failed to fetch file', { error, fileId: id });
      return err(createDatabaseError('Failed to fetch file', error));
    }
  };

  /**
   * Get file storage path by ID
   * Used for serving files
   */
  const getFilePath = async (
    id: string
  ): Promise<Result<string, AppError>> => {
    try {
      const file = await repository.findById(id);

      if (!file) {
        return err(createNotFoundError('File', id));
      }

      return ok(file.storagePath);
    } catch (error) {
      logger.error('Failed to get file path', { error, fileId: id });
      return err(createDatabaseError('Failed to get file path', error));
    }
  };

  /**
   * Get all files with filtering and pagination
   */
  const getAllFiles = async (
    query: FileListQueryDto
  ): Promise<Result<FileListResponseDto, AppError>> => {
    try {
      logger.debug('Fetching files list', { query });

      const { page = 1, limit = 20 } = query;

      // Validate pagination
      if (page < 1) {
        return err(createInvalidInputError('Page must be at least 1'));
      }

      if (limit < 1 || limit > 100) {
        return err(createInvalidInputError('Limit must be between 1 and 100'));
      }

      const result = await repository.findAll(query);
      const totalPages = Math.ceil(result.count / limit);

      const response: FileListResponseDto = {
        data: toFileResponseDtoList(result.rows),
        pagination: {
          page,
          limit,
          total: result.count,
          totalPages,
        },
      };

      logger.debug('Files list fetched successfully', {
        count: result.rows.length,
        total: result.count,
      });

      return ok(response);
    } catch (error) {
      logger.error('Failed to fetch files list', { error, query });
      return err(createDatabaseError('Failed to fetch files', error));
    }
  };

  /**
   * Delete file by ID (hard delete)
   * Removes both database record and physical file
   */
  const deleteFile = async (id: string): Promise<Result<void, AppError>> => {
    try {
      logger.info('Deleting file', { fileId: id });

      // Get file to find storage path
      const file = await repository.findById(id);

      if (!file) {
        logger.warn('File not found for deletion', { fileId: id });
        return err(createNotFoundError('File', id));
      }

      const storagePath = file.storagePath;

      // Delete database record
      const deleted = await repository.delete(id);

      if (!deleted) {
        return err(createDatabaseError('Failed to delete file record'));
      }

      // Delete physical file (ignore errors if file doesn't exist)
      try {
        await fs.unlink(storagePath);
        logger.info('Physical file deleted', { storagePath });
      } catch (unlinkError) {
        // Log but don't fail if physical file is already gone
        logger.warn('Could not delete physical file', {
          storagePath,
          error: unlinkError,
        });
      }

      logger.info('File deleted successfully', { fileId: id });

      return ok(undefined);
    } catch (error) {
      logger.error('Failed to delete file', { error, fileId: id });
      return err(createDatabaseError('Failed to delete file', error));
    }
  };

  return {
    uploadFile,
    getFileById,
    getFilePath,
    getAllFiles,
    deleteFile,
  };
};
