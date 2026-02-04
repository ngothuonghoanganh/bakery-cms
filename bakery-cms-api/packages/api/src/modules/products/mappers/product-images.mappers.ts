/**
 * Product Images mappers
 * Transform between Sequelize models and DTOs
 */

import { ProductImageModel, FileModel } from '@bakery-cms/database';
import { ProductImageResponseDto, AddProductImageDto } from '../dto/product-images.dto';
import { toFileResponseDto } from '../../files/mappers/files.mappers';
import { toIsoString } from '../../../utils/date';

/**
 * Extended ProductImageModel type with file association
 */
type ProductImageWithFile = ProductImageModel & {
  file?: FileModel | null;
};

/**
 * Map ProductImageModel to ProductImageResponseDto
 * Pure function that transforms database entity to API response
 */
export const toProductImageResponseDto = (
  model: ProductImageWithFile
): ProductImageResponseDto => {
  return {
    id: model.id,
    productId: model.productId,
    fileId: model.fileId,
    file: model.file ? toFileResponseDto(model.file) : null as any,
    displayOrder: model.displayOrder,
    isPrimary: model.isPrimary,
    createdAt: toIsoString(model.createdAt),
    updatedAt: toIsoString(model.updatedAt),
  };
};

/**
 * Map array of ProductImageModel to array of ProductImageResponseDto
 * Pure function for batch transformation
 */
export const toProductImageResponseDtoList = (
  models: ProductImageWithFile[]
): ProductImageResponseDto[] => {
  return models.map(toProductImageResponseDto);
};

/**
 * Map AddProductImageDto to ProductImageModel creation attributes
 * Pure function that prepares data for model creation
 */
export const toProductImageCreationAttributes = (
  productId: string,
  dto: AddProductImageDto
): Partial<ProductImageModel> => {
  return {
    productId,
    fileId: dto.fileId,
    displayOrder: dto.displayOrder ?? 0,
    isPrimary: dto.isPrimary ?? false,
  };
};
