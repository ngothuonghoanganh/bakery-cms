/**
 * Settings service
 * Handles system settings API calls
 */

import { apiClient, extractErrorFromAxiosError } from './api/client';
import type { Result } from '@/types/common/result.types';
import { ok, err } from '@/types/common/result.types';
import type { AppError } from '@/types/common/error.types';
import type {
  SystemSettingsAPIResponse,
  VietQRBankAPIResponse,
  UpdateBankReceiverRequest,
  BankReceiverConfigAPIResponse,
} from '@/types/api/settings.api';
import type {
  SystemSettings,
  VietQRBank,
  BankReceiverConfig,
} from '@/types/models/settings.model';

const mapBankReceiverConfig = (
  config: BankReceiverConfigAPIResponse | null
): BankReceiverConfig | null => {
  if (!config) {
    return null;
  }

  return {
    bankBin: config.bankBin,
    accountNo: config.accountNo,
    accountName: config.accountName,
  };
};

const mapSystemSettings = (response: SystemSettingsAPIResponse): SystemSettings => ({
  bankReceiver: mapBankReceiverConfig(response.bankReceiver),
});

const mapVietQRBank = (bank: VietQRBankAPIResponse): VietQRBank => ({
  id: bank.id,
  name: bank.name,
  code: bank.code,
  bin: bank.bin,
  shortName: bank.shortName,
  logo: bank.logo,
  transferSupported: bank.transferSupported,
  lookupSupported: bank.lookupSupported,
});

export type SettingsService = {
  readonly getSystemSettings: () => Promise<Result<SystemSettings, AppError>>;
  readonly updateBankReceiver: (
    payload: UpdateBankReceiverRequest
  ) => Promise<Result<BankReceiverConfig, AppError>>;
  readonly getVietQRBanks: () => Promise<Result<VietQRBank[], AppError>>;
};

const getSystemSettings = async (): Promise<Result<SystemSettings, AppError>> => {
  try {
    const response = await apiClient.get<{
      success: boolean;
      data: SystemSettingsAPIResponse;
    }>('/settings/system');

    return ok(mapSystemSettings(response.data.data));
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

const updateBankReceiver = async (
  payload: UpdateBankReceiverRequest
): Promise<Result<BankReceiverConfig, AppError>> => {
  try {
    const response = await apiClient.put<{
      success: boolean;
      data: BankReceiverConfigAPIResponse;
    }>('/settings/system/bank-receiver', payload);

    return ok({
      bankBin: response.data.data.bankBin,
      accountNo: response.data.data.accountNo,
      accountName: response.data.data.accountName,
    });
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

const getVietQRBanks = async (): Promise<Result<VietQRBank[], AppError>> => {
  try {
    const response = await apiClient.get<{
      success: boolean;
      data: VietQRBankAPIResponse[];
    }>('/settings/vietqr/banks');

    return ok(response.data.data.map(mapVietQRBank));
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

export const settingsService: SettingsService = {
  getSystemSettings,
  updateBankReceiver,
  getVietQRBanks,
};
