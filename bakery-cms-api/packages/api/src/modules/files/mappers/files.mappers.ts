/**
 * File mappers
 * Transform between Sequelize models and DTOs
 */

import * as path from 'path';
import { FileModel } from '@bakery-cms/database';
import { FileResponseDto, UploadFileDto } from '../dto/files.dto';
import { toIsoString } from '../../../utils/date';

/**
 * Build static file URL from storage path
 * Pure function that constructs the static serving path
 * Extracts filename from storage path and returns /uploads/filename
 */
export const buildFileUrl = (storagePath: string): string => {
  const filename = path.basename(storagePath);
  return `/uploads/${filename}`;
};

/**
 * Map FileModel to FileResponseDto
 * Pure function that transforms database entity to API response
 */
export const toFileResponseDto = (model: FileModel): FileResponseDto => {
  return {
    id: model.id,
    originalName: model.originalName,
    mimeType: model.mimeType,
    size: Number(model.size),
    url: buildFileUrl(model.storagePath),
    uploadedAt: toIsoString(model.createdAt),
    uploadedBy: model.uploadedBy,
  };
};

/**
 * Map array of FileModel to array of FileResponseDto
 * Pure function for batch transformation
 */
export const toFileResponseDtoList = (
  models: readonly FileModel[]
): readonly FileResponseDto[] => {
  return models.map(toFileResponseDto);
};

/**
 * Map Multer file to UploadFileDto
 * Pure function that prepares data for model creation
 */
export const toUploadFileDto = (
  file: Express.Multer.File,
  storagePath: string,
  uploadedBy: string
): UploadFileDto => {
  return {
    originalName: file.originalname,
    storagePath,
    mimeType: file.mimetype,
    size: file.size,
    uploadedBy,
  };
};

/**
 * Map UploadFileDto to FileModel creation attributes
 * Pure function that prepares data for model creation
 */
export const toFileCreationAttributes = (
  dto: UploadFileDto
): Partial<FileModel> => {
  return {
    originalName: dto.originalName,
    storagePath: dto.storagePath,
    mimeType: dto.mimeType,
    size: dto.size,
    uploadedBy: dto.uploadedBy,
  };
};
