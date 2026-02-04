/**
 * Product services
 * Business logic layer for products
 * Uses Result type for error handling
 */

import { Result, ok, err } from 'neverthrow';
import { AppError } from '@bakery-cms/common';
import { ProductRepository } from '../repositories/products.repositories';
import type { ProductImageRepository } from '../repositories/product-images.repositories';
import type { FileService } from '../../files/services/files.services';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductListQueryDto,
  ProductResponseDto,
  ProductListResponseDto,
  ProductImageInputDto,
} from '../dto/products.dto';
import {
  toProductResponseDto,
  toProductResponseDtoList,
  toProductCreationAttributes,
  toProductUpdateAttributes,
} from '../mappers/products.mappers';
import {
  createNotFoundError,
  createDatabaseError,
  createInvalidInputError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Product service interface
 * Defines all business operations for products
 */
export interface ProductService {
  createProduct(dto: CreateProductDto): Promise<Result<ProductResponseDto, AppError>>;
  getProductById(id: string): Promise<Result<ProductResponseDto, AppError>>;
  getAllProducts(query: ProductListQueryDto): Promise<Result<ProductListResponseDto, AppError>>;
  updateProduct(id: string, dto: UpdateProductDto): Promise<Result<ProductResponseDto, AppError>>;
  deleteProduct(id: string): Promise<Result<void, AppError>>;
  restoreProduct(id: string): Promise<Result<ProductResponseDto, AppError>>;
}

/**
 * Product service dependencies
 */
export type ProductServiceDependencies = {
  readonly repository: ProductRepository;
  readonly fileService?: FileService;
  readonly productImageRepository?: ProductImageRepository;
};

/**
 * Create product service
 * Factory function that returns service implementation
 * Uses dependency injection for repository and optional file service
 */
export const createProductService = (deps: ProductServiceDependencies): ProductService => {
  const { repository, fileService, productImageRepository } = deps;

  /**
   * Helper function to sync product images
   * Handles creating, updating, and deleting product images based on input
   */
  const syncProductImages = async (
    productId: string,
    images: ProductImageInputDto[]
  ): Promise<void> => {
    if (!productImageRepository) {
      logger.warn('Product image repository not available, skipping image sync');
      return;
    }

    // Get existing images for this product
    const existingImages = await productImageRepository.findByProductId(productId);
    const existingImageIds = new Set(existingImages.map((img) => img.id));
    const inputImageIds = new Set(images.filter((img) => img.id).map((img) => img.id as string));

    // Delete images that are no longer in the input
    for (const existingImage of existingImages) {
      if (!inputImageIds.has(existingImage.id)) {
        await productImageRepository.delete(existingImage.id);
        logger.debug('Deleted product image', { imageId: existingImage.id, productId });
      }
    }

    // Create or update images from input
    for (let i = 0; i < images.length; i++) {
      const imageInput = images[i];
      if (!imageInput) continue;

      const displayOrder = imageInput.displayOrder ?? i;
      const isPrimary = imageInput.isPrimary ?? i === 0;

      if (imageInput.id && existingImageIds.has(imageInput.id)) {
        // Update existing image
        await productImageRepository.update(imageInput.id, {
          displayOrder,
          isPrimary,
        });
        logger.debug('Updated product image', { imageId: imageInput.id, productId });
      } else {
        // Create new image (ignore the temp id from frontend)
        const existing = await productImageRepository.findByProductAndFile(
          productId,
          imageInput.fileId
        );
        if (!existing) {
          await productImageRepository.create({
            productId,
            fileId: imageInput.fileId,
            displayOrder,
            isPrimary,
          });
          logger.debug('Created product image', { fileId: imageInput.fileId, productId });
        }
      }
    }

    // Ensure exactly one primary image if there are images
    const updatedImages = await productImageRepository.findByProductId(productId);
    const hasPrimary = updatedImages.some((img) => img.isPrimary);
    if (updatedImages.length > 0 && !hasPrimary) {
      const firstImage = updatedImages[0];
      if (firstImage) {
        await productImageRepository.setPrimary(productId, firstImage.id);
      }
    }
  };

  /**
   * Create new product
   */
  const createProduct = async (
    dto: CreateProductDto
  ): Promise<Result<ProductResponseDto, AppError>> => {
    try {
      logger.info('Creating new product', { productName: dto.name });

      const attributes = toProductCreationAttributes(dto);
      const product = await repository.create(attributes);

      // Handle product images if provided
      if (dto.images && dto.images.length > 0) {
        await syncProductImages(product.id, dto.images);
      }

      // Re-fetch the product to include the newly created images
      const updatedProduct = await repository.findById(product.id);

      logger.info('Product created successfully', { productId: product.id });

      return ok(toProductResponseDto(updatedProduct || product));
    } catch (error) {
      logger.error('Failed to create product', { error, dto });
      return err(createDatabaseError('Failed to create product', error));
    }
  };

  /**
   * Get product by ID
   */
  const getProductById = async (id: string): Promise<Result<ProductResponseDto, AppError>> => {
    try {
      logger.debug('Fetching product by ID', { productId: id });

      const product = await repository.findById(id);

      if (!product) {
        logger.warn('Product not found', { productId: id });
        return err(createNotFoundError('Product', id));
      }

      return ok(toProductResponseDto(product));
    } catch (error) {
      logger.error('Failed to fetch product', { error, productId: id });
      return err(createDatabaseError('Failed to fetch product', error));
    }
  };

  /**
   * Get all products with filtering and pagination
   */
  const getAllProducts = async (
    query: ProductListQueryDto
  ): Promise<Result<ProductListResponseDto, AppError>> => {
    try {
      logger.debug('Fetching products list', { query });

      const { page = 1, limit = 10 } = query;

      // Validate pagination
      if (page < 1) {
        return err(createInvalidInputError('Page must be at least 1'));
      }

      if (limit < 1 || limit > 100) {
        return err(createInvalidInputError('Limit must be between 1 and 100'));
      }

      const result = await repository.findAll(query);

      const totalPages = Math.ceil(result.count / limit);

      const response: ProductListResponseDto = {
        data: toProductResponseDtoList(result.rows),
        pagination: {
          page,
          limit,
          total: result.count,
          totalPages,
        },
      };

      logger.debug('Products list fetched successfully', {
        count: result.rows.length,
        total: result.count,
      });

      return ok(response);
    } catch (error) {
      logger.error('Failed to fetch products list', { error, query });
      return err(createDatabaseError('Failed to fetch products', error));
    }
  };

  /**
   * Update product by ID
   */
  const updateProduct = async (
    id: string,
    dto: UpdateProductDto
  ): Promise<Result<ProductResponseDto, AppError>> => {
    try {
      logger.info('Updating product', { productId: id, updates: dto });

      const attributes = toProductUpdateAttributes(dto);

      // Check if there are any attributes to update (excluding images which are handled separately)
      const hasAttributeUpdates = Object.keys(attributes).length > 0;
      const hasImageUpdates = dto.images !== undefined;

      if (!hasAttributeUpdates && !hasImageUpdates) {
        return err(createInvalidInputError('No valid fields provided for update'));
      }

      // Check if product exists
      const existingProduct = await repository.findById(id);
      if (!existingProduct) {
        logger.warn('Product not found for update', { productId: id });
        return err(createNotFoundError('Product', id));
      }

      // Update product attributes if any
      let product = existingProduct;
      if (hasAttributeUpdates) {
        const updatedProduct = await repository.update(id, attributes);
        if (!updatedProduct) {
          logger.warn('Product not found for update', { productId: id });
          return err(createNotFoundError('Product', id));
        }
        product = updatedProduct;
      }

      // Handle product images if provided
      if (hasImageUpdates && dto.images) {
        await syncProductImages(id, dto.images);
        // Re-fetch the product to include the updated images
        const refreshedProduct = await repository.findById(id);
        if (refreshedProduct) {
          product = refreshedProduct;
        }
      }

      logger.info('Product updated successfully', { productId: id });

      return ok(toProductResponseDto(product));
    } catch (error) {
      logger.error('Failed to update product', { error, productId: id, dto });
      return err(createDatabaseError('Failed to update product', error));
    }
  };

  /**
   * Delete product by ID (soft delete)
   * Also cleans up associated image file if present
   */
  const deleteProduct = async (id: string): Promise<Result<void, AppError>> => {
    try {
      logger.info('Soft deleting product', { productId: id, operation: 'soft_delete' });

      // Get product first to check for associated file
      const product = await repository.findById(id);

      if (!product) {
        logger.warn('Product not found for deletion', { productId: id });
        return err(createNotFoundError('Product', id));
      }

      // Delete associated image file if exists
      if (product.imageFileId && fileService) {
        logger.info('Cleaning up product image file', {
          productId: id,
          imageFileId: product.imageFileId,
        });
        const deleteFileResult = await fileService.deleteFile(product.imageFileId);
        if (deleteFileResult.isErr()) {
          // Log but don't fail the product deletion
          logger.warn('Failed to delete associated image file', {
            productId: id,
            imageFileId: product.imageFileId,
            error: deleteFileResult.error,
          });
        }
      }

      const deleted = await repository.delete(id);

      if (!deleted) {
        logger.warn('Product not found for deletion', { productId: id });
        return err(createNotFoundError('Product', id));
      }

      logger.info('Product soft deleted successfully', {
        productId: id,
        deletedAt: new Date(),
        metadata: { action: 'soft_delete', recoverable: true },
      });

      return ok(undefined);
    } catch (error) {
      logger.error('Failed to delete product', { error, productId: id });
      return err(createDatabaseError('Failed to delete product', error));
    }
  };

  /**
   * Restore soft-deleted product by ID
   */
  const restoreProduct = async (id: string): Promise<Result<ProductResponseDto, AppError>> => {
    try {
      logger.info('Restoring soft-deleted product', { productId: id, operation: 'restore' });

      const product = await repository.restore(id);

      if (!product) {
        logger.warn('Product not found or not deleted', { productId: id });
        return err(createNotFoundError('Deleted product', id));
      }

      logger.info('Product restored successfully', {
        productId: id,
        restoredAt: new Date(),
        metadata: { action: 'restore', previousState: 'deleted' },
      });

      return ok(toProductResponseDto(product));
    } catch (error) {
      logger.error('Failed to restore product', { error, productId: id });
      return err(createDatabaseError('Failed to restore product', error));
    }
  };

  return {
    createProduct,
    getProductById,
    getAllProducts,
    updateProduct,
    deleteProduct,
    restoreProduct,
  };
};
