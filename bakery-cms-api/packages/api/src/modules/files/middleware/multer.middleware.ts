/**
 * Multer middleware configuration for file uploads
 * Handles multipart/form-data for file upload endpoints
 */

import multer from 'multer';
import { ALLOWED_MIME_TYPES, isValidMimeType } from '@bakery-cms/common';
import { getEnvConfig } from '../../../config/env';

/**
 * Create Multer storage configuration
 * Uses memory storage to buffer files before validation
 */
const createStorage = () => {
  return multer.memoryStorage();
};

/**
 * Create file filter to validate uploaded files
 * Checks MIME type against allowed types
 */
const createFileFilter = (): multer.Options['fileFilter'] => {
  return (_req, file, callback) => {
    // Check if MIME type is allowed
    if (!isValidMimeType(file.mimetype)) {
      const error = new Error(
        `Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
      callback(error);
      return;
    }

    // Accept the file
    callback(null, true);
  };
};

/**
 * Create Multer upload instance
 * Configured for single file uploads with size limits
 */
export const createUploadMiddleware = () => {
  const config = getEnvConfig();

  // Use the larger limit (video) as the max since we validate per-type in service
  const maxFileSize = Math.max(config.MAX_IMAGE_SIZE, config.MAX_VIDEO_SIZE);

  return multer({
    storage: createStorage(),
    fileFilter: createFileFilter(),
    limits: {
      fileSize: maxFileSize,
      files: 1, // Single file upload
    },
  });
};

/**
 * Get upload middleware instance
 * Cached singleton for performance
 */
let uploadMiddleware: multer.Multer | null = null;

export const getUploadMiddleware = (): multer.Multer => {
  if (!uploadMiddleware) {
    uploadMiddleware = createUploadMiddleware();
  }
  return uploadMiddleware;
};

/**
 * Single file upload middleware
 * Expects file in 'file' field
 */
export const uploadSingle = () => {
  return getUploadMiddleware().single('file');
};
