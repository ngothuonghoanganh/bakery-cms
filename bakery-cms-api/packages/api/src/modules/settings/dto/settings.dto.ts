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
 * System settings response DTO
 */
export interface SystemSettingsResponseDto {
  bankReceiver: BankReceiverConfigDto | null;
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
