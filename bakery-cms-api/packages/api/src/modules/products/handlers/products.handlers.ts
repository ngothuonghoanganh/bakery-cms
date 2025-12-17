/**
 * Product request handlers
 * HTTP layer for products endpoints
 * Handles Express request/response
 */

import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/products.services';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductListQueryDto,
} from '../dto/products.dto';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Product handlers interface
 * Defines all HTTP handlers for products endpoints
 */
export interface ProductHandlers {
  handleCreateProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetAllProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleUpdateProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleDeleteProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
}

/**
 * Create product handlers
 * Factory function that returns handler implementation
 * Uses dependency injection for service
 */
export const createProductHandlers = (
  service: ProductService
): ProductHandlers => {
  /**
   * Handle create product request
   * POST /api/products
   */
  const handleCreateProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: CreateProductDto = req.body;

      const result = await service.createProduct(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Product created', { productId: result.value.id });

      res.status(201).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleCreateProduct', { error });
      next(error);
    }
  };

  /**
   * Handle get product by ID request
   * GET /api/products/:id
   */
  const handleGetProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new Error('Product ID is required'));
      }

      const result = await service.getProductById(id);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetProduct', { error });
      next(error);
    }
  };

  /**
   * Handle get all products request
   * GET /api/products
   */
  const handleGetAllProducts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query: ProductListQueryDto = {
        page: req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined,
        businessType: req.query['businessType'] as any,
        status: req.query['status'] as any,
        category: req.query['category'] as string,
        search: req.query['search'] as string,
      };

      const result = await service.getAllProducts(query);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        ...result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetAllProducts', { error });
      next(error);
    }
  };

  /**
   * Handle update product request
   * PATCH /api/products/:id
   */
  const handleUpdateProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateProductDto = req.body;

      if (!id) {
        return next(new Error('Product ID is required'));
      }

      const result = await service.updateProduct(id, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Product updated', { productId: id });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleUpdateProduct', { error });
      next(error);
    }
  };

  /**
   * Handle delete product request
   * DELETE /api/products/:id
   */
  const handleDeleteProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new Error('Product ID is required'));
      }

      const result = await service.deleteProduct(id);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Product deleted', { productId: id });

      res.status(204).send();
    } catch (error) {
      logger.error('Unhandled error in handleDeleteProduct', { error });
      next(error);
    }
  };

  return {
    handleCreateProduct,
    handleGetProduct,
    handleGetAllProducts,
    handleUpdateProduct,
    handleDeleteProduct,
  };
};
