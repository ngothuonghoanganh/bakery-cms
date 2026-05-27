/**
 * Stock items services
 * Business logic layer for stock items
 * Uses Result type for error handling
 */

import { Result, ok, err } from 'neverthrow';
import { Op } from 'sequelize';
import type { Transaction } from 'sequelize';
import {
  AppError,
  CostingMethod,
  MovementType,
  StockUnitType,
} from '@bakery-cms/common';
import {
  BrandModel,
  StockItemBrandModel,
  StockItemModel,
  StockMovementModel,
  StockReceivingLotModel,
} from '@bakery-cms/database';
import { StockItemRepository } from '../repositories/stock-items.repositories';
import { StockMovementRepository } from '../repositories/stock-movements.repositories';
import {
  CreateStockItemDto,
  UpdateStockItemDto,
  StockItemListQueryDto,
  StockItemResponseDto,
  StockItemListResponseDto,
  ReceiveStockDto,
  ReceiveWithPricingResponseDto,
  AdjustStockDto,
  BulkImportStockItemRowDto,
  BulkImportResponseDto,
  BulkImportRowResultDto,
  StockItemPriceSummaryDto,
} from '../dto/stock-items.dto';
import type {
  ReceiveWithPricingDto,
  StockReceivingLotListQueryDto,
  StockReceivingLotListResponseDto,
  StockReceivingLotResponseDto,
} from '../dto/stock-receiving-lots.dto';
import {
  toStockItemResponseDto,
  toStockItemResponseDtoList,
  toStockItemCreationAttributes,
  toStockItemUpdateAttributes,
} from '../mappers/stock-items.mappers';
import { toStockItemBrandResponseDto } from '../mappers/brands.mappers';
import { toStockReceivingLotResponseDto } from '../mappers/stock-receiving-lots.mappers';
import {
  createNotFoundError,
  createConflictError,
  createDatabaseError,
  createInvalidInputError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';
import { unitConversionService } from './unit-conversion.services';
import { isCompatiblePurchaseUnit } from '../utils/brand-pricing.utils';

const logger = getLogger();

const inferUnitTypeFromLegacyValue = (
  unitValue: string | undefined
): StockUnitType => {
  const normalized = (unitValue || '').trim().toLowerCase();

  if (
    normalized === 'weight' ||
    normalized === 'gram' ||
    normalized === 'g' ||
    normalized === 'kg' ||
    normalized === 'kilogram'
  ) {
    return StockUnitType.WEIGHT;
  }

  if (
    normalized === 'volume' ||
    normalized === 'milliliter' ||
    normalized === 'ml' ||
    normalized === 'liter' ||
    normalized === 'l'
  ) {
    return StockUnitType.VOLUME;
  }

  return StockUnitType.PIECE;
};

const createDuplicateStockItemNameError = (name: string): AppError =>
  createConflictError('Stock item with this name already exists', [
    {
      field: 'name',
      message: 'name must be unique',
      value: name,
    },
  ]);

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
  receiveWithPricing(id: string, dto: ReceiveWithPricingDto, userId: string): Promise<Result<ReceiveWithPricingResponseDto, AppError>>;
  getReceivingLots(id: string, query: StockReceivingLotListQueryDto): Promise<Result<StockReceivingLotListResponseDto, AppError>>;
  adjustStock(id: string, dto: AdjustStockDto, userId: string): Promise<Result<StockItemResponseDto, AppError>>;
  bulkImportStockItems(rows: BulkImportStockItemRowDto[]): Promise<Result<BulkImportResponseDto, AppError>>;
}

export type StockItemServiceDependencies = {
  readonly stockItemRepository: StockItemRepository;
  readonly stockMovementRepository: StockMovementRepository;
  readonly stockItemModel: typeof StockItemModel;
  readonly brandModel: typeof BrandModel;
  readonly stockItemBrandModel: typeof StockItemBrandModel;
  readonly stockReceivingLotModel: typeof StockReceivingLotModel;
  readonly stockMovementModel: typeof StockMovementModel;
};

/**
 * Create stock items service
 * Factory function that returns service implementation
 * Uses dependency injection for repository
 */
