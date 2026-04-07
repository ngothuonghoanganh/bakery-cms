/**
 * Settings request handlers
 * HTTP layer for settings endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services/settings.services';
import {
  UpdateBankReceiverDto,
  UpdateInvoiceLanguageDto,
  UpdateOrderExtraFeesDto,
  UpdateStorefrontHomeContentDto,
  UpdateStoreProfileDto,
} from '../dto/settings.dto';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Settings handlers interface
 */
export interface SettingsHandlers {
  handleGetSystemSettings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
  handleGetPublicStorefrontSettings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
  handleUpdateBankReceiver(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
  handleUpdateOrderExtraFees(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
  handleUpdateInvoiceLanguage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
  handleUpdateStoreProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
  handleUpdateStorefrontHomeContent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
  handleGetVietQRBanks(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
}

/**
 * Create settings handlers
 */
export const createSettingsHandlers = (
  service: SettingsService
): SettingsHandlers => {
  const handleGetSystemSettings = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await service.getSystemSettings();

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetSystemSettings', { error });
      next(error);
    }
  };

  const handleGetPublicStorefrontSettings = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await service.getPublicStorefrontSettings();

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetPublicStorefrontSettings', { error });
      next(error);
    }
  };

  const handleUpdateBankReceiver = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: UpdateBankReceiverDto = req.body;
      const result = await service.updateBankReceiver(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Updated bank receiver settings');

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleUpdateBankReceiver', { error });
      next(error);
    }
  };

  const handleGetVietQRBanks = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await service.getVietQRBanks();

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetVietQRBanks', { error });
      next(error);
    }
  };

  const handleUpdateOrderExtraFees = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: UpdateOrderExtraFeesDto = req.body;
      const result = await service.updateOrderExtraFees(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Updated order extra fees settings', {
        count: result.value.length,
      });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleUpdateOrderExtraFees', { error });
      next(error);
    }
  };

  const handleUpdateInvoiceLanguage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: UpdateInvoiceLanguageDto = req.body;
      const result = await service.updateInvoiceLanguage(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Updated invoice language settings', {
        language: result.value,
      });

      res.status(200).json({
        success: true,
        data: {
          language: result.value,
        },
      });
    } catch (error) {
      logger.error('Unhandled error in handleUpdateInvoiceLanguage', { error });
      next(error);
    }
  };

  const handleUpdateStoreProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: UpdateStoreProfileDto = req.body;
      const result = await service.updateStoreProfile(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Updated store profile settings');

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleUpdateStoreProfile', { error });
      next(error);
    }
  };

  const handleUpdateStorefrontHomeContent = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: UpdateStorefrontHomeContentDto = req.body;
      const result = await service.updateStorefrontHomeContent(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Updated storefront home content settings');

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleUpdateStorefrontHomeContent', { error });
      next(error);
    }
  };

  return {
    handleGetSystemSettings,
    handleGetPublicStorefrontSettings,
    handleUpdateBankReceiver,
    handleUpdateOrderExtraFees,
    handleUpdateInvoiceLanguage,
    handleUpdateStoreProfile,
    handleUpdateStorefrontHomeContent,
    handleGetVietQRBanks,
  };
};
