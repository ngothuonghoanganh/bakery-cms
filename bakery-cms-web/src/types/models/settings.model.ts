/**
 * Settings domain models
 */

export type BankReceiverConfig = {
  readonly bankBin: string;
  readonly accountNo: string;
  readonly accountName: string;
};

export type InvoiceLanguage = 'vi' | 'en';

export type StoreProfile = {
  readonly name: string;
  readonly logoUrl: string | null;
};

export type StorefrontHomeContentLocale = {
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

export type StorefrontHomeContent = {
  readonly vi: StorefrontHomeContentLocale;
  readonly en: StorefrontHomeContentLocale;
};

export type SystemSettings = {
  readonly bankReceiver: BankReceiverConfig | null;
  readonly orderExtraFees: readonly OrderExtraFeeTemplate[];
  readonly invoiceLanguage: InvoiceLanguage;
  readonly storeProfile: StoreProfile;
  readonly storefrontHomeContent: StorefrontHomeContent;
};

export type OrderExtraFeeTemplate = {
  readonly id: string;
  readonly name: string;
  readonly defaultAmount: number;
};

export type VietQRBank = {
  readonly id: number;
  readonly name: string;
  readonly code: string;
  readonly bin: string;
  readonly shortName: string;
  readonly logo: string | null;
  readonly transferSupported: boolean;
  readonly lookupSupported: boolean;
};
