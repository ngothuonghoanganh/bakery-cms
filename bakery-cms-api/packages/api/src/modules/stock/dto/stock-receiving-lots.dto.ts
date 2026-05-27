import { StockPurchaseUnit } from '@bakery-cms/common';

export interface ReceiveWithPricingDto {
  brandId: string;
  receivedQuantity: number;
  receivedUnit: StockPurchaseUnit;
  priceBeforeTax: number;
  priceAfterTax: number;
  receivedAt?: string;
  supplierName?: string;
  invoiceCode?: string;
  note?: string;
}

export interface StockReceivingLotResponseDto {
  id: string;
  stockItemId: string;
  stockItemName: string;
  brandId: string;
  brandName: string;
  receivedQuantity: number;
  receivedUnit: StockPurchaseUnit;
  receivedQuantityBase: number;
  baseUnit: StockPurchaseUnit;
  priceBeforeTax: number;
  priceAfterTax: number;
  unitPriceBeforeTax: number;
  unitPriceAfterTax: number;
  remainingQuantityBase: number;
  receivedAt: string;
  supplierName: string | null;
  invoiceCode: string | null;
  note: string | null;
}

export interface StockReceivingLotListQueryDto {
  page?: number;
  limit?: number;
  brandId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface StockReceivingLotListResponseDto {
  lots: StockReceivingLotResponseDto[];
  total: number;
  page: number;
  limit: number;
}

