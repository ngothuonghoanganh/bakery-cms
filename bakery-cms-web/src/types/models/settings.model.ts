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

export type SystemSettings = {
  readonly bankReceiver: BankReceiverConfig | null;
  readonly orderExtraFees: readonly OrderExtraFeeTemplate[];
  readonly invoiceLanguage: InvoiceLanguage;
  readonly storeProfile: StoreProfile;
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
