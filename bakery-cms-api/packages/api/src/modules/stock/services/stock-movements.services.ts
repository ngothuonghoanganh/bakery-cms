/**
 * Stock movements services
 * Business logic layer for stock movements
 * Uses Result type for error handling
 */

import { Result, ok, err } from 'neverthrow';
import { AppError } from '@bakery-cms/common';
import { StockMovementRepository } from '../repositories/stock-movements.repositories';
import {
  StockMovementListQueryDto,
  StockMovementResponseDto,
  StockMovementListResponseDto,
} from '../dto/stock-movements.dto';
import {
  toStockMovementResponseDto,
  toStockMovementResponseDtoList,
} from '../mappers/stock-movements.mappers';
import {
  createNotFoundError,
  createDatabaseError,
  createInvalidInputError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Stock movements service interface
 * Defines all business operations for stock movements
 */
export interface StockMovementService {
  getStockMovementById(id: string): Promise<Result<StockMovementResponseDto, AppError>>;
  getAllStockMovements(query: StockMovementListQueryDto): Promise<Result<StockMovementListResponseDto, AppError>>;
}

/**
 * Create stock movements service
 * Factory function that returns service implementation
 * Uses dependency injection for repository
 */
export const createStockMovementService = (
  repository: StockMovementRepository
): StockMovementService => {
  /**
   * Get stock movement by ID
   */
  const getStockMovementById = async (
    id: string
  ): Promise<Result<StockMovementResponseDto, AppError>> => {
    try {
      logger.debug('Fetching stock movement by ID', { stockMovementId: id });

      const stockMovement = await repository.findById(id);

      if (!stockMovement) {
        logger.warn('Stock movement not found', { stockMovementId: id });
        return err(createNotFoundError('Stock movement', id));
      }

      return ok(toStockMovementResponseDto(stockMovement));
    } catch (error) {
      logger.error('Failed to fetch stock movement', { error, stockMovementId: id });
      return err(createDatabaseError('Failed to fetch stock movement', error));
    }
  };

  /**
   * Get all stock movements with filtering and pagination
   */
  const getAllStockMovements = async (
    query: StockMovementListQueryDto
  ): Promise<Result<StockMovementListResponseDto, AppError>> => {
    try {
      logger.debug('Fetching stock movements list', { query });

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

      const response: StockMovementListResponseDto = {
        data: toStockMovementResponseDtoList(result.rows),
        pagination: {
          page,
          limit,
          total: result.count,
          totalPages,
        },
      };

      logger.debug('Stock movements list fetched successfully', {
        count: result.rows.length,
        total: result.count,
      });

      return ok(response);
    } catch (error) {
      logger.error('Failed to fetch stock movements list', { error, query });
      return err(createDatabaseError('Failed to fetch stock movements', error));
    }
  };

  return {
    getStockMovementById,
    getAllStockMovements,
  };
};
