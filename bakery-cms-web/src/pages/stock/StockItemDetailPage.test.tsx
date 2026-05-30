import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StockItemDetailPage } from './StockItemDetailPage';
import { StockItemStatus, StockPurchaseUnit, StockUnitType } from '@/types/models/stock.model';
import * as stockService from '@/services/stock.service';
import { vi as viLocale } from '@/i18n/locales/vi';

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();

  const getValueByPath = (obj: any, path: string): unknown => {
    return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  };

  const interpolate = (template: string, options?: Record<string, unknown>): string => {
    if (!options) return template;
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => String(options[key] ?? ''));
  };

  return {
    ...actual,
    initReactI18next: { type: '3rdParty', init: vi.fn() },
    useTranslation: () => ({
      t: (key: string, arg2?: unknown) => {
        if (typeof arg2 === 'string') return arg2;
        const value = getValueByPath(viLocale, key);
        if (typeof value === 'string') {
          return interpolate(value, (arg2 as any) || undefined);
        }
        return key;
      },
    }),
  };
});

const mockSuccess = vi.fn();
const mockShowCrudError = vi.fn();

vi.mock('@/hooks/useNotification', () => ({
  useNotification: () => ({ success: mockSuccess }),
}));

vi.mock('@/hooks/useCrudErrorNotification', () => ({
  useCrudErrorNotification: () => ({ showCrudError: mockShowCrudError }),
}));

const mockUseBrands = vi.fn();
vi.mock('@/hooks/useBrands', () => ({
  useBrands: (...args: any[]) => mockUseBrands(...args),
}));

vi.mock('@/services/stock.service', () => ({
  getStockItemById: vi.fn(),
  getStockItemBrands: vi.fn(),
  receiveWithPricing: vi.fn(),
  getStockReceivingLots: vi.fn(),
  adjustStock: vi.fn(),
  addBrandToStockItem: vi.fn(),
  updateStockItemBrand: vi.fn(),
  removeBrandFromStockItem: vi.fn(),
  setPreferredBrand: vi.fn(),
  createBrand: vi.fn(),
}));

