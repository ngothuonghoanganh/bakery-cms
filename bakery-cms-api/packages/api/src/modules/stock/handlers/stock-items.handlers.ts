/**
 * Stock items request handlers
 * HTTP layer for stock items endpoints
 * Handles Express request/response
 */

import { Request, Response, NextFunction } from 'express';
import { StockItemService } from '../services/stock-items.services';
import {
  CreateStockItemDto,
  UpdateStockItemDto,
  StockItemListQueryDto,
  ReceiveStockDto,
  AdjustStockDto,
  BulkImportStockItemRowDto,
} from '../dto/stock-items.dto';
import { parse } from 'csv-parse/sync';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Stock items handlers interface
 * Defines all HTTP handlers for stock items endpoints
 */
export interface StockItemHandlers {
  handleCreateStockItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetStockItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetAllStockItems(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleUpdateStockItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleDeleteStockItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleRestoreStockItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleReceiveStock(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleAdjustStock(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleBulkImport(req: Request, res: Response, next: NextFunction): Promise<void>;
}

/**
 * Create stock items handlers
 * Factory function that returns handler implementation
 * Uses dependency injection for service
 */
export const createStockItemHandlers = (
  service: StockItemService
): StockItemHandlers => {
  /**
   * Handle create stock item request
   * POST /api/stock-items
   */
  const handleCreateStockItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: CreateStockItemDto = req.body;

      const result = await service.createStockItem(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Stock item created', { stockItemId: result.value.id });

      res.status(201).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleCreateStockItem', { error });
      next(error);
    }
  };

  /**
   * Handle get stock item by ID request
   * GET /api/stock-items/:id
   */
  const handleGetStockItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new Error('Stock item ID is required'));
      }

      const result = await service.getStockItemById(id);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetStockItem', { error });
      next(error);
    }
  };

  /**
   * Handle get all stock items request
   * GET /api/stock-items
   */
  const handleGetAllStockItems = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query: StockItemListQueryDto = {
        page: req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined,
        status: req.query['status'] as any,
        search: req.query['search'] as string,
        lowStockOnly: req.query['lowStockOnly'] === 'true',
        sortBy: req.query['sortBy'] as StockItemListQueryDto['sortBy'],
        sortOrder: req.query['sortOrder'] as StockItemListQueryDto['sortOrder'],
      };

      const result = await service.getAllStockItems(query);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        ...result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetAllStockItems', { error });
      next(error);
    }
  };

  /**
   * Handle update stock item request
   * PATCH /api/stock-items/:id
   */
  const handleUpdateStockItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateStockItemDto = req.body;

      if (!id) {
        return next(new Error('Stock item ID is required'));
      }

      const result = await service.updateStockItem(id, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Stock item updated', { stockItemId: id });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleUpdateStockItem', { error });
      next(error);
    }
  };

  /**
   * Handle delete stock item request
   * DELETE /api/stock-items/:id
   */
  const handleDeleteStockItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new Error('Stock item ID is required'));
      }

      const result = await service.deleteStockItem(id);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Stock item deleted', { stockItemId: id });

      res.status(204).send();
    } catch (error) {
      logger.error('Unhandled error in handleDeleteStockItem', { error });
      next(error);
    }
  };

  /**
   * Handle restore stock item request
   * POST /api/stock-items/:id/restore
   */
  const handleRestoreStockItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new Error('Stock item ID is required'));
      }

      const result = await service.restoreStockItem(id);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Stock item restored', { stockItemId: id });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleRestoreStockItem', { error });
      next(error);
    }
  };

  /**
   * Handle receive stock request
   * POST /api/stock-items/:id/receive
   */
  const handleReceiveStock = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: ReceiveStockDto = req.body;
      const userId = (req as any).user?.id;

      if (!id) {
        return next(new Error('Stock item ID is required'));
      }

      if (!userId) {
        return next(new Error('User authentication required'));
      }

      const result = await service.receiveStock(id, dto, userId);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Stock received', { stockItemId: id, quantity: dto.quantity, userId });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleReceiveStock', { error });
      next(error);
    }
  };

  /**
   * Handle adjust stock request
   * POST /api/stock-items/:id/adjust
   */
  const handleAdjustStock = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: AdjustStockDto = req.body;
      const userId = (req as any).user?.id;

      if (!id) {
        return next(new Error('Stock item ID is required'));
      }

      if (!userId) {
        return next(new Error('User authentication required'));
      }

      const result = await service.adjustStock(id, dto, userId);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Stock adjusted', { stockItemId: id, adjustment: dto.quantity, userId });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleAdjustStock', { error });
      next(error);
    }
  };

  /**
   * Handle bulk import stock items request
   * POST /api/stock-items/bulk-import
   * Expects multipart/form-data with a CSV file
   */
  const handleBulkImport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const file = (req as any).file;

      if (!file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'CSV file is required',
          },
        });
        return;
      }

      // Parse CSV content
      const csvContent = file.buffer.toString('utf-8');
      let records: Record<string, string>[];

      try {
        records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
      } catch (parseError) {
        logger.error('Failed to parse CSV file', { parseError });
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid CSV format. Please check the file structure.',
          },
        });
        return;
      }

      if (records.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'CSV file is empty or has no data rows',
          },
        });
        return;
      }

      // Transform CSV records to DTOs
      const rows: BulkImportStockItemRowDto[] = records.map((record) => {
        const quantityStr = record['currentQuantity'] || record['current_quantity'] || record['Quantity'];
        const thresholdStr = record['reorderThreshold'] || record['reorder_threshold'] || record['Threshold'];

        return {
          name: record['name'] || record['Name'] || '',
          description: record['description'] || record['Description'] || undefined,
          unitOfMeasure: record['unitOfMeasure'] || record['unit_of_measure'] || record['Unit'] || '',
          currentQuantity: quantityStr ? parseFloat(quantityStr) : undefined,
          reorderThreshold: thresholdStr ? parseFloat(thresholdStr) : undefined,
        };
      });

      const result = await service.bulkImportStockItems(rows);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Bulk import completed', {
        totalRows: result.value.totalRows,
        successCount: result.value.successCount,
        errorCount: result.value.errorCount,
      });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleBulkImport', { error });
      next(error);
    }
  };

  return {
    handleCreateStockItem,
    handleGetStockItem,
    handleGetAllStockItems,
    handleUpdateStockItem,
    handleDeleteStockItem,
    handleRestoreStockItem,
    handleReceiveStock,
    handleAdjustStock,
    handleBulkImport,
  };
};
