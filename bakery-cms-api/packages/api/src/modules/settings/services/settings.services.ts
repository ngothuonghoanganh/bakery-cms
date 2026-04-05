/**
 * Settings services
 * Business logic layer for system settings
 */

import { Result, ok, err } from 'neverthrow';
import { AppError } from '@bakery-cms/common';
import { SettingsRepository } from '../repositories/settings.repositories';
import {
  BankReceiverConfigDto,
  InvoiceLanguageDto,
  OrderExtraFeeTemplateDto,
  StoreProfileDto,
  SystemSettingsResponseDto,
  UpdateBankReceiverDto,
  UpdateInvoiceLanguageDto,
  UpdateOrderExtraFeesDto,
  UpdateStoreProfileDto,
  VietQRBankDto,
} from '../dto/settings.dto';
import {
  createDatabaseError,
  createInvalidInputError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

export const BANK_RECEIVER_SETTING_KEY = 'vietqr.bank_receiver';
export const ORDER_EXTRA_FEES_SETTING_KEY = 'orders.extra_fee_templates';
export const ORDER_INVOICE_LANGUAGE_SETTING_KEY = 'orders.invoice_language';
export const ORDER_STORE_PROFILE_SETTING_KEY = 'orders.store_profile';
const DEFAULT_RECEIVER_ACCOUNT_NAME = 'BAKERY CMS';
const DEFAULT_INVOICE_LANGUAGE: InvoiceLanguageDto = 'en';
const DEFAULT_STORE_NAME = 'BAKERY CMS';
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

const toMoney = (value: number): number => Math.round(value * 100) / 100;

const parseOrderExtraFees = (value: string | null): OrderExtraFeeTemplateDto[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const raw = item as Record<string, unknown>;
        const id = String(raw['id'] ?? '').trim();
        const name = String(raw['name'] ?? '').trim();
        const defaultAmount = Number(raw['defaultAmount'] ?? 0);

        if (!id || !name || !Number.isFinite(defaultAmount) || defaultAmount < 0) {
          return null;
        }

        return {
          id,
          name,
          defaultAmount: toMoney(defaultAmount),
        };
      })
      .filter((fee): fee is OrderExtraFeeTemplateDto => fee !== null);
  } catch {
    return [];
  }
};

const parseInvoiceLanguage = (value: string | null): InvoiceLanguageDto => {
  if (value === 'vi' || value === 'en') {
    return value;
  }

  return DEFAULT_INVOICE_LANGUAGE;
};

const normalizeStoreName = (value: string): string => {
  return value.trim().replace(/\s+/g, ' ');
};

const normalizeLogoUrl = (value: unknown): string | null => {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : null;
};

const parseStoreProfile = (value: string | null): StoreProfileDto => {
  if (!value) {
    return {
      name: DEFAULT_STORE_NAME,
      logoUrl: null,
    };
  }

  try {
    const parsed = JSON.parse(value) as Partial<StoreProfileDto>;
    const name = normalizeStoreName(String(parsed.name ?? DEFAULT_STORE_NAME));

    return {
      name: name || DEFAULT_STORE_NAME,
      logoUrl: normalizeLogoUrl(parsed.logoUrl),
    };
  } catch {
    return {
      name: DEFAULT_STORE_NAME,
      logoUrl: null,
    };
  }
};