const renderPage = () => {
  return render(
    <MemoryRouter initialEntries={['/stock/items/stock-1']}>
      <Routes>
        <Route path="/stock/items/:id" element={<StockItemDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('StockItemDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseBrands.mockReturnValue({
      brands: [{ id: 'brand-1', name: 'Bien Hoa' }],
      refetch: vi.fn(),
    });

    (stockService.getStockItemById as any).mockResolvedValue({
      success: true,
      data: {
        id: 'stock-1',
        name: 'Sugar',
        description: null,
        unitType: StockUnitType.WEIGHT,
        unitOfMeasure: StockPurchaseUnit.GRAM,
        baseUnit: StockPurchaseUnit.GRAM,
        currentQuantity: 1000,
        reorderThreshold: null,
        status: StockItemStatus.AVAILABLE,
        createdAt: new Date('2026-05-27T00:00:00.000Z'),
        updatedAt: new Date('2026-05-27T00:00:00.000Z'),
        priceSummary: {
          preferredBrandId: null,
          preferredBrandName: null,
          latestPriceBrandId: 'brand-1',
          latestPriceBrandName: 'Bien Hoa',
          latestUnitPriceBeforeTax: 90,
          latestUnitPriceAfterTax: 100,
          latestReceivedAt: new Date('2026-05-27T00:00:00.000Z'),
          hasPrice: true,
        },
        latestReceivingLot: null,
      },
    });

    (stockService.getStockItemBrands as any).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'sib-1',
          stockItemId: 'stock-1',
          brandId: 'brand-1',
          brandName: 'Bien Hoa',
          purchaseQuantity: 1,
          purchaseUnit: StockPurchaseUnit.KILOGRAM,
          priceBeforeTax: 90000,
          priceAfterTax: 100000,
          unitPriceBeforeTax: 90,
          unitPriceAfterTax: 100,
          isPreferred: true,
          createdAt: new Date('2026-05-27T00:00:00.000Z'),
          updatedAt: new Date('2026-05-27T00:00:00.000Z'),
        },
      ],
    });

    (stockService.getStockReceivingLots as any).mockResolvedValue({
      success: true,
      data: {
        lots: [
          {
            id: 'lot-1',
            stockItemId: 'stock-1',
            stockItemName: 'Sugar',
            brandId: 'brand-1',
            brandName: 'Bien Hoa',
            receivedQuantity: 1,
            receivedUnit: StockPurchaseUnit.KILOGRAM,
            receivedQuantityBase: 1000,
            baseUnit: StockPurchaseUnit.GRAM,
            priceBeforeTax: 90000,
            priceAfterTax: 100000,
            unitPriceBeforeTax: 90,
            unitPriceAfterTax: 100,
            remainingQuantityBase: 1000,
            receivedAt: new Date('2026-05-27T00:00:00.000Z'),
            supplierName: 'Supplier A',
            invoiceCode: 'INV-001',
            note: 'First lot',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      },
    });

    (stockService.receiveWithPricing as any).mockResolvedValue({
      success: true,
      data: {
        stockItem: { id: 'stock-1' },
        receivingLot: { id: 'lot-1' },
        updatedBrandPrice: { id: 'sib-1' },
      },
    });
  });

  it('renders current price in pricing header', async () => {
    renderPage();

    expect(await screen.findByText('Sugar')).toBeInTheDocument();
    expect(screen.getByText(/Đơn giá \/ base unit/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\/ gram/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Bien Hoa/i).length).toBeGreaterThan(0);
  });

  it('receive-with-pricing modal validates required brand', async () => {
    renderPage();

    const [openBtn] = await screen.findAllByRole('button', { name: /Nhập kho \+ giá/i });
    fireEvent.click(openBtn);

    const dialog = await screen.findByRole('dialog');
    const submitBtn = within(dialog).getByRole('button', { name: /Xác nhận nhập kho/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(within(dialog).getByText(/Vui lòng chọn nhãn hàng/i)).toBeInTheDocument();
    });
    expect(stockService.receiveWithPricing).not.toHaveBeenCalled();
  });

  it('receive-with-pricing modal validates priceAfterTax >= priceBeforeTax', async () => {
    renderPage();
    const user = userEvent.setup();

    const [openBtn] = await screen.findAllByRole('button', { name: /Nhập kho \+ giá/i });
    fireEvent.click(openBtn);
    const dialog = await screen.findByRole('dialog');

    // Switch to create-new-brand mode so brandId validation doesn't block this test
    fireEvent.click(within(dialog).getByRole('button', { name: /Tạo nhãn hàng mới/i }));
    await user.type(within(dialog).getByLabelText(/Tên nhãn hàng/i), 'New Brand');

    const before = within(dialog).getByLabelText(/Giá trước thuế/i);
    const after = within(dialog).getByLabelText(/Giá sau thuế/i);
    await user.clear(before);
    await user.type(before, '10');
    await user.clear(after);
    await user.type(after, '9');

    const submitBtn = within(dialog).getByRole('button', { name: /Xác nhận nhập kho/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Giá sau thuế phải lớn hơn hoặc bằng giá trước thuế/i)).toBeInTheDocument();
    });
    expect(stockService.receiveWithPricing).not.toHaveBeenCalled();
  });

  it('receive-with-pricing preview calculates unit price correctly (1kg -> 1000g)', async () => {
    renderPage();

    const [openBtn] = await screen.findAllByRole('button', { name: /Nhập kho \+ giá/i });
    fireEvent.click(openBtn);
    const dialog = await screen.findByRole('dialog');

    // set brand to avoid blocking submit later
    const comboboxes = within(dialog).getAllByRole('combobox');
    const brandSelect = comboboxes[0] as HTMLElement;
    fireEvent.mouseDown(brandSelect);
    fireEvent.click(
      await screen.findByText(
        (_, el) => !!el && el.classList.contains('ant-select-item-option-content') && el.textContent === 'Bien Hoa'
      )
    );

    // select unit = kilogram
    const unitSelect = comboboxes[1] as HTMLElement;
    fireEvent.mouseDown(unitSelect);
    fireEvent.click(
      await screen.findByText(
        (_, el) =>
          !!el && el.classList.contains('ant-select-item-option-content') && /kilogram/i.test(el.textContent || '')
      )
    );

    // quantity = 1
    fireEvent.change(within(dialog).getByLabelText(/Số lượng nhập/i), { target: { value: '1' } });
    // price after tax = 100000 => 100 / gram
    fireEvent.change(within(dialog).getByLabelText(/Giá sau thuế/i), { target: { value: '100000' } });

    expect(await within(dialog).findByText(/Đơn giá:/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/\/ gram/i)).toBeInTheDocument();
  });

  it('receiving history tab renders lots', async () => {
    renderPage();

    const tab = await screen.findByText(/Lịch sử nhập giá/i);
    fireEvent.click(tab);

    await waitFor(() => {
      expect(stockService.getStockReceivingLots).toHaveBeenCalled();
    });
    expect(await screen.findByText(/INV-001/i)).toBeInTheDocument();
    expect(screen.getByText(/Supplier A/i)).toBeInTheDocument();
  });

  it('submitting receive-with-pricing calls API with correct payload', async () => {
    renderPage();

    // Open modal and select brand
    const [openBtn] = await screen.findAllByRole('button', { name: /Nhập kho \+ giá/i });
    fireEvent.click(openBtn);

    const dialog = await screen.findByRole('dialog');

    // select brand
    const comboboxes = within(dialog).getAllByRole('combobox');
    const brandSelect = comboboxes[0] as HTMLElement;
    fireEvent.mouseDown(brandSelect);
    fireEvent.click(
      await screen.findByText(
        (_, el) => !!el && el.classList.contains('ant-select-item-option-content') && el.textContent === 'Bien Hoa'
      )
    );

    fireEvent.change(within(dialog).getByLabelText(/Số lượng nhập/i), { target: { value: '1' } });
    fireEvent.change(within(dialog).getByLabelText(/Giá trước thuế/i), { target: { value: '90000' } });
    fireEvent.change(within(dialog).getByLabelText(/Giá sau thuế/i), { target: { value: '100000' } });

    fireEvent.click(within(dialog).getByRole('button', { name: /Xác nhận nhập kho/i }));

    await waitFor(() => {
      expect(stockService.receiveWithPricing).toHaveBeenCalled();
    });

    const [calledId, payload] = (stockService.receiveWithPricing as any).mock.calls[0];
    expect(calledId).toBe('stock-1');
    expect(payload).toMatchObject({
      brandId: 'brand-1',
      receivedQuantity: 1,
      priceBeforeTax: 90000,
      priceAfterTax: 100000,
    });
  });
});
