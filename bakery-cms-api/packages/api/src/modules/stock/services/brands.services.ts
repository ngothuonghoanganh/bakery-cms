/**
 * Brands services
 * Business logic layer for brands
 * Uses Result type for error handling
 */

import { Result, ok, err } from 'neverthrow';
import {
  AppError,
  StockPurchaseUnit,
  StockUnitType,
} from '@bakery-cms/common';
import { BrandRepository } from '../repositories/brands.repositories';
import { StockItemBrandRepository } from '../repositories/stock-item-brands.repositories';
import { StockItemRepository } from '../repositories/stock-items.repositories';
import type { FileService } from '../../files/services/files.services';
import {
  CreateBrandDto,
  UpdateBrandDto,
  BrandListQueryDto,
  BrandResponseDto,
  BrandListResponseDto,
} from '../dto/brands.dto';
import {
  AddBrandToStockItemDto,
  UpdateStockItemBrandDto,
  StockItemBrandResponseDto,
} from '../dto/stock-items.dto';
import {
  toBrandResponseDto,
  toBrandResponseDtoList,
  toBrandCreationAttributes,
  toBrandUpdateAttributes,
  toStockItemBrandResponseDto,
  toStockItemBrandCreationAttributes,
  toStockItemBrandUpdateAttributes,
} from '../mappers/brands.mappers';
import {
  createNotFoundError,
  createDatabaseError,
  createInvalidInputError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';
import {
  isCompatiblePurchaseUnit,
  toStockBaseQuantity,
} from '../utils/brand-pricing.utils';

const logger = getLogger();

/**
 * Brands service interface
 * Defines all business operations for brands
 */
export interface BrandService {
  createBrand(dto: CreateBrandDto): Promise<Result<BrandResponseDto, AppError>>;
  getBrandById(id: string): Promise<Result<BrandResponseDto, AppError>>;
  getAllBrands(query: BrandListQueryDto): Promise<Result<BrandListResponseDto, AppError>>;
  updateBrand(id: string, dto: UpdateBrandDto): Promise<Result<BrandResponseDto, AppError>>;
  deleteBrand(id: string): Promise<Result<void, AppError>>;
  restoreBrand(id: string): Promise<Result<BrandResponseDto, AppError>>;
  addBrandToStockItem(stockItemId: string, dto: AddBrandToStockItemDto): Promise<Result<StockItemBrandResponseDto, AppError>>;
  getStockItemBrands(stockItemId: string): Promise<Result<StockItemBrandResponseDto[], AppError>>;
  updateStockItemBrand(stockItemId: string, brandId: string, dto: UpdateStockItemBrandDto): Promise<Result<StockItemBrandResponseDto, AppError>>;
  removeBrandFromStockItem(stockItemId: string, brandId: string): Promise<Result<void, AppError>>;
  setPreferredBrand(stockItemId: string, brandId: string): Promise<Result<void, AppError>>;
}

/**
 * Brand service dependencies
 */
export type BrandServiceDependencies = {
  readonly brandRepository: BrandRepository;
  readonly stockItemBrandRepository: StockItemBrandRepository;
  readonly stockItemRepository: StockItemRepository;
  readonly fileService?: FileService;
};

/**
 * Create brands service
 * Factory function that returns service implementation
 * Uses dependency injection for repositories and optional file service
 */
export const createBrandService = (
  deps: BrandServiceDependencies
): BrandService => {
  const { brandRepository, stockItemBrandRepository, stockItemRepository, fileService } = deps;

  const toMoney = (value: number): number =>
    Math.round(value * 100) / 100;

  const toBaseQuantity = (
    stockUnitType: StockUnitType,
    purchaseQuantity: number,
    purchaseUnit: StockPurchaseUnit
  ): Result<number, AppError> => {
    if (purchaseQuantity <= 0) {
      return err(createInvalidInputError('Purchase quantity must be greater than 0'));
    }

    if (!isCompatiblePurchaseUnit(stockUnitType, purchaseUnit)) {
      return err(
        createInvalidInputError(
          `Purchase unit "${purchaseUnit}" is not compatible with stock unit type "${stockUnitType}"`
        )
      );
    }

    return ok(
      toStockBaseQuantity(stockUnitType, purchaseQuantity, purchaseUnit)
    );
  };
  /**
   * Create new brand
   */
  const createBrand = async (
    dto: CreateBrandDto
  ): Promise<Result<BrandResponseDto, AppError>> => {
    try {
      logger.info('Creating new brand', { brandName: dto.name });

      const attributes = toBrandCreationAttributes(dto);
      const brand = await brandRepository.create(attributes);

      logger.info('Brand created successfully', { brandId: brand.id });

      return ok(toBrandResponseDto(brand));
    } catch (error) {
      logger.error('Failed to create brand', { error, dto });
      return err(createDatabaseError('Failed to create brand', error));
    }
  };

  /**
   * Get brand by ID
   */
  const getBrandById = async (
    id: string
  ): Promise<Result<BrandResponseDto, AppError>> => {
    try {
      logger.debug('Fetching brand by ID', { brandId: id });

      const brand = await brandRepository.findById(id);

      if (!brand) {
        logger.warn('Brand not found', { brandId: id });
        return err(createNotFoundError('Brand', id));
      }

      return ok(toBrandResponseDto(brand));
    } catch (error) {
      logger.error('Failed to fetch brand', { error, brandId: id });
      return err(createDatabaseError('Failed to fetch brand', error));
    }
  };

  /**
   * Get all brands with filtering and pagination
   */
  const getAllBrands = async (
    query: BrandListQueryDto
  ): Promise<Result<BrandListResponseDto, AppError>> => {
    try {
      logger.debug('Fetching all brands', { query });

      const { rows, count } = await brandRepository.findAll(query);

      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const totalPages = Math.ceil(count / limit);

      const response: BrandListResponseDto = {
        data: toBrandResponseDtoList(rows),
        pagination: {
          page,
          limit,
          total: count,
          totalPages,
        },
      };

      return ok(response);
    } catch (error) {
      logger.error('Failed to fetch brands', { error, query });
      return err(createDatabaseError('Failed to fetch brands', error));
    }
  };

  /**
   * Update brand by ID
   */
  const updateBrand = async (
    id: string,
    dto: UpdateBrandDto
  ): Promise<Result<BrandResponseDto, AppError>> => {
    try {
      logger.info('Updating brand', { brandId: id, updates: dto });

      const attributes = toBrandUpdateAttributes(dto);
      const brand = await brandRepository.update(id, attributes);

      if (!brand) {
        logger.warn('Brand not found for update', { brandId: id });
        return err(createNotFoundError('Brand', id));
      }

      logger.info('Brand updated successfully', { brandId: id });

      return ok(toBrandResponseDto(brand));
    } catch (error) {
      logger.error('Failed to update brand', { error, brandId: id, dto });
      return err(createDatabaseError('Failed to update brand', error));
    }
  };

  /**
   * Delete brand by ID (soft delete)
   * Also cleans up associated image file if present
   */
  const deleteBrand = async (
    id: string
  ): Promise<Result<void, AppError>> => {
    try {
      logger.info('Deleting brand', { brandId: id });

      // Get brand first to check for associated file
      const brand = await brandRepository.findById(id);

      if (!brand) {
        logger.warn('Brand not found for deletion', { brandId: id });
        return err(createNotFoundError('Brand', id));
      }

      // Delete associated image file if exists
      if (brand.imageFileId && fileService) {
        logger.info('Cleaning up brand image file', {
          brandId: id,
          imageFileId: brand.imageFileId
        });
        const deleteFileResult = await fileService.deleteFile(brand.imageFileId);
        if (deleteFileResult.isErr()) {
          // Log but don't fail the brand deletion
          logger.warn('Failed to delete associated image file', {
            brandId: id,
            imageFileId: brand.imageFileId,
            error: deleteFileResult.error,
          });
        }
      }

      const deleted = await brandRepository.delete(id);

      if (!deleted) {
        logger.warn('Brand not found for deletion', { brandId: id });
        return err(createNotFoundError('Brand', id));
      }

      logger.info('Brand deleted successfully', { brandId: id });

      return ok(undefined);
    } catch (error) {
      logger.error('Failed to delete brand', { error, brandId: id });
      return err(createDatabaseError('Failed to delete brand', error));
    }
  };

  /**
   * Restore soft-deleted brand by ID
   */
  const restoreBrand = async (
    id: string
  ): Promise<Result<BrandResponseDto, AppError>> => {
    try {
      logger.info('Restoring brand', { brandId: id });

      const brand = await brandRepository.restore(id);

      if (!brand) {
        logger.warn('Brand not found for restoration', { brandId: id });
        return err(createNotFoundError('Brand', id));
      }

      logger.info('Brand restored successfully', { brandId: id });

      return ok(toBrandResponseDto(brand));
    } catch (error) {
      logger.error('Failed to restore brand', { error, brandId: id });
      return err(createDatabaseError('Failed to restore brand', error));
    }
  };

  /**
   * Add brand to stock item with pricing
   */
  const addBrandToStockItem = async (
    stockItemId: string,
    dto: AddBrandToStockItemDto
  ): Promise<Result<StockItemBrandResponseDto, AppError>> => {
    try {
      logger.info('Adding brand to stock item', { stockItemId, brandId: dto.brandId });

      // Check if brand exists
      const brand = await brandRepository.findById(dto.brandId);
      if (!brand) {
        logger.warn('Brand not found when adding to stock item', { brandId: dto.brandId });
        return err(createNotFoundError('Brand', dto.brandId));
      }

      const stockItem = await stockItemRepository.findById(stockItemId);
      if (!stockItem) {
        logger.warn('Stock item not found when adding brand', { stockItemId });
        return err(createNotFoundError('Stock item', stockItemId));
      }

      // Check if association already exists
      const existing = await stockItemBrandRepository.findByStockItemAndBrand(
        stockItemId,
        dto.brandId
      );

      if (existing) {
        logger.warn('Brand already associated with stock item', { stockItemId, brandId: dto.brandId });
        return err(createInvalidInputError('Brand is already associated with this stock item'));
      }

      // Create association
      const attributes = toStockItemBrandCreationAttributes(stockItemId, dto);
      const baseQuantityResult = toBaseQuantity(
        (stockItem.unitType as StockUnitType) ?? StockUnitType.PIECE,
        dto.purchaseQuantity,
        dto.purchaseUnit
      );

      if (baseQuantityResult.isErr()) {
        return err(baseQuantityResult.error);
      }

      const baseQuantity = baseQuantityResult.value;
      attributes.unitPriceBeforeTax = toMoney(dto.priceBeforeTax / baseQuantity);
      attributes.unitPriceAfterTax = toMoney(dto.priceAfterTax / baseQuantity);
      const stockItemBrand = await stockItemBrandRepository.create(attributes);

      logger.info('Brand added to stock item successfully', {
        stockItemId,
        brandId: dto.brandId,
        associationId: stockItemBrand.id
      });

      return ok(toStockItemBrandResponseDto(stockItemBrand, brand.name));
    } catch (error) {
      logger.error('Failed to add brand to stock item', { error, stockItemId, dto });
      return err(createDatabaseError('Failed to add brand to stock item', error));
    }
  };

  /**
   * Get all brands associated with a stock item
   */
  const getStockItemBrands = async (
    stockItemId: string
  ): Promise<Result<StockItemBrandResponseDto[], AppError>> => {
    try {
      logger.debug('Fetching brands for stock item', { stockItemId });

      const stockItemBrands = await stockItemBrandRepository.findByStockItemId(stockItemId);

      const response = stockItemBrands.map((sib) => {
        const brandName = (sib as any).brand?.name ?? 'Unknown Brand';
        return toStockItemBrandResponseDto(sib, brandName);
      });

      return ok(response);
    } catch (error) {
      logger.error('Failed to fetch stock item brands', { error, stockItemId });
      return err(createDatabaseError('Failed to fetch stock item brands', error));
    }
  };

  /**
   * Update stock item brand pricing
   */
  const updateStockItemBrand = async (
    stockItemId: string,
    brandId: string,
    dto: UpdateStockItemBrandDto
  ): Promise<Result<StockItemBrandResponseDto, AppError>> => {
    try {
      logger.info('Updating stock item brand', { stockItemId, brandId, updates: dto });

      const existing = await stockItemBrandRepository.findByStockItemAndBrand(
        stockItemId,
        brandId
      );
      if (!existing) {
        logger.warn('Stock item brand association not found', { stockItemId, brandId });
        return err(createNotFoundError('Stock item brand association', `${stockItemId}:${brandId}`));
      }

      const stockItem = await stockItemRepository.findById(stockItemId);
      if (!stockItem) {
        logger.warn('Stock item not found when updating stock item brand', { stockItemId });
        return err(createNotFoundError('Stock item', stockItemId));
      }

      const nextPurchaseQuantity = dto.purchaseQuantity ?? Number(existing.purchaseQuantity);
      const nextPurchaseUnit =
        dto.purchaseUnit ??
        ((existing.purchaseUnit as StockPurchaseUnit) ?? StockPurchaseUnit.PIECE);
      const nextPriceBeforeTax = dto.priceBeforeTax ?? Number(existing.priceBeforeTax);
      const nextPriceAfterTax = dto.priceAfterTax ?? Number(existing.priceAfterTax);

      const baseQuantityResult = toBaseQuantity(
        (stockItem.unitType as StockUnitType) ?? StockUnitType.PIECE,
        nextPurchaseQuantity,
        nextPurchaseUnit
      );
      if (baseQuantityResult.isErr()) {
        return err(baseQuantityResult.error);
      }

      const attributes = toStockItemBrandUpdateAttributes(dto);
      const baseQuantity = baseQuantityResult.value;
      attributes.unitPriceBeforeTax = toMoney(nextPriceBeforeTax / baseQuantity);
      attributes.unitPriceAfterTax = toMoney(nextPriceAfterTax / baseQuantity);

      const stockItemBrand = await stockItemBrandRepository.update(
        stockItemId,
        brandId,
        attributes
      );

      if (!stockItemBrand) {
        logger.warn('Stock item brand association not found', { stockItemId, brandId });
        return err(createNotFoundError('Stock item brand association', `${stockItemId}:${brandId}`));
      }

      // Fetch brand name for response
      const brand = await brandRepository.findById(brandId);
      const brandName = brand?.name ?? 'Unknown Brand';

      logger.info('Stock item brand updated successfully', { stockItemId, brandId });

      return ok(toStockItemBrandResponseDto(stockItemBrand, brandName));
    } catch (error) {
      logger.error('Failed to update stock item brand', { error, stockItemId, brandId, dto });
      return err(createDatabaseError('Failed to update stock item brand', error));
    }
  };

  /**
   * Remove brand from stock item
   */
  const removeBrandFromStockItem = async (
    stockItemId: string,
    brandId: string
  ): Promise<Result<void, AppError>> => {
    try {
      logger.info('Removing brand from stock item', { stockItemId, brandId });

      const deleted = await stockItemBrandRepository.delete(stockItemId, brandId);

      if (!deleted) {
        logger.warn('Stock item brand association not found for deletion', { stockItemId, brandId });
        return err(createNotFoundError('Stock item brand association', `${stockItemId}:${brandId}`));
      }

      logger.info('Brand removed from stock item successfully', { stockItemId, brandId });

      return ok(undefined);
    } catch (error) {
      logger.error('Failed to remove brand from stock item', { error, stockItemId, brandId });
      return err(createDatabaseError('Failed to remove brand from stock item', error));
    }
  };

  /**
   * Set preferred brand for a stock item
   * Unsets all other brands as not preferred
   */
  const setPreferredBrand = async (
    stockItemId: string,
    brandId: string
  ): Promise<Result<void, AppError>> => {
    try {
      logger.info('Setting preferred brand for stock item', { stockItemId, brandId });

      const success = await stockItemBrandRepository.setPreferred(stockItemId, brandId);

      if (!success) {
        logger.warn('Stock item brand association not found', { stockItemId, brandId });
        return err(createNotFoundError('Stock item brand association', `${stockItemId}:${brandId}`));
      }

      logger.info('Preferred brand set successfully', { stockItemId, brandId });

      return ok(undefined);
    } catch (error) {
      logger.error('Failed to set preferred brand', { error, stockItemId, brandId });
      return err(createDatabaseError('Failed to set preferred brand', error));
    }
  };

  return {
    createBrand,
    getBrandById,
    getAllBrands,
    updateBrand,
    deleteBrand,
    restoreBrand,
    addBrandToStockItem,
    getStockItemBrands,
    updateStockItemBrand,
    removeBrandFromStockItem,
    setPreferredBrand,
  };
};
