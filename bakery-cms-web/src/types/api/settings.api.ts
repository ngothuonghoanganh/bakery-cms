/**
 * API response types for Settings endpoints
 */

export type BankReceiverConfigAPIResponse = {
  readonly bankBin: string;
  readonly accountNo: string;
  readonly accountName: string;
};

export type InvoiceLanguageAPIResponse = 'vi' | 'en';

export type StoreProfileAPIResponse = {
  readonly name: string;
  readonly logoUrl: string | null;
};

export type StorefrontHomeContentLocaleAPIResponse = {
  readonly tagline: string;
  readonly heroEyebrow: string;
  readonly heroTitle: string;
  readonly heroDescription: string;
  readonly heroBackgroundImageUrl: string;
  readonly heroPrimaryCta: string;
  readonly heroSecondaryCta: string;
  readonly highlightHandcrafted: string;
  readonly highlightSeasonal: string;
  readonly highlightFastDelivery: string;
  readonly productsSectionTitle: string;
  readonly productsSectionDescription: string;
  readonly storySectionTitle: string;
  readonly storyHeading: string;
  readonly storyBody: string;
  readonly storyStatOne: string;
  readonly storyStatTwo: string;
  readonly storyStatThree: string;
  readonly promoTitle: string;
  readonly promoDescription: string;
  readonly promoCta: string;
  readonly promoCtaHref: string;
  readonly footerAddress: string;
  readonly footerPhone: string;
  readonly footerHours: string;
};

export type StorefrontHomeContentAPIResponse = {
  readonly vi: StorefrontHomeContentLocaleAPIResponse;
  readonly en: StorefrontHomeContentLocaleAPIResponse;
};

export type SystemSettingsAPIResponse = {
  readonly bankReceiver: BankReceiverConfigAPIResponse | null;
  readonly orderExtraFees: readonly OrderExtraFeeTemplateAPIResponse[];
  readonly invoiceLanguage: InvoiceLanguageAPIResponse;
  readonly storeProfile: StoreProfileAPIResponse;
  readonly storefrontHomeContent: StorefrontHomeContentAPIResponse;
};

export type OrderExtraFeeTemplateAPIResponse = {
  readonly id: string;
  readonly name: string;
  readonly defaultAmount: number;
};

export type VietQRBankAPIResponse = {
  readonly id: number;
  readonly name: string;
  readonly code: string;
  readonly bin: string;
  readonly shortName: string;
  readonly logo: string | null;
  readonly transferSupported: boolean;
  readonly lookupSupported: boolean;
};

export type UpdateBankReceiverRequest = {
  readonly bankBin: string;
  readonly accountNo: string;
  readonly accountName: string;
};

export type UpdateOrderExtraFeesRequest = {
  readonly fees: readonly OrderExtraFeeTemplateAPIResponse[];
};

export type UpdateInvoiceLanguageRequest = {
  readonly language: InvoiceLanguageAPIResponse;
};

export type UpdateInvoiceLanguageResponse = {
  readonly language: InvoiceLanguageAPIResponse;
};

export type UpdateStoreProfileRequest = {
  readonly name: string;
  readonly logoUrl?: string | null;
};

export type UpdateStoreProfileResponse = StoreProfileAPIResponse;

export type UpdateStorefrontHomeContentRequest = {
  readonly content: StorefrontHomeContentAPIResponse;
};

export type UpdateStorefrontHomeContentResponse = StorefrontHomeContentAPIResponse;
