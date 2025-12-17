/**
 * Product services
 * Business logic layer for products
 * Uses Result type for error handling
 */

import { Result, ok, err } from 'neverthrow';
import { AppError } from '@bakery-cms/common';
import { ProductRepository } from '../repositories/products.repositories';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductListQueryDto,
  ProductResponseDto,
  ProductListResponseDto,
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
 * Create product service
 * Factory function that returns service implementation
 * Uses dependency injection for repository
 */
export const createProductService = (
  repository: ProductRepository
): ProductService => {
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

      logger.info('Product created successfully', { productId: product.id });

      return ok(toProductResponseDto(product));
    } catch (error) {
      logger.error('Failed to create product', { error, dto });
      return err(createDatabaseError('Failed to create product'));
    }
  };

  /**
   * Get product by ID
   */
  const getProductById = async (
    id: string
  ): Promise<Result<ProductResponseDto, AppError>> => {
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
      return err(createDatabaseError('Failed to fetch product'));
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
      return err(createDatabaseError('Failed to fetch products'));
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

      // Check if there are any attributes to update
      if (Object.keys(attributes).length === 0) {
        return err(createInvalidInputError('No valid fields provided for update'));
      }

      const product = await repository.update(id, attributes);

      if (!product) {
        logger.warn('Product not found for update', { productId: id });
        return err(createNotFoundError('Product', id));
      }

      logger.info('Product updated successfully', { productId: id });

      return ok(toProductResponseDto(product));
    } catch (error) {
      logger.error('Failed to update product', { error, productId: id, dto });
      return err(createDatabaseError('Failed to update product'));
    }
  };

  /**
   * Delete product by ID (soft delete)
   */
  const deleteProduct = async (id: string): Promise<Result<void, AppError>> => {
    try {
      logger.info('Soft deleting product', { productId: id, operation: 'soft_delete' });

      const deleted = await repository.delete(id);

      if (!deleted) {
        logger.warn('Product not found for deletion', { productId: id });
        return err(createNotFoundError('Product', id));
      }

      logger.info('Product soft deleted successfully', { 
        productId: id,
        deletedAt: new Date(),
        metadata: { action: 'soft_delete', recoverable: true }
      });

      return ok(undefined);
    } catch (error) {
      logger.error('Failed to delete product', { error, productId: id });
      return err(createDatabaseError('Failed to delete product'));
    }
  };

  /**
   * Restore soft-deleted product by ID
   */
  const restoreProduct = async (
    id: string
  ): Promise<Result<ProductResponseDto, AppError>> => {
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
        metadata: { action: 'restore', previousState: 'deleted' }
      });

      return ok(toProductResponseDto(product));
    } catch (error) {
      logger.error('Failed to restore product', { error, productId: id });
      return err(createDatabaseError('Failed to restore product'));
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
