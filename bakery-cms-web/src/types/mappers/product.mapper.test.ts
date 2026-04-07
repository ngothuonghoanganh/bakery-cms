import { describe, expect, it } from 'vitest';
import { SaleUnitType } from '@bakery-cms/common';
import { mapProductComboItemFromAPI } from './product.mapper';

describe('product.mapper combo item mapping', () => {
  it('maps combo child saleUnitType from API payload', () => {
    const mapped = mapProductComboItemFromAPI({
      id: 'combo-item-1',
      comboProductId: 'combo-1',
      itemProductId: 'child-1',
      quantity: 15.25,
      displayOrder: 0,
      itemProduct: {
        id: 'child-1',
        productCode: 'SP001',
        name: 'Child Weight Product',
        saleUnitType: SaleUnitType.WEIGHT,
        imageUrl: null,
        imageFileId: null,
      },
      createdAt: '2026-04-07T00:00:00.000Z',
      updatedAt: '2026-04-07T00:00:00.000Z',
    });

    expect(mapped.itemProduct?.saleUnitType).toBe(SaleUnitType.WEIGHT);
  });

  it('falls back to piece when saleUnitType is absent in API payload', () => {
    const mapped = mapProductComboItemFromAPI({
      id: 'combo-item-1',
      comboProductId: 'combo-1',
      itemProductId: 'child-1',
      quantity: 1,
      displayOrder: 0,
      itemProduct: {
        id: 'child-1',
        productCode: 'SP001',
        name: 'Child Product',
        imageUrl: null,
        imageFileId: null,
      } as any,
      createdAt: '2026-04-07T00:00:00.000Z',
      updatedAt: '2026-04-07T00:00:00.000Z',
    });

    expect(mapped.itemProduct?.saleUnitType).toBe(SaleUnitType.PIECE);
  });
});

