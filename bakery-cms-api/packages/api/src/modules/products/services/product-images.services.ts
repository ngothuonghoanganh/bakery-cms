/**
 * Product Images service
 * Business logic layer for product images operations
 */

import { Result, ok, err } from 'neverthrow';
import { AppError } from '@bakery-cms/common';
import type { ProductImageRepository } from '../repositories/product-images.repositories';
import type { FileRepository } from '../../files/repositories/files.repositories';
import {
  ProductImageResponseDto,
  AddProductImageDto,
  UpdateProductImageDto,
} from '../dto/product-images.dto';
import {
  toProductImageResponseDto,
  toProductImageResponseDtoList,
  toProductImageCreationAttributes,
} from '../mappers/product-images.mappers';
import {
  createNotFoundError,
  createConflictError,
  createInternalError,
} from '../../../utils/error-factory';

/**
 * Product images service interface
 */
export interface ProductImageService {
  getProductImages(productId: string): Promise<Result<ProductImageResponseDto[], AppError>>;
  addProductImage(
    productId: string,
    dto: AddProductImageDto
  ): Promise<Result<ProductImageResponseDto, AppError>>;
  updateProductImage(
    imageId: string,
    dto: UpdateProductImageDto
  ): Promise<Result<ProductImageResponseDto, AppError>>;
  deleteProductImage(imageId: string): Promise<Result<boolean, AppError>>;
  deleteAllProductImages(productId: string): Promise<Result<number, AppError>>;
  setPrimaryImage(productId: string, imageId: string): Promise<Result<boolean, AppError>>;
  reorderImages(productId: string, imageIds: string[]): Promise<Result<ProductImageResponseDto[], AppError>>;
}

/**
 * Service dependencies
 */
export type ProductImageServiceDependencies = {
  readonly repository: ProductImageRepository;
  readonly fileRepository?: FileRepository;
};

/**
 * Create product images service
 * Factory function that returns service implementation
 */
export const createProductImageService = (
  deps: ProductImageServiceDependencies
): ProductImageService => {
  const { repository, fileRepository } = deps;

  /**
   * Get all images for a product
   */
  const getProductImages = async (
    productId: string
  ): Promise<Result<ProductImageResponseDto[], AppError>> => {
    try {
      const images = await repository.findByProductId(productId);
      return ok(toProductImageResponseDtoList(images as any));
    } catch (error) {
      return err(createInternalError('Failed to fetch product images'));
    }
  };

  /**
   * Add an image to a product
   */
  const addProductImage = async (
    productId: string,
    dto: AddProductImageDto
  ): Promise<Result<ProductImageResponseDto, AppError>> => {
    try {
      // Check if file is already linked to this product
      const existing = await repository.findByProductAndFile(productId, dto.fileId);
      if (existing) {
        return err(createConflictError('This image is already attached to the product'));
      }

      // Verify file exists if fileRepository is provided
      if (fileRepository) {
        const file = await fileRepository.findById(dto.fileId);
        if (!file) {
          return err(createNotFoundError('File', dto.fileId));
        }
      }

      // Get the next display order if not provided
      let displayOrder = dto.displayOrder;
      if (displayOrder === undefined) {
        const maxOrder = await repository.getMaxDisplayOrder(productId);
        displayOrder = maxOrder + 1;
      }

      // If this is the first image or marked as primary, set as primary
      const images = await repository.findByProductId(productId);
      const isPrimary = dto.isPrimary ?? images.length === 0;

      // If setting as primary, unset others
      if (isPrimary && images.length > 0) {
        await repository.setPrimary(productId, ''); // Unset all
      }

      const attributes = toProductImageCreationAttributes(productId, {
        ...dto,
        displayOrder,
        isPrimary,
      });

      const created = await repository.create(attributes);
      return ok(toProductImageResponseDto(created as any));
    } catch (error) {
      return err(createInternalError('Failed to add product image'));
    }
  };

  /**
   * Update a product image
   */
  const updateProductImage = async (
    imageId: string,
    dto: UpdateProductImageDto
  ): Promise<Result<ProductImageResponseDto, AppError>> => {
    try {
      const image = await repository.findById(imageId);
      if (!image) {
        return err(createNotFoundError('Product image', imageId));
      }

      // If setting as primary, unset others first
      if (dto.isPrimary === true) {
        await repository.setPrimary(image.productId, imageId);
      }

      const updated = await repository.update(imageId, dto);
      if (!updated) {
        return err(createNotFoundError('Product image', imageId));
      }

      return ok(toProductImageResponseDto(updated as any));
    } catch (error) {
      return err(createInternalError('Failed to update product image'));
    }
  };

  /**
   * Delete a product image
   */
  const deleteProductImage = async (
    imageId: string
  ): Promise<Result<boolean, AppError>> => {
    try {
      const image = await repository.findById(imageId);
      if (!image) {
        return err(createNotFoundError('Product image', imageId));
      }

      const deleted = await repository.delete(imageId);

      // If this was the primary image, set the first remaining image as primary
      if (image.isPrimary) {
        const remainingImages = await repository.findByProductId(image.productId);
        const firstImage = remainingImages[0];
        if (firstImage) {
          await repository.setPrimary(image.productId, firstImage.id);
        }
      }

      return ok(deleted);
    } catch (error) {
      return err(createInternalError('Failed to delete product image'));
    }
  };

  /**
   * Delete all images for a product
   */
  const deleteAllProductImages = async (
    productId: string
  ): Promise<Result<number, AppError>> => {
    try {
      const deleted = await repository.deleteByProductId(productId);
      return ok(deleted);
    } catch (error) {
      return err(createInternalError('Failed to delete product images'));
    }
  };

  /**
   * Set an image as the primary image
   */
  const setPrimaryImage = async (
    productId: string,
    imageId: string
  ): Promise<Result<boolean, AppError>> => {
    try {
      const image = await repository.findById(imageId);
      if (!image || image.productId !== productId) {
        return err(createNotFoundError('Product image', imageId));
      }

      const result = await repository.setPrimary(productId, imageId);
      return ok(result);
    } catch (error) {
      return err(createInternalError('Failed to set primary image'));
    }
  };

  /**
   * Reorder images for a product
   */
  const reorderImages = async (
    productId: string,
    imageIds: string[]
  ): Promise<Result<ProductImageResponseDto[], AppError>> => {
    try {
      // Update display order for each image
      for (let i = 0; i < imageIds.length; i++) {
        const imageId = imageIds[i];
        if (imageId) {
          await repository.update(imageId, { displayOrder: i });
        }
      }

      const images = await repository.findByProductId(productId);
      return ok(toProductImageResponseDtoList(images as any));
    } catch (error) {
      return err(createInternalError('Failed to reorder product images'));
    }
  };

  return {
    getProductImages,
    addProductImage,
    updateProductImage,
    deleteProductImage,
    deleteAllProductImages,
    setPrimaryImage,
    reorderImages,
  };
};
