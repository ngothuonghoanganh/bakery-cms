/**
 * Settings DTOs (Data Transfer Objects)
 * Type definitions for system settings API payloads
 */

/**
 * Bank receiver configuration for VietQR payments
 */
export interface BankReceiverConfigDto {
  bankBin: string;
  accountNo: string;
  accountName: string;
}

/**
 * Order extra fee template in system settings
 */
export interface OrderExtraFeeTemplateDto {
  id: string;
  name: string;
  defaultAmount: number;
}

export type InvoiceLanguageDto = 'vi' | 'en';

export interface StoreProfileDto {
  name: string;
  logoUrl: string | null;
}

export interface StorefrontHomeContentLocaleDto {
  tagline: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroBackgroundImageUrl: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  highlightHandcrafted: string;
  highlightSeasonal: string;
  highlightFastDelivery: string;
  productsSectionTitle: string;
  productsSectionDescription: string;
  storySectionTitle: string;
  storyHeading: string;
  storyBody: string;
  storyStatOne: string;
  storyStatTwo: string;
  storyStatThree: string;
  promoTitle: string;
  promoDescription: string;
  promoCta: string;
  promoCtaHref: string;
  footerAddress: string;
  footerPhone: string;
  footerHours: string;
}

export interface StorefrontHomeContentDto {
  vi: StorefrontHomeContentLocaleDto;
  en: StorefrontHomeContentLocaleDto;
}

/**
 * System settings response DTO
 */
export interface SystemSettingsResponseDto {
  bankReceiver: BankReceiverConfigDto | null;
  orderExtraFees: OrderExtraFeeTemplateDto[];
  invoiceLanguage: InvoiceLanguageDto;
  storeProfile: StoreProfileDto;
  storefrontHomeContent: StorefrontHomeContentDto;
}

/**
 * Update bank receiver settings request DTO
 */
export interface UpdateBankReceiverDto {
  bankBin: string;
  accountNo: string;
  accountName: string;
}

/**
 * Update order extra fee templates request DTO
 */
export interface UpdateOrderExtraFeesDto {
  fees: OrderExtraFeeTemplateDto[];
}

/**
 * Update invoice language request DTO
 */
export interface UpdateInvoiceLanguageDto {
  language: InvoiceLanguageDto;
}

/**
 * Update store profile request DTO
 */
export interface UpdateStoreProfileDto {
  name: string;
  logoUrl?: string | null;
}

export interface UpdateStorefrontHomeContentDto {
  content: StorefrontHomeContentDto;
}

export interface PublicStorefrontSettingsResponseDto {
  storeProfile: StoreProfileDto;
  storefrontHomeContent: StorefrontHomeContentDto;
}

/**
 * VietQR bank reference DTO
 */
export interface VietQRBankDto {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string | null;
  transferSupported: boolean;
  lookupSupported: boolean;
}
