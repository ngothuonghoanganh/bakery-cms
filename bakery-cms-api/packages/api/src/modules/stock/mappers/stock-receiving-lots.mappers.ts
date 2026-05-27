import type { StockReceivingLotModel } from '@bakery-cms/database';
import type { StockPurchaseUnit } from '@bakery-cms/common';
import type { StockReceivingLotResponseDto } from '../dto/stock-receiving-lots.dto';

export const toStockReceivingLotResponseDto = (
  lot: StockReceivingLotModel,
  deps: { stockItemName: string; brandName: string }
): StockReceivingLotResponseDto => {
  return {
    id: lot.id,
    stockItemId: lot.stockItemId,
    stockItemName: deps.stockItemName,
    brandId: lot.brandId,
    brandName: deps.brandName,
    receivedQuantity: Number(lot.receivedQuantity),
    receivedUnit: lot.receivedUnit as StockPurchaseUnit,
    receivedQuantityBase: Number(lot.receivedQuantityBase),
    baseUnit: lot.baseUnit as StockPurchaseUnit,
    priceBeforeTax: Number(lot.priceBeforeTax),
    priceAfterTax: Number(lot.priceAfterTax),
    unitPriceBeforeTax: Number(lot.unitPriceBeforeTax),
    unitPriceAfterTax: Number(lot.unitPriceAfterTax),
    remainingQuantityBase: Number(lot.remainingQuantityBase),
    receivedAt: lot.receivedAt.toISOString(),
    supplierName: lot.supplierName ?? null,
    invoiceCode: lot.invoiceCode ?? null,
    note: lot.note ?? null,
  };
};

