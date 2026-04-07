/**
 * Settings service
 * Handles system settings API calls
 */

import { apiClient, extractErrorFromAxiosError } from './api/client';
import type { Result } from '@/types/common/result.types';
import { ok, err } from '@/types/common/result.types';
import type { AppError } from '@/types/common/error.types';
import type {
  InvoiceLanguageAPIResponse,
  StorefrontHomeContentAPIResponse,
  StorefrontHomeContentLocaleAPIResponse,
  SystemSettingsAPIResponse,
  StoreProfileAPIResponse,
  VietQRBankAPIResponse,
  UpdateBankReceiverRequest,
  BankReceiverConfigAPIResponse,
  OrderExtraFeeTemplateAPIResponse,
  UpdateInvoiceLanguageRequest,
  UpdateInvoiceLanguageResponse,
  UpdateOrderExtraFeesRequest,
  UpdateStorefrontHomeContentRequest,
  UpdateStorefrontHomeContentResponse,
  UpdateStoreProfileRequest,
  UpdateStoreProfileResponse,
} from '@/types/api/settings.api';
import type {
  SystemSettings,
  VietQRBank,
  BankReceiverConfig,
  InvoiceLanguage,
  OrderExtraFeeTemplate,
  StoreProfile,
  StorefrontHomeContent,
  StorefrontHomeContentLocale,
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

const mapStoreProfile = (
  profile: StoreProfileAPIResponse | null | undefined
): StoreProfile => {
  const name = String(profile?.name ?? '').trim();
  const logoUrl = String(profile?.logoUrl ?? '').trim();

  return {
    name: name || 'BAKERY CMS',
    logoUrl: logoUrl.length > 0 ? logoUrl : null,
  };
};

const mapStorefrontLocaleContent = (
  content: StorefrontHomeContentLocaleAPIResponse
): StorefrontHomeContentLocale => ({
  tagline: content.tagline,
  heroEyebrow: content.heroEyebrow,
  heroTitle: content.heroTitle,
  heroDescription: content.heroDescription,
  heroBackgroundImageUrl: content.heroBackgroundImageUrl,
  heroPrimaryCta: content.heroPrimaryCta,
  heroSecondaryCta: content.heroSecondaryCta,
  highlightHandcrafted: content.highlightHandcrafted,
  highlightSeasonal: content.highlightSeasonal,
  highlightFastDelivery: content.highlightFastDelivery,
  productsSectionTitle: content.productsSectionTitle,
  productsSectionDescription: content.productsSectionDescription,
  storySectionTitle: content.storySectionTitle,
  storyHeading: content.storyHeading,
  storyBody: content.storyBody,
  storyStatOne: content.storyStatOne,
  storyStatTwo: content.storyStatTwo,
  storyStatThree: content.storyStatThree,
  promoTitle: content.promoTitle,
  promoDescription: content.promoDescription,
  promoCta: content.promoCta,
  promoCtaHref: content.promoCtaHref,
  footerAddress: content.footerAddress,
  footerPhone: content.footerPhone,
  footerHours: content.footerHours,
});

const mapStorefrontHomeContent = (
  content: StorefrontHomeContentAPIResponse | null | undefined
): StorefrontHomeContent => ({
  vi: mapStorefrontLocaleContent(
    content?.vi ?? {
      tagline: '',
      heroEyebrow: '',
      heroTitle: '',
      heroDescription: '',
      heroBackgroundImageUrl: '',
      heroPrimaryCta: '',
      heroSecondaryCta: '',
      highlightHandcrafted: '',
      highlightSeasonal: '',
      highlightFastDelivery: '',
      productsSectionTitle: '',
      productsSectionDescription: '',
      storySectionTitle: '',
      storyHeading: '',
      storyBody: '',
      storyStatOne: '',
      storyStatTwo: '',
      storyStatThree: '',
      promoTitle: '',
      promoDescription: '',
      promoCta: '',
      promoCtaHref: '',
      footerAddress: '',
      footerPhone: '',
      footerHours: '',
    }
  ),
  en: mapStorefrontLocaleContent(
    content?.en ?? {
      tagline: '',
      heroEyebrow: '',
      heroTitle: '',
      heroDescription: '',
      heroBackgroundImageUrl: '',
      heroPrimaryCta: '',
      heroSecondaryCta: '',
      highlightHandcrafted: '',
      highlightSeasonal: '',
      highlightFastDelivery: '',
      productsSectionTitle: '',
      productsSectionDescription: '',
      storySectionTitle: '',
      storyHeading: '',
      storyBody: '',
      storyStatOne: '',
      storyStatTwo: '',
      storyStatThree: '',
      promoTitle: '',
      promoDescription: '',
      promoCta: '',
      promoCtaHref: '',
      footerAddress: '',
      footerPhone: '',
      footerHours: '',
    }
  ),
});

const mapSystemSettings = (response: SystemSettingsAPIResponse): SystemSettings => ({
  bankReceiver: mapBankReceiverConfig(response.bankReceiver),
  orderExtraFees: (response.orderExtraFees || []).map((fee) => ({
    id: fee.id,
    name: fee.name,
    defaultAmount: fee.defaultAmount,
  })),
  invoiceLanguage:
    response.invoiceLanguage === 'vi' || response.invoiceLanguage === 'en'
      ? response.invoiceLanguage
      : 'en',
  storeProfile: mapStoreProfile(response.storeProfile),
  storefrontHomeContent: mapStorefrontHomeContent(response.storefrontHomeContent),
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

const mapOrderExtraFeeTemplate = (
  fee: OrderExtraFeeTemplateAPIResponse
): OrderExtraFeeTemplate => ({
  id: fee.id,
  name: fee.name,
  defaultAmount: fee.defaultAmount,
});

const mapInvoiceLanguage = (
  value: InvoiceLanguageAPIResponse | string | null | undefined
): InvoiceLanguage => {
  if (value === 'vi' || value === 'en') {
    return value;
  }

  return 'en';
};

export type SettingsService = {
  readonly getSystemSettings: () => Promise<Result<SystemSettings, AppError>>;
  readonly updateBankReceiver: (
    payload: UpdateBankReceiverRequest
  ) => Promise<Result<BankReceiverConfig, AppError>>;
  readonly updateOrderExtraFees: (
    payload: UpdateOrderExtraFeesRequest
  ) => Promise<Result<OrderExtraFeeTemplate[], AppError>>;
  readonly updateInvoiceLanguage: (
    payload: UpdateInvoiceLanguageRequest
  ) => Promise<Result<InvoiceLanguage, AppError>>;
  readonly updateStoreProfile: (
    payload: UpdateStoreProfileRequest
  ) => Promise<Result<StoreProfile, AppError>>;
  readonly updateStorefrontHomeContent: (
    payload: UpdateStorefrontHomeContentRequest
  ) => Promise<Result<StorefrontHomeContent, AppError>>;
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

const updateOrderExtraFees = async (
  payload: UpdateOrderExtraFeesRequest
): Promise<Result<OrderExtraFeeTemplate[], AppError>> => {
  try {
    const response = await apiClient.put<{
      success: boolean;
      data: OrderExtraFeeTemplateAPIResponse[];
    }>('/settings/system/order-extra-fees', payload);

    return ok(response.data.data.map(mapOrderExtraFeeTemplate));
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

const updateInvoiceLanguage = async (
  payload: UpdateInvoiceLanguageRequest
): Promise<Result<InvoiceLanguage, AppError>> => {
  try {
    const response = await apiClient.put<{
      success: boolean;
      data: UpdateInvoiceLanguageResponse;
    }>('/settings/system/invoice-language', payload);

    return ok(mapInvoiceLanguage(response.data.data.language));
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

const updateStoreProfile = async (
  payload: UpdateStoreProfileRequest
): Promise<Result<StoreProfile, AppError>> => {
  try {
    const response = await apiClient.put<{
      success: boolean;
      data: UpdateStoreProfileResponse;
    }>('/settings/system/store-profile', payload);

    return ok(mapStoreProfile(response.data.data));
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

const updateStorefrontHomeContent = async (
  payload: UpdateStorefrontHomeContentRequest
): Promise<Result<StorefrontHomeContent, AppError>> => {
  try {
    const response = await apiClient.put<{
      success: boolean;
      data: UpdateStorefrontHomeContentResponse;
    }>('/settings/system/storefront-home-content', payload);

    return ok(mapStorefrontHomeContent(response.data.data));
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

export const settingsService: SettingsService = {
  getSystemSettings,
  updateBankReceiver,
  updateOrderExtraFees,
  updateInvoiceLanguage,
  updateStoreProfile,
  updateStorefrontHomeContent,
  getVietQRBanks,
};
