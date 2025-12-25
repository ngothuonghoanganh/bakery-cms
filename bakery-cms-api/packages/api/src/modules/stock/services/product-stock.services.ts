/**
 * Product stock services
 * Business logic layer for product-stock-item relationships
 * Uses Result type for error handling
 */

import { Result, ok, err } from 'neverthrow';
import { AppError } from '@bakery-cms/common';
import { ProductStockItemRepository } from '../repositories/product-stock-items.repositories';
import { StockItemRepository } from '../repositories/stock-items.repositories';
import { StockItemBrandRepository } from '../repositories/stock-item-brands.repositories';
import {
  AddStockItemToProductDto,
  UpdateProductStockItemDto,
  ProductStockItemResponseDto,
  ProductRecipeResponseDto,
  ProductCostResponseDto,
  ProductCostBreakdownItem,
} from '../dto/product-stock.dto';
import {
  toProductStockItemResponseDto,
  toProductStockItemResponseDtoList,
  toProductStockItemCreationAttributes,
  toProductStockItemUpdateAttributes,
  toProductCostBreakdownItem,
} from '../mappers/product-stock.mappers';
import {
  createNotFoundError,
  createDatabaseError,
  createInvalidInputError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Product stock service interface
 * Defines all business operations for product stock items
 */
export interface ProductStockService {
  addStockItemToProduct(
    productId: string,
    dto: AddStockItemToProductDto
  ): Promise<Result<ProductStockItemResponseDto, AppError>>;
  getProductRecipe(productId: string): Promise<Result<ProductRecipeResponseDto, AppError>>;
  updateProductStockItem(
    productId: string,
    stockItemId: string,
    dto: UpdateProductStockItemDto
  ): Promise<Result<ProductStockItemResponseDto, AppError>>;
  removeStockItemFromProduct(
    productId: string,
    stockItemId: string
  ): Promise<Result<void, AppError>>;
  calculateProductCost(productId: string): Promise<Result<ProductCostResponseDto, AppError>>;
  checkStockItemDeletionProtection(stockItemId: string): Promise<Result<{ canDelete: boolean; productCount: number }, AppError>>;
}

/**
 * Create product stock service
 * Factory function that returns service implementation
 * Uses dependency injection for repositories
 */
export const createProductStockService = (
  productStockItemRepository: ProductStockItemRepository,
  stockItemRepository: StockItemRepository,
  stockItemBrandRepository: StockItemBrandRepository
): ProductStockService => {
  /**
   * Add stock item to product (add ingredient to recipe)
   */
  const addStockItemToProduct = async (
    productId: string,
    dto: AddStockItemToProductDto
  ): Promise<Result<ProductStockItemResponseDto, AppError>> => {
    try {
      logger.info('Adding stock item to product', {
        productId,
        stockItemId: dto.stockItemId,
      });

      // Verify stock item exists
      const stockItem = await stockItemRepository.findById(dto.stockItemId);
      if (!stockItem) {
        logger.warn('Stock item not found', { stockItemId: dto.stockItemId });
        return err(createNotFoundError('Stock item', dto.stockItemId));
      }

      // Verify preferred brand exists if provided
      if (dto.preferredBrandId) {
        const brand = await stockItemBrandRepository.findByStockItemAndBrand(
          dto.stockItemId,
          dto.preferredBrandId
        );
        if (!brand) {
          logger.warn('Preferred brand not found for stock item', {
            stockItemId: dto.stockItemId,
            brandId: dto.preferredBrandId,
          });
          return err(createInvalidInputError('Preferred brand not associated with stock item'));
        }
      }

      // Check if this stock item is already linked to the product
      const existing = await productStockItemRepository.findByProductAndStockItem(
        productId,
        dto.stockItemId
      );
      if (existing) {
        logger.warn('Stock item already linked to product', {
          productId,
          stockItemId: dto.stockItemId,
        });
        return err(createInvalidInputError('Stock item already linked to this product'));
      }

      const attributes = toProductStockItemCreationAttributes(productId, dto);
      const link = await productStockItemRepository.create(attributes);

      logger.info('Stock item added to product successfully', {
        productId,
        stockItemId: dto.stockItemId,
      });

      return ok(toProductStockItemResponseDto(link));
    } catch (error) {
      logger.error('Failed to add stock item to product', { error, productId, dto });
      return err(createDatabaseError('Failed to add stock item to product'));
    }
  };

  /**
   * Get product recipe (all stock items linked to product)
   */
  const getProductRecipe = async (
    productId: string
  ): Promise<Result<ProductRecipeResponseDto, AppError>> => {
    try {
      logger.debug('Fetching product recipe', { productId });

      const stockItems = await productStockItemRepository.findByProductId(productId);

      // Note: Product name would ideally come from Product model
      // For now, we'll use the productId as placeholder
      const response: ProductRecipeResponseDto = {
        productId,
        productName: '', // TODO: Fetch from Product model when needed
        stockItems: toProductStockItemResponseDtoList(stockItems),
      };

      return ok(response);
    } catch (error) {
      logger.error('Failed to fetch product recipe', { error, productId });
      return err(createDatabaseError('Failed to fetch product recipe'));
    }
  };

  /**
   * Update product stock item (update quantity, brand, or notes)
   */
  const updateProductStockItem = async (
    productId: string,
    stockItemId: string,
    dto: UpdateProductStockItemDto
  ): Promise<Result<ProductStockItemResponseDto, AppError>> => {
    try {
      logger.info('Updating product stock item', { productId, stockItemId });

      // Verify preferred brand exists if provided
      if (dto.preferredBrandId !== undefined && dto.preferredBrandId !== null) {
        const brand = await stockItemBrandRepository.findByStockItemAndBrand(
          stockItemId,
          dto.preferredBrandId
        );
        if (!brand) {
          logger.warn('Preferred brand not found for stock item', {
            stockItemId,
            brandId: dto.preferredBrandId,
          });
          return err(createInvalidInputError('Preferred brand not associated with stock item'));
        }
      }

      const attributes = toProductStockItemUpdateAttributes(dto);
      const updated = await productStockItemRepository.update(
        productId,
        stockItemId,
        attributes
      );

      if (!updated) {
        logger.warn('Product stock item not found', { productId, stockItemId });
        return err(createNotFoundError('Product stock item', `${productId}/${stockItemId}`));
      }

      logger.info('Product stock item updated successfully', { productId, stockItemId });

      return ok(toProductStockItemResponseDto(updated));
    } catch (error) {
      logger.error('Failed to update product stock item', {
        error,
        productId,
        stockItemId,
        dto,
      });
      return err(createDatabaseError('Failed to update product stock item'));
    }
  };

  /**
   * Remove stock item from product (remove ingredient from recipe)
   */
  const removeStockItemFromProduct = async (
    productId: string,
    stockItemId: string
  ): Promise<Result<void, AppError>> => {
    try {
      logger.info('Removing stock item from product', { productId, stockItemId });

      const deleted = await productStockItemRepository.delete(productId, stockItemId);

      if (!deleted) {
        logger.warn('Product stock item not found', { productId, stockItemId });
        return err(createNotFoundError('Product stock item', `${productId}/${stockItemId}`));
      }

      logger.info('Stock item removed from product successfully', { productId, stockItemId });

      return ok(undefined);
    } catch (error) {
      logger.error('Failed to remove stock item from product', {
        error,
        productId,
        stockItemId,
      });
      return err(createDatabaseError('Failed to remove stock item from product'));
    }
  };

  /**
   * Calculate product cost based on recipe and brand prices
   */
  const calculateProductCost = async (
    productId: string
  ): Promise<Result<ProductCostResponseDto, AppError>> => {
    try {
      logger.debug('Calculating product cost', { productId });

      const stockItems = await productStockItemRepository.findByProductId(productId);

      const costBreakdown: ProductCostBreakdownItem[] = [];
      let totalCost = 0;

      for (const item of stockItems) {
        let unitPrice = 0;
        let brand = null;

        const preferredBrand = (item as any).preferredBrand;
        if (item.preferredBrandId && preferredBrand) {
          // Use preferred brand price
          const brandPrice = await stockItemBrandRepository.findByStockItemAndBrand(
            item.stockItemId,
            item.preferredBrandId
          );
          if (brandPrice) {
            unitPrice = Number(brandPrice.priceAfterTax);
            brand = preferredBrand;
          }
        } else {
          // Use lowest price brand if no preferred brand
          const brands = await stockItemBrandRepository.findByStockItemId(item.stockItemId);
          if (brands.length > 0) {
            const lowestPriceBrand = brands.reduce((lowest, current) => {
              return Number(current.priceAfterTax) < Number(lowest.priceAfterTax)
                ? current
                : lowest;
            });
            unitPrice = Number(lowestPriceBrand.priceAfterTax);
            brand = (lowestPriceBrand as any).brand ?? null;
          }
        }

        const stockItem = (item as any).stockItem;
        const breakdownItem = toProductCostBreakdownItem(
          stockItem,
          Number(item.quantity),
          brand,
          unitPrice
        );

        costBreakdown.push(breakdownItem);
        totalCost += breakdownItem.totalCost;
      }

      const response: ProductCostResponseDto = {
        productId,
        productName: '', // TODO: Fetch from Product model when needed
        totalCost,
        costBreakdown,
      };

      logger.info('Product cost calculated', { productId, totalCost });

      return ok(response);
    } catch (error) {
      logger.error('Failed to calculate product cost', { error, productId });
      return err(createDatabaseError('Failed to calculate product cost'));
    }
  };

  /**
   * Check if stock item can be deleted (deletion protection)
   * Returns whether the stock item can be deleted and how many products use it
   */
  const checkStockItemDeletionProtection = async (
    stockItemId: string
  ): Promise<Result<{ canDelete: boolean; productCount: number }, AppError>> => {
    try {
      logger.debug('Checking stock item deletion protection', { stockItemId });

      const productCount = await productStockItemRepository.countByStockItemId(stockItemId);

      const result = {
        canDelete: productCount === 0,
        productCount,
      };

      logger.debug('Stock item deletion protection check completed', {
        stockItemId,
        ...result,
      });

      return ok(result);
    } catch (error) {
      logger.error('Failed to check stock item deletion protection', { error, stockItemId });
      return err(createDatabaseError('Failed to check stock item deletion protection'));
    }
  };

  return {
    addStockItemToProduct,
    getProductRecipe,
    updateProductStockItem,
    removeStockItemFromProduct,
    calculateProductCost,
    checkStockItemDeletionProtection,
  };
};
