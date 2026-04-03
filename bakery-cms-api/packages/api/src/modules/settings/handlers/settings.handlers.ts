/**
 * Settings request handlers
 * HTTP layer for settings endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services/settings.services';
import { UpdateBankReceiverDto } from '../dto/settings.dto';
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
  handleUpdateBankReceiver(
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

  return {
    handleGetSystemSettings,
    handleUpdateBankReceiver,
    handleGetVietQRBanks,
  };
};
