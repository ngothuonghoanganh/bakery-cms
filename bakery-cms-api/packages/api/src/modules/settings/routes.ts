/**
 * Settings routes
 * Express router configuration for settings endpoints
 */

import { Router } from 'express';
import { getDatabaseModels } from '../../config/database';
import { createSettingsRepository } from './repositories/settings.repositories';
import { createSettingsService } from './services/settings.services';
import { createSettingsHandlers } from './handlers/settings.handlers';
import { validateBody } from '../../middleware/validation';
import { authenticateJWT } from '../../middleware';
import { requireAdmin, requireManager } from '../../middleware/rbac.middleware';
import { updateBankReceiverSchema } from './validators/settings.validators';

/**
 * Create settings router
 */
export const createSettingsRouter = (): Router => {
  const router = Router();

  const models = getDatabaseModels();

  const repository = createSettingsRepository(models.SystemSetting);
  const service = createSettingsService(repository);
  const handlers = createSettingsHandlers(service);

  /**
   * GET /api/settings/system
   * Get system settings
   * Requires: Manager role or higher
   */
  router.get(
    '/system',
    authenticateJWT as any,
    requireManager as any,
    handlers.handleGetSystemSettings as any
  );

  /**
   * PUT /api/settings/system/bank-receiver
   * Update bank receiver settings used for VietQR
   * Requires: Admin role
   */
  router.put(
    '/system/bank-receiver',
    authenticateJWT as any,
    requireAdmin as any,
    validateBody(updateBankReceiverSchema),
    handlers.handleUpdateBankReceiver as any
  );

  /**
   * GET /api/settings/vietqr/banks
   * Get VietQR bank list
   * Requires: Manager role or higher
   */
  router.get(
    '/vietqr/banks',
    authenticateJWT as any,
    requireManager as any,
    handlers.handleGetVietQRBanks as any
  );

  return router;
};
