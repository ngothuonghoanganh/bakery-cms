/**
 * Product Images handlers
 * Express request handlers for product images endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import type { ProductImageService } from '../services/product-images.services';
import type {
  AddProductImageDto,
  UpdateProductImageDto,
  ReorderProductImagesDto,
} from '../dto/product-images.dto';
import {
  addProductImageSchema,
  updateProductImageSchema,
  reorderProductImagesSchema,
} from '../validators/product-images.validators';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Product images handlers interface
 */
export interface ProductImageHandlers {
  getProductImages: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  addProductImage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateProductImage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteProductImage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  setPrimaryImage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  reorderImages: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

/**
 * Create product images handlers
 * Factory function that returns handlers with injected service
 */
export const createProductImageHandlers = (
  service: ProductImageService
): ProductImageHandlers => {
  /**
   * GET /products/:productId/images
   * Get all images for a product
   */
  const getProductImages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const productId = req.params['productId'] as string;

      const result = await service.getProductImages(productId);

      if (result.isErr()) {
        return next(result.error);
      }

      res.json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Error getting product images', { error });
      next(error);
    }
  };

  /**
   * POST /products/:productId/images
   * Add an image to a product
   */
  const addProductImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const productId = req.params['productId'] as string;

      const { error, value } = addProductImageSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: { message: error.details[0]?.message || 'Validation error' },
        });
        return;
      }

      const dto: AddProductImageDto = value;
      const result = await service.addProductImage(productId, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Product image added', { productId, fileId: dto.fileId });

      res.status(201).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Error adding product image', { error });
      next(error);
    }
  };

  /**
   * PATCH /products/:productId/images/:imageId
   * Update a product image
   */
  const updateProductImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const imageId = req.params['imageId'] as string;

      const { error, value } = updateProductImageSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: { message: error.details[0]?.message || 'Validation error' },
        });
        return;
      }

      const dto: UpdateProductImageDto = value;
      const result = await service.updateProductImage(imageId, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Product image updated', { imageId });

      res.json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Error updating product image', { error });
      next(error);
    }
  };

  /**
   * DELETE /products/:productId/images/:imageId
   * Delete a product image
   */
  const deleteProductImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const imageId = req.params['imageId'] as string;

      const result = await service.deleteProductImage(imageId);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Product image deleted', { imageId });

      res.json({
        success: true,
        message: 'Product image deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting product image', { error });
      next(error);
    }
  };

  /**
   * PUT /products/:productId/images/:imageId/primary
   * Set an image as primary
   */
  const setPrimaryImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const productId = req.params['productId'] as string;
      const imageId = req.params['imageId'] as string;

      const result = await service.setPrimaryImage(productId, imageId);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Primary image set', { productId, imageId });

      res.json({
        success: true,
        message: 'Primary image set successfully',
      });
    } catch (error) {
      logger.error('Error setting primary image', { error });
      next(error);
    }
  };

  /**
   * PUT /products/:productId/images/reorder
   * Reorder product images
   */
  const reorderImages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const productId = req.params['productId'] as string;

      const { error, value } = reorderProductImagesSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: { message: error.details[0]?.message || 'Validation error' },
        });
        return;
      }

      const dto: ReorderProductImagesDto = value;
      const result = await service.reorderImages(productId, dto.imageIds);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Product images reordered', { productId });

      res.json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Error reordering product images', { error });
      next(error);
    }
  };

  return {
    getProductImages,
    addProductImage,
    updateProductImage,
    deleteProductImage,
    setPrimaryImage,
    reorderImages,
  };
};
