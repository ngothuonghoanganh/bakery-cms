/**
 * Settings domain models
 */

export type BankReceiverConfig = {
  readonly bankBin: string;
  readonly accountNo: string;
  readonly accountName: string;
};

export type SystemSettings = {
  readonly bankReceiver: BankReceiverConfig | null;
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
