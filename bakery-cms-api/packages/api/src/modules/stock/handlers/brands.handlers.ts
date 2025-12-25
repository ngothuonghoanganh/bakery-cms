/**
 * Brands request handlers
 * HTTP layer for brands endpoints
 * Handles Express request/response
 */

import { Request, Response, NextFunction } from 'express';
import { BrandService } from '../services/brands.services';
import {
  CreateBrandDto,
  UpdateBrandDto,
  BrandListQueryDto,
} from '../dto/brands.dto';
import {
  AddBrandToStockItemDto,
  UpdateStockItemBrandDto,
} from '../dto/stock-items.dto';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Brands handlers interface
 * Defines all HTTP handlers for brands endpoints
 */
export interface BrandHandlers {
  handleCreateBrand(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetBrand(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetAllBrands(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleUpdateBrand(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleDeleteBrand(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleRestoreBrand(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleAddBrandToStockItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetStockItemBrands(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleUpdateStockItemBrand(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleRemoveBrandFromStockItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleSetPreferredBrand(req: Request, res: Response, next: NextFunction): Promise<void>;
}

/**
 * Create brands handlers
 * Factory function that returns handler implementation
 * Uses dependency injection for service
 */
export const createBrandHandlers = (
  service: BrandService
): BrandHandlers => {
  /**
   * Handle create brand request
   * POST /api/brands
   */
  const handleCreateBrand = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: CreateBrandDto = req.body;

      const result = await service.createBrand(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Brand created', { brandId: result.value.id });

      res.status(201).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleCreateBrand', { error });
      next(error);
    }
  };

  /**
   * Handle get brand by ID request
   * GET /api/brands/:id
   */
  const handleGetBrand = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new Error('Brand ID is required'));
      }

      const result = await service.getBrandById(id);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetBrand', { error });
      next(error);
    }
  };

  /**
   * Handle get all brands request
   * GET /api/brands
   */
  const handleGetAllBrands = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query: BrandListQueryDto = {
        page: req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined,
        search: req.query['search'] as string,
        isActive: req.query['isActive'] === 'true' ? true : req.query['isActive'] === 'false' ? false : undefined,
      };

      const result = await service.getAllBrands(query);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        ...result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetAllBrands', { error });
      next(error);
    }
  };

  /**
   * Handle update brand request
   * PATCH /api/brands/:id
   */
  const handleUpdateBrand = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateBrandDto = req.body;

      if (!id) {
        return next(new Error('Brand ID is required'));
      }

      const result = await service.updateBrand(id, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Brand updated', { brandId: id });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleUpdateBrand', { error });
      next(error);
    }
  };

  /**
   * Handle delete brand request
   * DELETE /api/brands/:id
   */
  const handleDeleteBrand = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new Error('Brand ID is required'));
      }

      const result = await service.deleteBrand(id);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Brand deleted', { brandId: id });

      res.status(204).send();
    } catch (error) {
      logger.error('Unhandled error in handleDeleteBrand', { error });
      next(error);
    }
  };

  /**
   * Handle restore brand request
   * POST /api/brands/:id/restore
   */
  const handleRestoreBrand = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new Error('Brand ID is required'));
      }

      const result = await service.restoreBrand(id);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Brand restored', { brandId: id });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleRestoreBrand', { error });
      next(error);
    }
  };

  /**
   * Handle add brand to stock item request
   * POST /api/stock-items/:stockItemId/brands
   */
  const handleAddBrandToStockItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { stockItemId } = req.params;
      const dto: AddBrandToStockItemDto = req.body;

      if (!stockItemId) {
        return next(new Error('Stock item ID is required'));
      }

      const result = await service.addBrandToStockItem(stockItemId, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Brand added to stock item', {
        stockItemId,
        brandId: dto.brandId,
      });

      res.status(201).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleAddBrandToStockItem', { error });
      next(error);
    }
  };

  /**
   * Handle get stock item brands request
   * GET /api/stock-items/:stockItemId/brands
   */
  const handleGetStockItemBrands = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { stockItemId } = req.params;

      if (!stockItemId) {
        return next(new Error('Stock item ID is required'));
      }

      const result = await service.getStockItemBrands(stockItemId);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetStockItemBrands', { error });
      next(error);
    }
  };

  /**
   * Handle update stock item brand request
   * PATCH /api/stock-items/:stockItemId/brands/:brandId
   */
  const handleUpdateStockItemBrand = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { stockItemId, brandId } = req.params;
      const dto: UpdateStockItemBrandDto = req.body;

      if (!stockItemId || !brandId) {
        return next(new Error('Stock item ID and brand ID are required'));
      }

      const result = await service.updateStockItemBrand(stockItemId, brandId, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Stock item brand updated', { stockItemId, brandId });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleUpdateStockItemBrand', { error });
      next(error);
    }
  };

  /**
   * Handle remove brand from stock item request
   * DELETE /api/stock-items/:stockItemId/brands/:brandId
   */
  const handleRemoveBrandFromStockItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { stockItemId, brandId } = req.params;

      if (!stockItemId || !brandId) {
        return next(new Error('Stock item ID and brand ID are required'));
      }

      const result = await service.removeBrandFromStockItem(stockItemId, brandId);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Brand removed from stock item', { stockItemId, brandId });

      res.status(204).send();
    } catch (error) {
      logger.error('Unhandled error in handleRemoveBrandFromStockItem', { error });
      next(error);
    }
  };

  /**
   * Handle set preferred brand for stock item request
   * POST /api/stock-items/:stockItemId/brands/:brandId/set-preferred
   */
  const handleSetPreferredBrand = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { stockItemId, brandId } = req.params;

      if (!stockItemId || !brandId) {
        return next(new Error('Stock item ID and brand ID are required'));
      }

      const result = await service.setPreferredBrand(stockItemId, brandId);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Preferred brand set for stock item', { stockItemId, brandId });

      res.status(200).json({
        success: true,
        message: 'Preferred brand set successfully',
      });
    } catch (error) {
      logger.error('Unhandled error in handleSetPreferredBrand', { error });
      next(error);
    }
  };

  return {
    handleCreateBrand,
    handleGetBrand,
    handleGetAllBrands,
    handleUpdateBrand,
    handleDeleteBrand,
    handleRestoreBrand,
    handleAddBrandToStockItem,
    handleGetStockItemBrands,
    handleUpdateStockItemBrand,
    handleRemoveBrandFromStockItem,
    handleSetPreferredBrand,
  };
};
