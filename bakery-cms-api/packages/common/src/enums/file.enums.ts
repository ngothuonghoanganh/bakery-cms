/**
 * File-related enumerations
 */

/**
 * File category determines the type of file
 */
export enum FileCategory {
  IMAGE = 'image',
  VIDEO = 'video',
}

/**
 * Allowed MIME types for image files
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/**
 * Allowed MIME types for video files
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

/**
 * MIME type union types
 */
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
export type AllowedVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number];
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * File extension mappings for MIME types
 */
export const MIME_TO_EXTENSION: Record<AllowedMimeType, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
};

/**
 * Helper to check if a MIME type is valid
 */
export const isValidMimeType = (value: string): value is AllowedMimeType => {
  return ALLOWED_MIME_TYPES.includes(value as AllowedMimeType);
};

/**
 * Helper to check if a MIME type is an image type
 */
export const isImageMimeType = (value: string): value is AllowedImageMimeType => {
  return ALLOWED_IMAGE_MIME_TYPES.includes(value as AllowedImageMimeType);
};

/**
 * Helper to check if a MIME type is a video type
 */
export const isVideoMimeType = (value: string): value is AllowedVideoMimeType => {
  return ALLOWED_VIDEO_MIME_TYPES.includes(value as AllowedVideoMimeType);
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