export const createStockItemService = (
  deps: StockItemServiceDependencies
): StockItemService => {
  const {
    stockItemRepository: repository,
    stockMovementRepository,
    stockItemModel,
    brandModel,
    stockItemBrandModel,
    stockReceivingLotModel,
    stockMovementModel,
  } = deps;

  const toQuantity = (value: number): number => Math.round(value * 1000) / 1000;
  const toMoney = (value: number): number => Math.round(value * 100) / 100;
  const toUnitCost = (value: number): number => Math.round(value * 10000) / 10000;

  const toISODateOrNow = (value: string | undefined): Date => {
    if (!value) {
      return new Date();
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }
    return parsed;
  };

  const buildPriceSummary = (args: {
    preferredBrand?: { brandId: string; brandName: string; unitPriceBeforeTax: number; unitPriceAfterTax: number } | null;
    latestReceivingLot?: { brandId: string; brandName: string; unitPriceBeforeTax: number; unitPriceAfterTax: number; receivedAt: Date } | null;
    latestBrandPrice?: { brandId: string; brandName: string; unitPriceBeforeTax: number; unitPriceAfterTax: number } | null;
  }): StockItemPriceSummaryDto => {
    const preferredBrand = args.preferredBrand ?? null;
    const latestReceivingLot = args.latestReceivingLot ?? null;
    const latestBrandPrice = args.latestBrandPrice ?? null;

    const currentSource =
      latestReceivingLot ?? preferredBrand ?? latestBrandPrice;

    const hasPrice = Boolean(
      currentSource &&
        Number.isFinite(currentSource.unitPriceAfterTax) &&
        currentSource.unitPriceAfterTax >= 0
    );

    return {
      preferredBrandId: preferredBrand?.brandId ?? null,
      preferredBrandName: preferredBrand?.brandName ?? null,
      latestPriceBrandId: currentSource?.brandId ?? null,
      latestPriceBrandName: currentSource?.brandName ?? null,
      latestUnitPriceBeforeTax:
        currentSource && Number.isFinite(currentSource.unitPriceBeforeTax)
          ? Number(currentSource.unitPriceBeforeTax)
          : null,
      latestUnitPriceAfterTax:
        currentSource && Number.isFinite(currentSource.unitPriceAfterTax)
          ? Number(currentSource.unitPriceAfterTax)
          : null,
      latestReceivedAt: latestReceivingLot?.receivedAt
        ? latestReceivingLot.receivedAt.toISOString()
        : null,
      hasPrice,
    };
  };

  const loadLatestReceivingLotsByStockItemId = async (
    stockItemIds: string[]
  ): Promise<Map<string, StockReceivingLotResponseDto>> => {
    if (stockItemIds.length === 0) {
      return new Map();
    }

    const sequelize = stockReceivingLotModel.sequelize;
    if (!sequelize) {
      throw createDatabaseError('Database connection is not available');
    }

    const latestPairs = (await stockReceivingLotModel.findAll({
      attributes: [
        'stockItemId',
        [sequelize.fn('MAX', sequelize.col('received_at')), 'maxReceivedAt'],
      ],
      where: {
        stockItemId: {
          [Op.in]: stockItemIds,
        },
      },
      group: ['stock_item_id'],
      raw: true,
    })) as unknown as Array<{ stockItemId: string; maxReceivedAt: string }>;

    if (latestPairs.length === 0) {
      return new Map();
    }

    const lots = await stockReceivingLotModel.findAll({
      where: {
        [Op.or]: latestPairs.map((pair) => ({
          stockItemId: pair.stockItemId,
          receivedAt: new Date(pair.maxReceivedAt),
        })),
      },
      include: [
        { model: brandModel, as: 'brand', attributes: ['id', 'name'] },
        { model: stockItemModel, as: 'stockItem', attributes: ['id', 'name'] },
      ],
      order: [['receivedAt', 'DESC']],
    });

    const map = new Map<string, StockReceivingLotResponseDto>();
    for (const lot of lots as Array<
      StockReceivingLotModel & { brand?: BrandModel; stockItem?: StockItemModel }
    >) {
      const stockItemName = lot.stockItem?.name ?? '';
      const brandName = lot.brand?.name ?? '';
      if (!map.has(lot.stockItemId)) {
        map.set(
          lot.stockItemId,
          toStockReceivingLotResponseDto(lot, { stockItemName, brandName })
        );
      }
    }
    return map;
  };

  const loadBrandPricingLinksByStockItemId = async (
    stockItemIds: string[]
  ): Promise<{
    preferred: Map<string, { brandId: string; brandName: string; unitPriceBeforeTax: number; unitPriceAfterTax: number }>;
    latest: Map<string, { brandId: string; brandName: string; unitPriceBeforeTax: number; unitPriceAfterTax: number }>;
  }> => {
    const preferred = new Map<string, { brandId: string; brandName: string; unitPriceBeforeTax: number; unitPriceAfterTax: number }>();
    const latest = new Map<string, { brandId: string; brandName: string; unitPriceBeforeTax: number; unitPriceAfterTax: number }>();

    if (stockItemIds.length === 0) {
      return { preferred, latest };
    }

    const links = (await stockItemBrandModel.findAll({
      where: {
        stockItemId: {
          [Op.in]: stockItemIds,
        },
      },
      include: [{ model: brandModel, as: 'brand', attributes: ['id', 'name'] }],
      order: [['updatedAt', 'DESC']],
    })) as Array<StockItemBrandModel & { brand?: BrandModel }>;

    for (const link of links) {
      const brandName = link.brand?.name ?? '';
      const itemId = link.stockItemId;

      if (!latest.has(itemId)) {
        latest.set(itemId, {
          brandId: link.brandId,
          brandName,
          unitPriceBeforeTax: Number(link.unitPriceBeforeTax),
          unitPriceAfterTax: Number(link.unitPriceAfterTax),
        });
      }

      if (link.isPreferred && !preferred.has(itemId)) {
        preferred.set(itemId, {
          brandId: link.brandId,
          brandName,
          unitPriceBeforeTax: Number(link.unitPriceBeforeTax),
          unitPriceAfterTax: Number(link.unitPriceAfterTax),
        });
      }
    }

    return { preferred, latest };
  };

  /**
   * Create new stock item
   */
  const createStockItem = async (
    dto: CreateStockItemDto
  ): Promise<Result<StockItemResponseDto, AppError>> => {
    try {
      logger.info('Creating new stock item', { stockItemName: dto.name });

      const existingStockItem = await repository.findByName(dto.name);
      if (existingStockItem) {
        logger.warn('Stock item name already exists', { stockItemName: dto.name });
        return err(createDuplicateStockItemNameError(dto.name));
      }

      const attributes = toStockItemCreationAttributes(dto);
      const stockItem = await repository.create(attributes);

      logger.info('Stock item created successfully', { stockItemId: stockItem.id });

      return ok(toStockItemResponseDto(stockItem));
    } catch (error) {
      logger.error('Failed to create stock item', { error, dto });
      return err(createDatabaseError('Failed to create stock item', error));
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

      const dto = toStockItemResponseDto(stockItem);

      const latestLotMap = await loadLatestReceivingLotsByStockItemId([id]);
      const latestLot = latestLotMap.get(id) ?? null;

      const brandLinks = await loadBrandPricingLinksByStockItemId([id]);
      const preferred = brandLinks.preferred.get(id) ?? null;
      const latestBrand = brandLinks.latest.get(id) ?? null;

      dto.latestReceivingLot = latestLot;
      dto.priceSummary = buildPriceSummary({
        preferredBrand: preferred,
        latestReceivingLot: latestLot
          ? {
              brandId: latestLot.brandId,
              brandName: latestLot.brandName,
              unitPriceBeforeTax: latestLot.unitPriceBeforeTax,
              unitPriceAfterTax: latestLot.unitPriceAfterTax,
              receivedAt: new Date(latestLot.receivedAt),
            }
          : null,
        latestBrandPrice: latestBrand,
      });

      return ok(dto);
    } catch (error) {
      logger.error('Failed to fetch stock item', { error, stockItemId: id });
      return err(createDatabaseError('Failed to fetch stock item', error));
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
      const ids = result.rows.map((row) => row.id);

      const latestLotMap = await loadLatestReceivingLotsByStockItemId(ids);
      const brandLinks = await loadBrandPricingLinksByStockItemId(ids);

      const totalPages = Math.ceil(result.count / limit);

      const response: StockItemListResponseDto = {
        data: toStockItemResponseDtoList(result.rows).map((item) => {
          const latestLot = latestLotMap.get(item.id) ?? null;
          const preferred = brandLinks.preferred.get(item.id) ?? null;
          const latestBrand = brandLinks.latest.get(item.id) ?? null;

          return {
            ...item,
            priceSummary: buildPriceSummary({
              preferredBrand: preferred,
              latestReceivingLot: latestLot
                ? {
                    brandId: latestLot.brandId,
                    brandName: latestLot.brandName,
                    unitPriceBeforeTax: latestLot.unitPriceBeforeTax,
                    unitPriceAfterTax: latestLot.unitPriceAfterTax,
                    receivedAt: new Date(latestLot.receivedAt),
                  }
                : null,
              latestBrandPrice: latestBrand,
            }),
          };
        }),
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
      return err(createDatabaseError('Failed to fetch stock items', error));
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

      if (dto.name !== undefined) {
        const existingStockItem = await repository.findByName(dto.name);
        if (existingStockItem && existingStockItem.id !== id) {
          logger.warn('Stock item name already exists for update', {
            stockItemId: id,
            stockItemName: dto.name,
          });
          return err(createDuplicateStockItemNameError(dto.name));
        }
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
      return err(createDatabaseError('Failed to update stock item', error));
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
      return err(createDatabaseError('Failed to delete stock item', error));
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

      const deletedStockItem = await repository.findByIdIncludingDeleted(id);

      if (!deletedStockItem || !deletedStockItem.deletedAt) {
        logger.warn('Stock item not found or not deleted', { stockItemId: id });
        return err(createNotFoundError('Deleted stock item', id));
      }

      const existingStockItem = await repository.findByName(deletedStockItem.name);
      if (existingStockItem && existingStockItem.id !== id) {
        logger.warn('Cannot restore stock item due to duplicate active name', {
          stockItemId: id,
          stockItemName: deletedStockItem.name,
          conflictingStockItemId: existingStockItem.id,
        });
        return err(createDuplicateStockItemNameError(deletedStockItem.name));
      }

      const stockItem = await repository.restore(id);

      if (!stockItem) {
        logger.warn('Stock item not found or not deleted during restore', { stockItemId: id });
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
      return err(createDatabaseError('Failed to restore stock item', error));
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
      return err(createDatabaseError('Failed to receive stock', error));
    }
  };

  /**
   * Receive stock with lot-level pricing snapshot
   */
  const receiveWithPricing = async (
    id: string,
    dto: ReceiveWithPricingDto,
    userId: string
  ): Promise<Result<ReceiveWithPricingResponseDto, AppError>> => {
    try {
      if (!dto.brandId) {
        return err(
          createInvalidInputError('brandId is required', [
            { field: 'brandId', message: 'brandId is required' },
          ])
        );
      }

      if (!Number.isFinite(dto.receivedQuantity) || dto.receivedQuantity <= 0) {
        return err(
          createInvalidInputError('receivedQuantity must be greater than 0', [
            { field: 'receivedQuantity', message: 'receivedQuantity must be greater than 0' },
          ])
        );
      }

      if (!Number.isFinite(dto.priceBeforeTax) || dto.priceBeforeTax < 0) {
        return err(
          createInvalidInputError('priceBeforeTax must be at least 0', [
            { field: 'priceBeforeTax', message: 'priceBeforeTax must be at least 0' },
          ])
        );
      }

      if (!Number.isFinite(dto.priceAfterTax) || dto.priceAfterTax < 0) {
        return err(
          createInvalidInputError('priceAfterTax must be at least 0', [
            { field: 'priceAfterTax', message: 'priceAfterTax must be at least 0' },
          ])
        );
      }

      if (dto.priceAfterTax < dto.priceBeforeTax) {
        return err(
          createInvalidInputError('priceAfterTax must be >= priceBeforeTax', [
            { field: 'priceAfterTax', message: 'priceAfterTax must be >= priceBeforeTax' },
          ])
        );
      }

      const sequelize = stockReceivingLotModel.sequelize;
      if (!sequelize) {
        return err(
          createDatabaseError('Database connection is not available for receiving with pricing')
        );
      }

      const result = await sequelize.transaction(async (transaction: Transaction) => {
        const stockItem = await stockItemModel.findByPk(id, { transaction });
        if (!stockItem) {
          throw createNotFoundError('Stock item', id);
        }

        const brand = await brandModel.findByPk(dto.brandId, { transaction });
        if (!brand) {
          throw createNotFoundError('Brand', dto.brandId);
        }

        const unitType = (stockItem.unitType as StockUnitType) ?? StockUnitType.PIECE;
        if (!isCompatiblePurchaseUnit(unitType, dto.receivedUnit)) {
          throw createInvalidInputError(
            `Received unit "${dto.receivedUnit}" is not compatible with stock unit type "${unitType}"`,
            [{ field: 'receivedUnit', message: 'receivedUnit is incompatible', value: dto.receivedUnit }]
          );
        }

        const baseUnit = unitConversionService.resolveStockBaseUnit(unitType);
        const baseQuantityResult = unitConversionService.toStockBaseQuantity(
          unitType,
          dto.receivedQuantity,
          dto.receivedUnit
        );
        if (baseQuantityResult.isErr()) {
          throw baseQuantityResult.error;
        }

        const receivedQuantityBase = toQuantity(baseQuantityResult.value);
        if (!Number.isFinite(receivedQuantityBase) || receivedQuantityBase <= 0) {
          throw createInvalidInputError('receivedQuantityBase must be greater than 0');
        }

        const unitPriceBeforeTax = toUnitCost(dto.priceBeforeTax / receivedQuantityBase);
        const unitPriceAfterTax = toUnitCost(dto.priceAfterTax / receivedQuantityBase);

        const previousQuantity = Number(stockItem.currentQuantity);
        const newQuantity = toQuantity(previousQuantity + receivedQuantityBase);

        const receivedAt = toISODateOrNow(dto.receivedAt);

        const receivingLot = await stockReceivingLotModel.create(
          {
            stockItemId: id,
            brandId: dto.brandId,
            receivedQuantity: toQuantity(dto.receivedQuantity),
            receivedUnit: dto.receivedUnit,
            receivedQuantityBase,
            baseUnit,
            priceBeforeTax: toMoney(dto.priceBeforeTax),
            priceAfterTax: toMoney(dto.priceAfterTax),
            unitPriceBeforeTax,
            unitPriceAfterTax,
            remainingQuantityBase: receivedQuantityBase,
            receivedAt,
            supplierName: dto.supplierName?.trim() ? dto.supplierName.trim() : null,
            invoiceCode: dto.invoiceCode?.trim() ? dto.invoiceCode.trim() : null,
            note: dto.note?.trim() ? dto.note.trim() : null,
            createdByUserId: userId,
          },
          { transaction }
        );

        await stockItem.update({ currentQuantity: newQuantity }, { transaction });

        await stockMovementModel.create(
          {
            stockItemId: id,
            brandId: dto.brandId,
            type: MovementType.RECEIVED,
            quantity: receivedQuantityBase,
            previousQuantity,
            newQuantity,
            reason: dto.note?.trim() ? dto.note.trim() : null,
            referenceType: 'stock_receiving_lot',
            referenceId: receivingLot.id,
            unitCostSnapshot: unitPriceAfterTax,
            totalCostSnapshot: toMoney(dto.priceAfterTax),
            costingMethod: CostingMethod.RECEIVING_LOT_PRICE,
            userId,
          },
          { transaction }
        );

        const existingPreferredCount = await stockItemBrandModel.count({
          where: { stockItemId: id, isPreferred: true },
          transaction,
        });

        const existingLink = await stockItemBrandModel.findOne({
          where: { stockItemId: id, brandId: dto.brandId },
          transaction,
        });

        let updatedLink: StockItemBrandModel;
        if (existingLink) {
          await existingLink.update(
            {
              purchaseQuantity: toQuantity(dto.receivedQuantity),
              purchaseUnit: dto.receivedUnit,
              priceBeforeTax: toMoney(dto.priceBeforeTax),
              priceAfterTax: toMoney(dto.priceAfterTax),
              unitPriceBeforeTax: toMoney(unitPriceBeforeTax),
              unitPriceAfterTax: toMoney(unitPriceAfterTax),
            },
            { transaction }
          );
          updatedLink = existingLink;
        } else {
          updatedLink = await stockItemBrandModel.create(
            {
              stockItemId: id,
              brandId: dto.brandId,
              purchaseQuantity: toQuantity(dto.receivedQuantity),
              purchaseUnit: dto.receivedUnit,
              priceBeforeTax: toMoney(dto.priceBeforeTax),
              priceAfterTax: toMoney(dto.priceAfterTax),
              unitPriceBeforeTax: toMoney(unitPriceBeforeTax),
              unitPriceAfterTax: toMoney(unitPriceAfterTax),
              isPreferred: existingPreferredCount === 0,
            },
            { transaction }
          );
        }

        const stockItemDto = toStockItemResponseDto(stockItem);
        stockItemDto.currentQuantity = newQuantity;

        const lotDto = toStockReceivingLotResponseDto(receivingLot, {
          stockItemName: stockItem.name,
          brandName: brand.name,
        });

        const updatedBrandPriceDto = toStockItemBrandResponseDto(
          updatedLink,
          brand.name
        );

        return {
          stockItem: stockItemDto,
          receivingLot: lotDto,
          updatedBrandPrice: updatedBrandPriceDto,
        };
      });

      return ok(result);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in (error as any) && 'statusCode' in (error as any)) {
        return err(error as AppError);
      }
      logger.error('Failed to receive stock with pricing', { error, stockItemId: id, dto });
      return err(createDatabaseError('Failed to receive stock with pricing', error));
    }
  };

  const getReceivingLots = async (
    id: string,
    query: StockReceivingLotListQueryDto
  ): Promise<Result<StockReceivingLotListResponseDto, AppError>> => {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;

      if (page < 1) {
        return err(createInvalidInputError('Page must be at least 1'));
      }
      if (limit < 1 || limit > 100) {
        return err(createInvalidInputError('Limit must be between 1 and 100'));
      }

      const stockItem = await stockItemModel.findByPk(id);
      if (!stockItem) {
        return err(createNotFoundError('Stock item', id));
      }

      const where: Record<string, unknown> = { stockItemId: id };
      if (query.brandId) {
        where['brandId'] = query.brandId;
      }
      if (query.dateFrom || query.dateTo) {
        const receivedAtFilter: any = {};
        if (query.dateFrom) {
          receivedAtFilter[Op.gte] = new Date(query.dateFrom);
        }
        if (query.dateTo) {
          receivedAtFilter[Op.lte] = new Date(query.dateTo);
        }
        where['receivedAt'] = receivedAtFilter;
      }

      const offset = (page - 1) * limit;
      const result = await stockReceivingLotModel.findAndCountAll({
        where,
        limit,
        offset,
        order: [['receivedAt', 'DESC'], ['createdAt', 'DESC']],
        include: [{ model: brandModel, as: 'brand', attributes: ['id', 'name'] }],
      });

      const lots = (result.rows as Array<StockReceivingLotModel & { brand?: BrandModel }>).map((lot) =>
        toStockReceivingLotResponseDto(lot, {
          stockItemName: stockItem.name,
          brandName: lot.brand?.name ?? '',
        })
      );

      return ok({
        lots,
        total: result.count,
        page,
        limit,
      });
    } catch (error) {
      logger.error('Failed to fetch receiving lots', { error, stockItemId: id, query });
      return err(createDatabaseError('Failed to fetch receiving lots', error));
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
      return err(createDatabaseError('Failed to adjust stock', error));
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

        const unitType = row.unitType ?? inferUnitTypeFromLegacyValue(row.unitOfMeasure);

        if (!unitType) {
          results.push({
            row: rowNumber,
            name: row.name,
            success: false,
            error: 'Unit type is required',
          });
          errorCount++;
          continue;
        }

        // Create stock item
        const normalizedName = row.name.trim();
        const existingStockItem = await repository.findByName(normalizedName);
        if (existingStockItem) {
          results.push({
            row: rowNumber,
            name: row.name,
            success: false,
            error: 'Stock item with this name already exists',
          });
          errorCount++;
          continue;
        }

        const attributes = toStockItemCreationAttributes({
          name: normalizedName,
          description: row.description?.trim(),
          unitType,
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
    receiveWithPricing,
    getReceivingLots,
    adjustStock,
    bulkImportStockItems,
  };
};