const normalizeOrderExtraFeesPayload = (
  fees: readonly OrderExtraFeeTemplateDto[]
): OrderExtraFeeTemplateDto[] => {
  const seenIds = new Set<string>();

  return fees
    .map((fee) => {
      const id = String(fee.id ?? '').trim();
      const name = String(fee.name ?? '').trim();
      const defaultAmount = Number(fee.defaultAmount ?? 0);

      if (!id || !name || !Number.isFinite(defaultAmount) || defaultAmount < 0) {
        return null;
      }

      if (seenIds.has(id)) {
        return null;
      }
      seenIds.add(id);

      return {
        id,
        name,
        defaultAmount: toMoney(defaultAmount),
      };
    })
    .filter((fee): fee is OrderExtraFeeTemplateDto => fee !== null);
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
  updateOrderExtraFees(
    dto: UpdateOrderExtraFeesDto
  ): Promise<Result<OrderExtraFeeTemplateDto[], AppError>>;
  updateInvoiceLanguage(
    dto: UpdateInvoiceLanguageDto
  ): Promise<Result<InvoiceLanguageDto, AppError>>;
  updateStoreProfile(
    dto: UpdateStoreProfileDto
  ): Promise<Result<StoreProfileDto, AppError>>;
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
      const [
        bankReceiverSetting,
        orderExtraFeesSetting,
        invoiceLanguageSetting,
        storeProfileSetting,
      ] = await Promise.all([
        repository.findByKey(BANK_RECEIVER_SETTING_KEY),
        repository.findByKey(ORDER_EXTRA_FEES_SETTING_KEY),
        repository.findByKey(ORDER_INVOICE_LANGUAGE_SETTING_KEY),
        repository.findByKey(ORDER_STORE_PROFILE_SETTING_KEY),
      ]);

      return ok({
        bankReceiver: parseBankReceiver(bankReceiverSetting?.value ?? null),
        orderExtraFees: parseOrderExtraFees(orderExtraFeesSetting?.value ?? null),
        invoiceLanguage: parseInvoiceLanguage(invoiceLanguageSetting?.value ?? null),
        storeProfile: parseStoreProfile(storeProfileSetting?.value ?? null),
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

  const updateOrderExtraFees = async (
    dto: UpdateOrderExtraFeesDto
  ): Promise<Result<OrderExtraFeeTemplateDto[], AppError>> => {
    try {
      if (!Array.isArray(dto.fees)) {
        return err(createInvalidInputError('fees must be an array'));
      }

      const normalized = normalizeOrderExtraFeesPayload(dto.fees);

      if (normalized.length !== dto.fees.length) {
        return err(
          createInvalidInputError(
            'Each fee must have a unique id, name and non-negative defaultAmount'
          )
        );
      }

      await repository.setByKey(
        ORDER_EXTRA_FEES_SETTING_KEY,
        JSON.stringify(normalized)
      );

      return ok(normalized);
    } catch (error) {
      logger.error('Failed to update order extra fees settings', { error, dto });
      return err(createDatabaseError('Failed to update order extra fees settings', error));
    }
  };

  const updateInvoiceLanguage = async (
    dto: UpdateInvoiceLanguageDto
  ): Promise<Result<InvoiceLanguageDto, AppError>> => {
    try {
      if (!dto.language || (dto.language !== 'vi' && dto.language !== 'en')) {
        return err(createInvalidInputError('language must be one of: vi, en'));
      }

      await repository.setByKey(ORDER_INVOICE_LANGUAGE_SETTING_KEY, dto.language);

      return ok(dto.language);
    } catch (error) {
      logger.error('Failed to update invoice language settings', { error, dto });
      return err(createDatabaseError('Failed to update invoice language settings', error));
    }
  };

  const updateStoreProfile = async (
    dto: UpdateStoreProfileDto
  ): Promise<Result<StoreProfileDto, AppError>> => {
    try {
      const name = normalizeStoreName(String(dto.name ?? ''));
      if (!name) {
        return err(createInvalidInputError('name is required'));
      }

      const payload: StoreProfileDto = {
        name,
        logoUrl: normalizeLogoUrl(dto.logoUrl),
      };

      await repository.setByKey(ORDER_STORE_PROFILE_SETTING_KEY, JSON.stringify(payload));

      return ok(payload);
    } catch (error) {
      logger.error('Failed to update store profile settings', { error, dto });
      return err(createDatabaseError('Failed to update store profile settings', error));
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
    updateOrderExtraFees,
    updateInvoiceLanguage,
    updateStoreProfile,
    getVietQRBanks,
  };
};
