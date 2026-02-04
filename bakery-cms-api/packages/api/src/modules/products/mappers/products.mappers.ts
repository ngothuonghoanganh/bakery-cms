/**
 * Product mappers
 * Transform between Sequelize models and DTOs
 */

import { ProductModel, FileModel, ProductImageModel } from '@bakery-cms/database';
import { BusinessType, ProductStatus } from '@bakery-cms/common';
import {
  ProductResponseDto,
  CreateProductDto,
  UpdateProductDto,
} from '../dto/products.dto';
import { toFileResponseDto } from '../../files/mappers/files.mappers';
import { toProductImageResponseDto } from './product-images.mappers';
import { toIsoString } from '../../../utils/date';

/**
 * Extended ProductModel type with imageFile and images associations
 */
type ProductWithAssociations = ProductModel & {
  imageFile?: FileModel | null;
  images?: ProductImageModel[];
};

/**
 * Map ProductModel to ProductResponseDto
 * Pure function that transforms database entity to API response
 */
export const toProductResponseDto = (model: ProductWithAssociations): ProductResponseDto => {
  return {
    id: model.id,
    name: model.name,
    description: model.description,
    price: Number(model.price),
    category: model.category,
    businessType: model.businessType as BusinessType,
    status: model.status as ProductStatus,
    imageUrl: model.imageUrl,
    imageFileId: model.imageFileId,
    imageFile: model.imageFile ? toFileResponseDto(model.imageFile) : null,
    images: model.images ? model.images.map(toProductImageResponseDto) : [],
    createdAt: toIsoString(model.createdAt),
    updatedAt: toIsoString(model.updatedAt),
  };
};

/**
 * Map array of ProductModel to array of ProductResponseDto
 * Pure function for batch transformation
 */
export const toProductResponseDtoList = (
  models: ProductModel[]
): ProductResponseDto[] => {
  return models.map(toProductResponseDto);
};

/**
 * Map CreateProductDto to ProductModel creation attributes
 * Pure function that prepares data for model creation
 */
export const toProductCreationAttributes = (
  dto: CreateProductDto
): Partial<ProductModel> => {
  return {
    name: dto.name,
    description: dto.description ?? null,
    price: dto.price,
    category: dto.category ?? null,
    businessType: dto.businessType,
    status: dto.status ?? ProductStatus.AVAILABLE,
    imageUrl: dto.imageUrl ?? null,
    imageFileId: dto.imageFileId ?? null,
  };
};

/**
 * Map UpdateProductDto to ProductModel update attributes
 * Pure function that prepares data for model update
 * Only includes fields that are defined in the DTO
 */
export const toProductUpdateAttributes = (
  dto: UpdateProductDto
): Partial<ProductModel> => {
  const attributes: Partial<ProductModel> = {};

  if (dto.name !== undefined) {
    attributes.name = dto.name;
  }
  if (dto.description !== undefined) {
    attributes.description = dto.description ?? null;
  }
  if (dto.price !== undefined) {
    attributes.price = dto.price;
  }
  if (dto.category !== undefined) {
    attributes.category = dto.category ?? null;
  }
  if (dto.businessType !== undefined) {
    attributes.businessType = dto.businessType;
  }
  if (dto.status !== undefined) {
    attributes.status = dto.status;
  }
  if (dto.imageUrl !== undefined) {
    attributes.imageUrl = dto.imageUrl ?? null;
  }
  if (dto.imageFileId !== undefined) {
    attributes.imageFileId = dto.imageFileId ?? null;
  }

  return attributes;
};
