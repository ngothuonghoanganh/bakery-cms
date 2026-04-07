/**
 * Product mappers
 * Transform between Sequelize models and DTOs
 */

import {
  ProductModel,
  FileModel,
  ProductImageModel,
  ProductComboItemModel,
} from '@bakery-cms/database';
import { BusinessType, ProductStatus, ProductType } from '@bakery-cms/common';
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
  comboItems?: Array<
    ProductComboItemModel & {
      itemProduct?: ProductModel | null;
    }
  >;
};

/**
 * Map ProductModel to ProductResponseDto
 * Pure function that transforms database entity to API response
 */
export const toProductResponseDto = (model: ProductWithAssociations): ProductResponseDto => {
  const comboItems = (model.comboItems ?? []).map((comboItem) => ({
    id: comboItem.id,
    comboProductId: comboItem.comboProductId,
    itemProductId: comboItem.itemProductId,
    quantity: Number(comboItem.quantity),
    displayOrder: comboItem.displayOrder,
    itemProduct: comboItem.itemProduct
      ? {
          id: comboItem.itemProduct.id,
          productCode: comboItem.itemProduct.productCode,
          name: comboItem.itemProduct.name,
          imageUrl: comboItem.itemProduct.imageUrl,
          imageFileId: comboItem.itemProduct.imageFileId,
        }
      : null,
    createdAt: toIsoString(comboItem.createdAt),
    updatedAt: toIsoString(comboItem.updatedAt),
  }));

  return {
    id: model.id,
    productCode: model.productCode,
    name: model.name,
    description: model.description,
    price: Number(model.price),
    category: model.category,
    businessType: model.businessType as BusinessType,
    status: model.status as ProductStatus,
    productType: (model.productType as ProductType) ?? ProductType.SINGLE,
    isPublished: model.isPublished ?? true,
    comboItems,
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
    productCode: dto.productCode,
    name: dto.name,
    description: dto.description ?? null,
    price: dto.price,
    category: dto.category ?? null,
    businessType: dto.businessType,
    status: dto.status ?? ProductStatus.AVAILABLE,
    productType: dto.productType ?? ProductType.SINGLE,
    isPublished: dto.isPublished ?? true,
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
  if (dto.productCode !== undefined) {
    attributes.productCode = dto.productCode;
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
  if (dto.productType !== undefined) {
    attributes.productType = dto.productType;
  }
  if (dto.isPublished !== undefined) {
    attributes.isPublished = dto.isPublished;
  }
  if (dto.imageUrl !== undefined) {
    attributes.imageUrl = dto.imageUrl ?? null;
  }
  if (dto.imageFileId !== undefined) {
    attributes.imageFileId = dto.imageFileId ?? null;
  }

  return attributes;
};
