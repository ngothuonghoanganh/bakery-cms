/**
 * File request handlers
 * HTTP layer for files endpoints
 * Handles Express request/response
 */

import { Response, NextFunction } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileService } from '../services/files.services';
import { FileListQueryDto } from '../dto/files.dto';
import { AuthenticatedRequest } from '../../../middleware/jwt-auth';
import { getLogger } from '../../../utils/logger';
import { createInvalidInputError } from '../../../utils/error-factory';

const logger = getLogger();

/**
 * File handlers interface
 * Defines all HTTP handlers for files endpoints
 */
export interface FileHandlers {
  handleUploadFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
  handleGetFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
  handleGetAllFiles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
  handleDeleteFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
  handleDownloadFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}

/**
 * Create file handlers
 * Factory function that returns handler implementation
 * Uses dependency injection for service
 */
export const createFileHandlers = (
  service: FileService
): FileHandlers => {
  /**
   * Handle file upload request
   * POST /api/files/upload
   */
  const handleUploadFile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const file = req.file;

      if (!file) {
        return next(createInvalidInputError('No file uploaded'));
      }

      if (!req.user) {
        return next(createInvalidInputError('User authentication required'));
      }

      const uploadedBy = req.user.id;

      const result = await service.uploadFile(file, uploadedBy);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('File uploaded', { fileId: result.value.id });

      res.status(201).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleUploadFile', { error });
      next(error);
    }
  };

  /**
   * Handle get file by ID request
   * GET /api/files/:id
   */
  const handleGetFile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(createInvalidInputError('File ID is required'));
      }

      const result = await service.getFileById(id);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetFile', { error });
      next(error);
    }
  };

  /**
   * Handle get all files request
   * GET /api/files
   */
  const handleGetAllFiles = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query: FileListQueryDto = {
        page: req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined,
        mimeType: req.query['mimeType'] as string,
        uploadedBy: req.query['uploadedBy'] as string,
      };

      const result = await service.getAllFiles(query);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        ...result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetAllFiles', { error });
      next(error);
    }
  };

  /**
   * Handle delete file request
   * DELETE /api/files/:id
   */
  const handleDeleteFile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(createInvalidInputError('File ID is required'));
      }

      const result = await service.deleteFile(id);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('File deleted', { fileId: id });

      res.status(204).send();
    } catch (error) {
      logger.error('Unhandled error in handleDeleteFile', { error });
      next(error);
    }
  };

  /**
   * Handle download/view file request
   * GET /api/files/:id/download
   * Serves the actual file with proper headers for caching
   */
  const handleDownloadFile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const download = req.query['download'] === 'true';

      if (!id) {
        return next(createInvalidInputError('File ID is required'));
      }

      // Get file metadata first
      const fileResult = await service.getFileById(id);
      if (fileResult.isErr()) {
        return next(fileResult.error);
      }

      // Get file path
      const pathResult = await service.getFilePath(id);
      if (pathResult.isErr()) {
        return next(pathResult.error);
      }

      const fileData = fileResult.value;
      const filePath = pathResult.value;

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        logger.error('Physical file not found', { fileId: id, filePath });
        return next(createInvalidInputError('File not found on disk'));
      }

      // Set cache headers for browser caching (1 year for immutable files)
      res.set({
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': fileData.mimeType,
        'Content-Length': fileData.size.toString(),
        'ETag': `"${id}"`,
      });

      // Handle conditional requests (304 Not Modified)
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch === `"${id}"`) {
        res.status(304).end();
        return;
      }

      // Set content disposition based on download flag
      if (download) {
        res.set('Content-Disposition', `attachment; filename="${fileData.originalName}"`);
      } else {
        res.set('Content-Disposition', `inline; filename="${fileData.originalName}"`);
      }

      // Send file
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      logger.error('Unhandled error in handleDownloadFile', { error });
      next(error);
    }
  };

  return {
    handleUploadFile,
    handleGetFile,
    handleGetAllFiles,
    handleDeleteFile,
    handleDownloadFile,
  };
};
