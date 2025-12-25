/**
 * Stock movements request handlers
 * HTTP layer for stock movements endpoints
 * Handles Express request/response
 */

import { Request, Response, NextFunction } from 'express';
import { StockMovementService } from '../services/stock-movements.services';
import { StockMovementListQueryDto } from '../dto/stock-movements.dto';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Stock movements handlers interface
 * Defines all HTTP handlers for stock movements endpoints
 */
export interface StockMovementHandlers {
  handleGetStockMovement(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetAllStockMovements(req: Request, res: Response, next: NextFunction): Promise<void>;
}

/**
 * Create stock movements handlers
 * Factory function that returns handler implementation
 * Uses dependency injection for service
 */
export const createStockMovementHandlers = (
  service: StockMovementService
): StockMovementHandlers => {
  /**
   * Handle get stock movement by ID request
   * GET /api/stock-movements/:id
   */
  const handleGetStockMovement = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await service.getStockMovementById(id!);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Stock movement fetched', { stockMovementId: id });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetStockMovement', { error });
      next(error);
    }
  };

  /**
   * Handle get all stock movements request
   * GET /api/stock-movements
   */
  const handleGetAllStockMovements = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query: StockMovementListQueryDto = {
        page: req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined,
        stockItemId: req.query['stockItemId'] as string | undefined,
        type: req.query['type'] as any,
        userId: req.query['userId'] as string | undefined,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
      };

      const result = await service.getAllStockMovements(query);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Stock movements list fetched', {
        count: result.value.data.length,
        total: result.value.pagination.total,
      });

      res.status(200).json({
        success: true,
        data: result.value.data,
        pagination: result.value.pagination,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetAllStockMovements', { error });
      next(error);
    }
  };

  return {
    handleGetStockMovement,
    handleGetAllStockMovements,
  };
};
