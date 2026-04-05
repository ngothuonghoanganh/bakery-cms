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

export type SystemSettingsAPIResponse = {
  readonly bankReceiver: BankReceiverConfigAPIResponse | null;
  readonly orderExtraFees: readonly OrderExtraFeeTemplateAPIResponse[];
  readonly invoiceLanguage: InvoiceLanguageAPIResponse;
  readonly storeProfile: StoreProfileAPIResponse;
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
