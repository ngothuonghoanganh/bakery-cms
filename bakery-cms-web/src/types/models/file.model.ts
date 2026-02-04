/**
 * File model types for frontend use
 * Represents file data in the UI
 */

export type FileModel = {
  readonly id: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly url: string;
  readonly uploadedAt: Date;
  readonly uploadedBy: string;
};

export type PaginatedFiles = {
  readonly data: readonly FileModel[];
  readonly pagination: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
  };
};

/**
 * File category for grouping files
 */
export const FileCategory = {
  IMAGE: 'image',
  VIDEO: 'video',
} as const;

export type FileCategory = (typeof FileCategory)[keyof typeof FileCategory];

/**
 * Allowed MIME types for images
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/**
 * Allowed MIME types for videos
 */
export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
] as const;

/**
 * All allowed MIME types
 */
export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
export type AllowedVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number];
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Check if a MIME type is an image type
 */
export const isImageMimeType = (mimeType: string): boolean => {
  return ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as AllowedImageMimeType);
};

/**
 * Check if a MIME type is a video type
 */
export const isVideoMimeType = (mimeType: string): boolean => {
  return ALLOWED_VIDEO_MIME_TYPES.includes(mimeType as AllowedVideoMimeType);
};

/**
 * Check if a MIME type is valid
 */
export const isValidMimeType = (mimeType: string): boolean => {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
};

/**
 * Get file category from MIME type
 */
export const getFileCategoryFromMimeType = (mimeType: string): FileCategory | null => {
  if (isImageMimeType(mimeType)) {
    return FileCategory.IMAGE;
  }
  if (isVideoMimeType(mimeType)) {
    return FileCategory.VIDEO;
  }
  return null;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
