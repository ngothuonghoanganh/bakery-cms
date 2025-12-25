/**
 * Product stock request handlers
 * HTTP layer for product stock items endpoints
 * Handles Express request/response
 */

import { Request, Response, NextFunction } from 'express';
import { ProductStockService } from '../services/product-stock.services';
import {
  AddStockItemToProductDto,
  UpdateProductStockItemDto,
} from '../dto/product-stock.dto';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Product stock handlers interface
 * Defines all HTTP handlers for product stock items endpoints
 */
export interface ProductStockHandlers {
  handleAddStockItemToProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetProductRecipe(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleUpdateProductStockItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleRemoveStockItemFromProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetProductCost(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleCheckStockItemDeletionProtection(req: Request, res: Response, next: NextFunction): Promise<void>;
}

/**
 * Create product stock handlers
 * Factory function that returns handler implementation
 * Uses dependency injection for service
 */
export const createProductStockHandlers = (
  service: ProductStockService
): ProductStockHandlers => {
  /**
   * Handle add stock item to product request
   * POST /api/products/:id/stock-items
   */
  const handleAddStockItemToProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id: productId } = req.params;
      const dto: AddStockItemToProductDto = req.body;

      if (!productId) {
        return next(new Error('Product ID is required'));
      }

      const result = await service.addStockItemToProduct(productId, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Stock item added to product', {
        productId,
        stockItemId: result.value.stockItemId,
      });

      res.status(201).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleAddStockItemToProduct', { error });
      next(error);
    }
  };

  /**
   * Handle get product recipe request
   * GET /api/products/:id/stock-items
   */
  const handleGetProductRecipe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id: productId } = req.params;

      if (!productId) {
        return next(new Error('Product ID is required'));
      }

      const result = await service.getProductRecipe(productId);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetProductRecipe', { error });
      next(error);
    }
  };

  /**
   * Handle update product stock item request
   * PATCH /api/products/:id/stock-items/:stockItemId
   */
  const handleUpdateProductStockItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id: productId, stockItemId } = req.params;
      const dto: UpdateProductStockItemDto = req.body;

      if (!productId) {
        return next(new Error('Product ID is required'));
      }

      if (!stockItemId) {
        return next(new Error('Stock item ID is required'));
      }

      const result = await service.updateProductStockItem(productId, stockItemId, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Product stock item updated', { productId, stockItemId });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleUpdateProductStockItem', { error });
      next(error);
    }
  };

  /**
   * Handle remove stock item from product request
   * DELETE /api/products/:id/stock-items/:stockItemId
   */
  const handleRemoveStockItemFromProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id: productId, stockItemId } = req.params;

      if (!productId) {
        return next(new Error('Product ID is required'));
      }

      if (!stockItemId) {
        return next(new Error('Stock item ID is required'));
      }

      const result = await service.removeStockItemFromProduct(productId, stockItemId);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Stock item removed from product', { productId, stockItemId });

      res.status(200).json({
        success: true,
        message: 'Stock item removed from product successfully',
      });
    } catch (error) {
      logger.error('Unhandled error in handleRemoveStockItemFromProduct', { error });
      next(error);
    }
  };

  /**
   * Handle get product cost request
   * GET /api/products/:id/cost
   */
  const handleGetProductCost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id: productId } = req.params;

      if (!productId) {
        return next(new Error('Product ID is required'));
      }

      const result = await service.calculateProductCost(productId);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetProductCost', { error });
      next(error);
    }
  };

  /**
   * Handle check stock item deletion protection request
   * GET /api/stock-items/:id/deletion-protection
   */
  const handleCheckStockItemDeletionProtection = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id: stockItemId } = req.params;

      if (!stockItemId) {
        return next(new Error('Stock item ID is required'));
      }

      const result = await service.checkStockItemDeletionProtection(stockItemId);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleCheckStockItemDeletionProtection', { error });
      next(error);
    }
  };

  return {
    handleAddStockItemToProduct,
    handleGetProductRecipe,
    handleUpdateProductStockItem,
    handleRemoveStockItemFromProduct,
    handleGetProductCost,
    handleCheckStockItemDeletionProtection,
  };
};
