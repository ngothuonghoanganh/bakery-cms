import { ProductType, SaleUnitType } from '@bakery-cms/common';
import { toProductResponseDto } from './products.mappers';

describe('products.mappers combo items', () => {
  it('maps combo child saleUnitType from itemProduct', () => {
    const now = new Date('2026-04-07T00:00:00.000Z');
    const model = {
      id: 'product-1',
      productCode: 'SP001',
      name: 'Combo Product',
      description: null,
      price: 100000,
      saleUnitType: SaleUnitType.PIECE,
      category: null,
      businessType: 'ready-to-sell',
      status: 'available',
      productType: ProductType.COMBO,
      isPublished: true,
      imageUrl: null,
      imageFileId: null,
      createdAt: now,
      updatedAt: now,
      comboItems: [
        {
          id: 'combo-item-1',
          comboProductId: 'product-1',
          itemProductId: 'child-1',
          quantity: 12.5,
          displayOrder: 0,
          createdAt: now,
          updatedAt: now,
          itemProduct: {
            id: 'child-1',
            productCode: 'SP002',
            name: 'Child Weight Product',
            saleUnitType: SaleUnitType.WEIGHT,
            imageUrl: null,
            imageFileId: null,
          },
        },
      ],
    } as any;

    const dto = toProductResponseDto(model);

    expect(dto.comboItems[0]?.itemProduct?.saleUnitType).toBe(
      SaleUnitType.WEIGHT
    );
  });

  it('falls back to piece when combo child saleUnitType is missing', () => {
    const now = new Date('2026-04-07T00:00:00.000Z');
    const model = {
      id: 'product-1',
      productCode: 'SP001',
      name: 'Combo Product',
      description: null,
      price: 100000,
      saleUnitType: SaleUnitType.PIECE,
      category: null,
      businessType: 'ready-to-sell',
      status: 'available',
      productType: ProductType.COMBO,
      isPublished: true,
      imageUrl: null,
      imageFileId: null,
      createdAt: now,
      updatedAt: now,
      comboItems: [
        {
          id: 'combo-item-1',
          comboProductId: 'product-1',
          itemProductId: 'child-1',
          quantity: 1,
          displayOrder: 0,
          createdAt: now,
          updatedAt: now,
          itemProduct: {
            id: 'child-1',
            productCode: 'SP002',
            name: 'Child Product',
            imageUrl: null,
            imageFileId: null,
          },
        },
      ],
    } as any;

    const dto = toProductResponseDto(model);

    expect(dto.comboItems[0]?.itemProduct?.saleUnitType).toBe(
      SaleUnitType.PIECE
    );
  });
});

