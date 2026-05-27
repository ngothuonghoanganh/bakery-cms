import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { StockItemList } from './StockItemList';
import { StockItemStatus, StockPurchaseUnit, StockUnitType } from '@/types/models/stock.model';

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    initReactI18next: { type: '3rdParty', init: vi.fn() },
    useTranslation: () => ({
      t: (_key: string, fallback?: unknown) =>
        typeof fallback === 'string' ? fallback : _key,
    }),
  };
});

describe('StockItemList', () => {
  it('displays current price summary when available', () => {
    render(
      <StockItemList
        stockItems={[
          {
            id: 'stock-1',
            name: 'Sugar',
            description: null,
            unitType: StockUnitType.WEIGHT,
            unitOfMeasure: StockPurchaseUnit.GRAM,
            baseUnit: StockPurchaseUnit.GRAM,
            currentQuantity: 1000,
            reorderThreshold: null,
            status: StockItemStatus.AVAILABLE,
            createdAt: new Date(),
            updatedAt: new Date(),
            priceSummary: {
              preferredBrandId: null,
              preferredBrandName: null,
              latestPriceBrandId: 'brand-1',
              latestPriceBrandName: 'Bien Hoa',
              latestUnitPriceBeforeTax: 90,
              latestUnitPriceAfterTax: 100,
              latestReceivedAt: new Date(),
              hasPrice: true,
            },
          } as any,
        ]}
        loading={false}
        pagination={{ current: 1, pageSize: 10, total: 1 }}
        filters={{}}
        onFiltersChange={vi.fn()}
        onTableChange={vi.fn()}
        onCreateClick={vi.fn()}
        onDelete={vi.fn(async () => {})}
        onView={vi.fn()}
      />
    );

    expect(screen.getByText(/Bien Hoa/i)).toBeInTheDocument();
    expect(screen.getByText(/\/ gram/i)).toBeInTheDocument();
  });

  it('displays "Chưa có giá" when no price', () => {
    render(
      <StockItemList
        stockItems={[
          {
            id: 'stock-2',
            name: 'Flour',
            description: null,
            unitType: StockUnitType.WEIGHT,
            unitOfMeasure: StockPurchaseUnit.GRAM,
            baseUnit: StockPurchaseUnit.GRAM,
            currentQuantity: 0,
            reorderThreshold: null,
            status: StockItemStatus.OUT_OF_STOCK,
            createdAt: new Date(),
            updatedAt: new Date(),
            priceSummary: {
              preferredBrandId: null,
              preferredBrandName: null,
              latestPriceBrandId: null,
              latestPriceBrandName: null,
              latestUnitPriceBeforeTax: null,
              latestUnitPriceAfterTax: null,
              latestReceivedAt: null,
              hasPrice: false,
            },
          } as any,
        ]}
        loading={false}
        pagination={{ current: 1, pageSize: 10, total: 1 }}
        filters={{}}
        onFiltersChange={vi.fn()}
        onTableChange={vi.fn()}
        onCreateClick={vi.fn()}
        onDelete={vi.fn(async () => {})}
        onView={vi.fn()}
      />
    );

    expect(screen.getByText(/Chưa có giá/i)).toBeInTheDocument();
  });
});
