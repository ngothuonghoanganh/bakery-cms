/**
 * Stock items services
 * Business logic layer for stock items
 * Uses Result type for error handling
 */

import { Result, ok, err } from 'neverthrow';
import { AppError, MovementType } from '@bakery-cms/common';
import { StockItemRepository } from '../repositories/stock-items.repositories';
import { StockMovementRepository } from '../repositories/stock-movements.repositories';
import {
  CreateStockItemDto,
  UpdateStockItemDto,
  StockItemListQueryDto,
  StockItemResponseDto,
  StockItemListResponseDto,
  ReceiveStockDto,
  AdjustStockDto,
  BulkImportStockItemRowDto,
  BulkImportResponseDto,
  BulkImportRowResultDto,
} from '../dto/stock-items.dto';
import {
  toStockItemResponseDto,
  toStockItemResponseDtoList,
  toStockItemCreationAttributes,
  toStockItemUpdateAttributes,
} from '../mappers/stock-items.mappers';
import {
  createNotFoundError,
  createDatabaseError,
  createInvalidInputError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Stock items service interface
 * Defines all business operations for stock items
 */
export interface StockItemService {
  createStockItem(dto: CreateStockItemDto): Promise<Result<StockItemResponseDto, AppError>>;
  getStockItemById(id: string): Promise<Result<StockItemResponseDto, AppError>>;
  getAllStockItems(query: StockItemListQueryDto): Promise<Result<StockItemListResponseDto, AppError>>;
  updateStockItem(id: string, dto: UpdateStockItemDto): Promise<Result<StockItemResponseDto, AppError>>;
  deleteStockItem(id: string): Promise<Result<void, AppError>>;
  restoreStockItem(id: string): Promise<Result<StockItemResponseDto, AppError>>;
  receiveStock(id: string, dto: ReceiveStockDto, userId: string): Promise<Result<StockItemResponseDto, AppError>>;
  adjustStock(id: string, dto: AdjustStockDto, userId: string): Promise<Result<StockItemResponseDto, AppError>>;
  bulkImportStockItems(rows: BulkImportStockItemRowDto[]): Promise<Result<BulkImportResponseDto, AppError>>;
}

/**
 * Create stock items service
 * Factory function that returns service implementation
 * Uses dependency injection for repository
 */
export const createStockItemService = (
  repository: StockItemRepository,
  stockMovementRepository: StockMovementRepository
): StockItemService => {
  /**
   * Create new stock item
   */
  const createStockItem = async (
    dto: CreateStockItemDto
  ): Promise<Result<StockItemResponseDto, AppError>> => {
    try {
      logger.info('Creating new stock item', { stockItemName: dto.name });

      const attributes = toStockItemCreationAttributes(dto);
      const stockItem = await repository.create(attributes);

      logger.info('Stock item created successfully', { stockItemId: stockItem.id });

      return ok(toStockItemResponseDto(stockItem));
    } catch (error) {
      logger.error('Failed to create stock item', { error, dto });
      return err(createDatabaseError('Failed to create stock item'));
    }
  };

  /**
   * Get stock item by ID
   */
  const getStockItemById = async (
    id: string
  ): Promise<Result<StockItemResponseDto, AppError>> => {
    try {
      logger.debug('Fetching stock item by ID', { stockItemId: id });

      const stockItem = await repository.findById(id);

      if (!stockItem) {
        logger.warn('Stock item not found', { stockItemId: id });
        return err(createNotFoundError('Stock item', id));
      }

      return ok(toStockItemResponseDto(stockItem));
    } catch (error) {
      logger.error('Failed to fetch stock item', { error, stockItemId: id });
      return err(createDatabaseError('Failed to fetch stock item'));
    }
  };

  /**
   * Get all stock items with filtering and pagination
   */
  const getAllStockItems = async (
    query: StockItemListQueryDto
  ): Promise<Result<StockItemListResponseDto, AppError>> => {
    try {
      logger.debug('Fetching stock items list', { query });

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

      const response: StockItemListResponseDto = {
        data: toStockItemResponseDtoList(result.rows),
        pagination: {
          page,
          limit,
          total: result.count,
          totalPages,
        },
      };

      logger.debug('Stock items list fetched successfully', {
        count: result.rows.length,
        total: result.count,
      });

      return ok(response);
    } catch (error) {
      logger.error('Failed to fetch stock items list', { error, query });
      return err(createDatabaseError('Failed to fetch stock items'));
    }
  };

  /**
   * Update stock item by ID
   */
  const updateStockItem = async (
    id: string,
    dto: UpdateStockItemDto
  ): Promise<Result<StockItemResponseDto, AppError>> => {
    try {
      logger.info('Updating stock item', { stockItemId: id, updates: dto });

      const attributes = toStockItemUpdateAttributes(dto);

      // Check if there are any attributes to update
      if (Object.keys(attributes).length === 0) {
        return err(createInvalidInputError('No valid fields provided for update'));
      }

      const stockItem = await repository.update(id, attributes);

      if (!stockItem) {
        logger.warn('Stock item not found for update', { stockItemId: id });
        return err(createNotFoundError('Stock item', id));
      }

      logger.info('Stock item updated successfully', { stockItemId: id });

      return ok(toStockItemResponseDto(stockItem));
    } catch (error) {
      logger.error('Failed to update stock item', { error, stockItemId: id, dto });
      return err(createDatabaseError('Failed to update stock item'));
    }
  };

  /**
   * Delete stock item by ID (soft delete)
   */
  const deleteStockItem = async (id: string): Promise<Result<void, AppError>> => {
    try {
      logger.info('Soft deleting stock item', { stockItemId: id, operation: 'soft_delete' });

      const deleted = await repository.delete(id);

      if (!deleted) {
        logger.warn('Stock item not found for deletion', { stockItemId: id });
        return err(createNotFoundError('Stock item', id));
      }

      logger.info('Stock item soft deleted successfully', {
        stockItemId: id,
        deletedAt: new Date(),
        metadata: { action: 'soft_delete', recoverable: true },
      });

      return ok(undefined);
    } catch (error) {
      logger.error('Failed to delete stock item', { error, stockItemId: id });
      return err(createDatabaseError('Failed to delete stock item'));
    }
  };

  /**
   * Restore soft-deleted stock item by ID
   */
  const restoreStockItem = async (
    id: string
  ): Promise<Result<StockItemResponseDto, AppError>> => {
    try {
      logger.info('Restoring soft-deleted stock item', { stockItemId: id, operation: 'restore' });

      const stockItem = await repository.restore(id);

      if (!stockItem) {
        logger.warn('Stock item not found or not deleted', { stockItemId: id });
        return err(createNotFoundError('Deleted stock item', id));
      }

      logger.info('Stock item restored successfully', {
        stockItemId: id,
        restoredAt: new Date(),
        metadata: { action: 'restore', previousState: 'deleted' },
      });

      return ok(toStockItemResponseDto(stockItem));
    } catch (error) {
      logger.error('Failed to restore stock item', { error, stockItemId: id });
      return err(createDatabaseError('Failed to restore stock item'));
    }
  };

  /**
   * Receive stock (add to inventory)
   */
  const receiveStock = async (
    id: string,
    dto: ReceiveStockDto,
    userId: string
  ): Promise<Result<StockItemResponseDto, AppError>> => {
    try {
      logger.info('Receiving stock', { stockItemId: id, quantity: dto.quantity });

      const stockItem = await repository.findById(id);

      if (!stockItem) {
        logger.warn('Stock item not found for receiving stock', { stockItemId: id });
        return err(createNotFoundError('Stock item', id));
      }

      const previousQuantity = Number(stockItem.currentQuantity);
      const newQuantity = previousQuantity + dto.quantity;
      const updatedStockItem = await repository.updateQuantity(id, newQuantity);

      if (!updatedStockItem) {
        return err(createDatabaseError('Failed to update stock quantity'));
      }

      // Create stock movement record
      await stockMovementRepository.create({
        stockItemId: id,
        type: MovementType.RECEIVED,
        quantity: dto.quantity,
        previousQuantity,
        newQuantity,
        reason: dto.reason || null,
        referenceType: null,
        referenceId: null,
        userId,
      });

      logger.info('Stock received successfully', {
        stockItemId: id,
        previousQuantity,
        receivedQuantity: dto.quantity,
        newQuantity,
      });

      return ok(toStockItemResponseDto(updatedStockItem));
    } catch (error) {
      logger.error('Failed to receive stock', { error, stockItemId: id, dto });
      return err(createDatabaseError('Failed to receive stock'));
    }
  };

  /**
   * Adjust stock (can be positive or negative)
   */
  const adjustStock = async (
    id: string,
    dto: AdjustStockDto,
    userId: string
  ): Promise<Result<StockItemResponseDto, AppError>> => {
    try {
      logger.info('Adjusting stock', { stockItemId: id, adjustment: dto.quantity });

      const stockItem = await repository.findById(id);

      if (!stockItem) {
        logger.warn('Stock item not found for adjusting stock', { stockItemId: id });
        return err(createNotFoundError('Stock item', id));
      }

      const previousQuantity = Number(stockItem.currentQuantity);
      const newQuantity = previousQuantity + dto.quantity;

      // Prevent negative stock
      if (newQuantity < 0) {
        logger.warn('Adjustment would result in negative stock', {
          stockItemId: id,
          currentQuantity: previousQuantity,
          adjustment: dto.quantity,
          wouldBe: newQuantity,
        });
        return err(createInvalidInputError('Adjustment would result in negative stock'));
      }

      const updatedStockItem = await repository.updateQuantity(id, newQuantity);

      if (!updatedStockItem) {
        return err(createDatabaseError('Failed to update stock quantity'));
      }

      // Create stock movement record
      await stockMovementRepository.create({
        stockItemId: id,
        type: MovementType.ADJUSTED,
        quantity: dto.quantity,
        previousQuantity,
        newQuantity,
        reason: dto.reason,
        referenceType: null,
        referenceId: null,
        userId,
      });

      logger.info('Stock adjusted successfully', {
        stockItemId: id,
        previousQuantity,
        adjustment: dto.quantity,
        newQuantity,
        reason: dto.reason,
      });

      return ok(toStockItemResponseDto(updatedStockItem));
    } catch (error) {
      logger.error('Failed to adjust stock', { error, stockItemId: id, dto });
      return err(createDatabaseError('Failed to adjust stock'));
    }
  };

  /**
   * Bulk import stock items from CSV data
   */
  const bulkImportStockItems = async (
    rows: BulkImportStockItemRowDto[]
  ): Promise<Result<BulkImportResponseDto, AppError>> => {
    logger.info('Starting bulk import of stock items', { totalRows: rows.length });

    const results: BulkImportRowResultDto[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      // Skip if row is undefined (shouldn't happen but TypeScript safety)
      if (!row) {
        results.push({
          row: rowNumber,
          name: '(undefined)',
          success: false,
          error: 'Invalid row data',
        });
        errorCount++;
        continue;
      }

      try {
        // Validate row data
        if (!row.name || row.name.trim() === '') {
          results.push({
            row: rowNumber,
            name: row.name || '(empty)',
            success: false,
            error: 'Name is required',
          });
          errorCount++;
          continue;
        }

        if (!row.unitOfMeasure || row.unitOfMeasure.trim() === '') {
          results.push({
            row: rowNumber,
            name: row.name,
            success: false,
            error: 'Unit of measure is required',
          });
          errorCount++;
          continue;
        }

        // Create stock item
        const attributes = toStockItemCreationAttributes({
          name: row.name.trim(),
          description: row.description?.trim(),
          unitOfMeasure: row.unitOfMeasure.trim(),
          currentQuantity: row.currentQuantity ?? 0,
          reorderThreshold: row.reorderThreshold,
        });

        const stockItem = await repository.create(attributes);

        results.push({
          row: rowNumber,
          name: row.name,
          success: true,
          id: stockItem.id,
        });
        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isDuplicateError = errorMessage.includes('unique') || errorMessage.includes('Duplicate');

        results.push({
          row: rowNumber,
          name: row.name || '(unknown)',
          success: false,
          error: isDuplicateError ? 'Stock item with this name already exists' : errorMessage,
        });
        errorCount++;
      }
    }

    logger.info('Bulk import completed', {
      totalRows: rows.length,
      successCount,
      errorCount,
    });

    return ok({
      totalRows: rows.length,
      successCount,
      errorCount,
      results,
    });
  };

  return {
    createStockItem,
    getStockItemById,
    getAllStockItems,
    updateStockItem,
    deleteStockItem,
    restoreStockItem,
    receiveStock,
    adjustStock,
    bulkImportStockItems,
  };
};
