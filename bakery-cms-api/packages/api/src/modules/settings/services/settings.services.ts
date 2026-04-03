/**
 * Settings services
 * Business logic layer for system settings
 */

import { Result, ok, err } from 'neverthrow';
import { AppError } from '@bakery-cms/common';
import { SettingsRepository } from '../repositories/settings.repositories';
import {
  BankReceiverConfigDto,
  SystemSettingsResponseDto,
  UpdateBankReceiverDto,
  VietQRBankDto,
} from '../dto/settings.dto';
import {
  createDatabaseError,
  createInvalidInputError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

export const BANK_RECEIVER_SETTING_KEY = 'vietqr.bank_receiver';
const DEFAULT_RECEIVER_ACCOUNT_NAME = 'BAKERY CMS';
const VIETQR_BANKS_API_URL = 'https://api.vietqr.io/v2/banks';
const VIETQR_BANKS_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

let banksCache: { data: VietQRBankDto[]; fetchedAt: number } | null = null;

const normalizeAccountName = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (match) => (match === 'đ' ? 'd' : 'D'))
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const parseBankReceiver = (value: string | null): BankReceiverConfigDto | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<BankReceiverConfigDto>;

    if (!parsed.bankBin || !parsed.accountNo) {
      return null;
    }

    const accountName = normalizeAccountName(
      String(parsed.accountName ?? DEFAULT_RECEIVER_ACCOUNT_NAME)
    );

    return {
      bankBin: String(parsed.bankBin),
      accountNo: String(parsed.accountNo),
      accountName: accountName || DEFAULT_RECEIVER_ACCOUNT_NAME,
    };
  } catch {
    return null;
  }
};

const toBoolean = (value: unknown): boolean => {
  return value === true || value === 1 || value === '1';
};

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
};

const toNumberValue = (value: unknown): number => {
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapVietQRBank = (raw: unknown): VietQRBankDto | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const bank = raw as Record<string, unknown>;

  const code = toStringValue(bank['code']);
  const bin = toStringValue(bank['bin']);

  if (!code || !bin) {
    return null;
  }

  return {
    id: toNumberValue(bank['id']),
    name: toStringValue(bank['name']),
    code,
    bin,
    shortName: toStringValue(bank['shortName'] ?? bank['short_name']),
    logo: toStringValue(bank['logo']) || null,
    transferSupported: toBoolean(
      bank['transferSupported'] ?? bank['isTransfer'] ?? bank['transfer_supported']
    ),
    lookupSupported: toBoolean(
      bank['lookupSupported'] ?? bank['lookup_supported']
    ),
  };
};

/**
 * Settings service interface
 */
export interface SettingsService {
  getSystemSettings(): Promise<Result<SystemSettingsResponseDto, AppError>>;
  updateBankReceiver(
    dto: UpdateBankReceiverDto
  ): Promise<Result<BankReceiverConfigDto, AppError>>;
  getVietQRBanks(): Promise<Result<VietQRBankDto[], AppError>>;
}

/**
 * Create settings service
 */
export const createSettingsService = (
  repository: SettingsRepository
): SettingsService => {
  const getSystemSettings = async (): Promise<
    Result<SystemSettingsResponseDto, AppError>
  > => {
    try {
      const bankReceiverSetting = await repository.findByKey(BANK_RECEIVER_SETTING_KEY);

      return ok({
        bankReceiver: parseBankReceiver(bankReceiverSetting?.value ?? null),
      });
    } catch (error) {
      logger.error('Failed to fetch system settings', { error });
      return err(createDatabaseError('Failed to fetch system settings', error));
    }
  };

  const updateBankReceiver = async (
    dto: UpdateBankReceiverDto
  ): Promise<Result<BankReceiverConfigDto, AppError>> => {
    try {
      if (!dto.bankBin || !dto.accountNo || !dto.accountName) {
        return err(
          createInvalidInputError('bankBin, accountNo and accountName are required')
        );
      }

      const accountName = normalizeAccountName(dto.accountName);
      if (!accountName) {
        return err(createInvalidInputError('accountName is required'));
      }

      const payload: BankReceiverConfigDto = {
        bankBin: dto.bankBin,
        accountNo: dto.accountNo,
        accountName,
      };

      await repository.setByKey(BANK_RECEIVER_SETTING_KEY, JSON.stringify(payload));

      return ok(payload);
    } catch (error) {
      logger.error('Failed to update bank receiver settings', { error, dto });
      return err(createDatabaseError('Failed to update bank receiver settings', error));
    }
  };

  const getVietQRBanks = async (): Promise<Result<VietQRBankDto[], AppError>> => {
    try {
      const now = Date.now();
      if (banksCache && now - banksCache.fetchedAt < VIETQR_BANKS_CACHE_TTL_MS) {
        return ok(banksCache.data);
      }

      const response = await fetch(VIETQR_BANKS_API_URL, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return err(
          createDatabaseError(
            `Failed to fetch VietQR bank list (status ${response.status})`
          )
        );
      }

      const payload = (await response.json()) as { data?: unknown };
      const data = payload.data;

      if (!Array.isArray(data)) {
        return err(createDatabaseError('Invalid VietQR bank list response'));
      }

      const banks = data
        .map(mapVietQRBank)
        .filter((bank): bank is VietQRBankDto => bank !== null)
        .sort((a, b) => a.shortName.localeCompare(b.shortName));

      banksCache = {
        data: banks,
        fetchedAt: now,
      };

      return ok(banks);
    } catch (error) {
      logger.error('Failed to fetch VietQR bank list', { error });
      return err(createDatabaseError('Failed to fetch VietQR bank list', error));
    }
  };

  return {
    getSystemSettings,
    updateBankReceiver,
    getVietQRBanks,
  };
};
