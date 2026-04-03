/**
 * API response types for Settings endpoints
 */

export type BankReceiverConfigAPIResponse = {
  readonly bankBin: string;
  readonly accountNo: string;
  readonly accountName: string;
};

export type SystemSettingsAPIResponse = {
  readonly bankReceiver: BankReceiverConfigAPIResponse | null;
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
