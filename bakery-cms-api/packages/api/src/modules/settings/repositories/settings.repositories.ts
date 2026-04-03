/**
 * Settings repository
 * Data access layer for system settings
 */

import { SystemSettingModel } from '@bakery-cms/database';

/**
 * Settings repository interface
 */
export interface SettingsRepository {
  findByKey(key: string): Promise<SystemSettingModel | null>;
  setByKey(key: string, value: string): Promise<SystemSettingModel>;
}

/**
 * Create settings repository
 */
export const createSettingsRepository = (
  model: typeof SystemSettingModel
): SettingsRepository => {
  const findByKey = async (key: string): Promise<SystemSettingModel | null> => {
    return await model.findOne({ where: { key } });
  };

  const setByKey = async (key: string, value: string): Promise<SystemSettingModel> => {
    const existing = await model.findOne({ where: { key } });

    if (existing) {
      await existing.update({ value });
      return existing;
    }

    return await model.create({ key, value });
  };

  return {
    findByKey,
    setByKey,
  };
};
