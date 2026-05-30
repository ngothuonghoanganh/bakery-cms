# STOCK_UI_RESPONSIVE_I18N_LOG (v1)

## 1. Summary
- Refactor UI quản lý kho/nguyên vật liệu sau phase **stock receiving price** để ưu tiên nghiệp vụ “Nhập kho + giá”, nhìn rõ giá/tồn ngay từ list + detail.
- Fix responsive cho: stock list, stock detail, receive-with-pricing modal, receiving lots, brand pricing.
- Chuẩn hoá i18n cho toàn bộ UI mới liên quan receiving price (không còn hard-code text lẫn Anh/Việt trong các component mới).

## 2. Problems fixed
- **Ugly UI**: bảng quá rộng, CTA “Nhập kho + giá” không nổi bật, giá/brand/nhập gần nhất bị rải nhiều cột/tab.
- **Responsive issues**: table vỡ layout trên mobile/tablet, modal tràn ngang, tab/table khó dùng.
- **i18n issues**: key mới thiếu, nhiều chỗ dùng `t('key', 'English fallback')` khiến UI tiếng Việt lẫn text.

## 3. Files changed
- `bakery-cms-web/src/components/shared/PageHeader/PageHeader.tsx`
- `bakery-cms-web/src/components/features/stock/StockItemList/StockItemList.types.ts`
- `bakery-cms-web/src/components/features/stock/StockItemList/StockItemList.tsx`
- `bakery-cms-web/src/components/features/stock/StockItemList/StockItemList.test.tsx`
- `bakery-cms-web/src/pages/stock/StockItemsPage.tsx`
- `bakery-cms-web/src/pages/stock/StockItemDetailPage.tsx`
- `bakery-cms-web/src/pages/stock/StockItemDetailPage.test.tsx`
- `bakery-cms-web/src/components/features/stock/StockItemDetail/BrandCurrentPricingTable.tsx`
- `bakery-cms-web/src/components/features/stock/StockItemDetail/ReceiveWithPricingModal.tsx`
- `bakery-cms-web/src/components/features/stock/StockItemDetail/ReceivingLotsTable.tsx`
- `bakery-cms-web/src/components/features/stock/StockItemDetail/StockItemHeaderSummary.tsx`
- `bakery-cms-web/src/components/features/stock/StockItemDetail/StockItemOverviewTab.tsx`
- `bakery-cms-web/src/components/features/stock/StockItemDetail/StockPriceOverviewCard.tsx`
- `bakery-cms-web/src/i18n/locales/vi.ts`
- `bakery-cms-web/src/i18n/locales/en.ts`

## 4. UI changes
### 4.1 Stock list
- Desktop giữ table nhưng **gọn chiều ngang**:
  - Tên: name + unit/base unit
  - Tồn: quantity + status tag
  - Giá: current price / base unit + brand + latest receiving (gộp vào 1 cột)
  - Actions: **Primary CTA “Nhập kho + giá”**, secondary “Xem”, menu cho sửa/xóa
- Mobile/tablet: chuyển sang **card list** + pagination, tránh table nhiều cột vỡ layout.
- “Chưa có giá”: dùng tag + CTA nổi bật.

### 4.2 Stock detail
- Chia nhỏ `StockItemDetailPage` thành các component theo nghiệp vụ:
  - `StockItemHeaderSummary`: nhìn nhanh tồn/giá/brand/lần nhập gần nhất
  - `StockPriceOverviewCard`: tab “Giá & nhập kho” ưu tiên CTA
  - `ReceiveWithPricingModal`: modal nhập kho + giá chuẩn hoá UX
  - `ReceivingLotsTable`: lịch sử nhập giá (table desktop, cards mobile)
  - `BrandCurrentPricingTable`: nhãn hàng + giá hiện tại theo brand (table/cards)
  - `StockItemOverviewTab`: thông tin tĩnh
- Thứ tự tab mới:
  - Giá & nhập kho
  - Lịch sử nhập giá
  - Nhãn hàng
  - Tổng quan
  - Lịch sử biến động
- CTA “Nhập kho + giá” luôn xuất hiện ở header + pricing tab.

### 4.3 Receive-with-pricing modal
- Layout theo sections:
  - Nguồn nhập (brand + tạo brand nhanh + supplier/invoice)
  - Số lượng (quantity/unit/receivedAt)
  - Giá nhập (before/after tax)
  - Preview (quy đổi base unit, đơn giá/base unit, tồn sau nhập)
- Mobile: modal full width + body scroll, nút thao tác dễ bấm.

### 4.4 Receiving lots
- Desktop table: các cột quan trọng (ngày, brand, số lượng, tổng sau thuế, đơn giá/base unit); cột phụ (supplier/invoice) chỉ hiện trên màn lớn.
- Mobile: card list, vẫn đọc được brand/qty/total/unit price + supplier/invoice.

### 4.5 Brand current pricing
- Tab/heading “Nhãn hàng” (không còn “Brands & Current Pricing”).
- Table/cards gọn, có CTA:
  - Thêm nhãn hàng
  - Nhập kho + giá theo nhãn hàng
  - Đặt ưu tiên / sửa / xoá

## 5. Responsive changes
- Page header wrap tốt, action buttons không tràn trên màn nhỏ.
- Stock list: card list dưới `md`, table có `scroll.x` trên desktop.
- Stock detail: summary grid wrap, tab không cần icon dài, table/card tuỳ breakpoint.
- Modal: `width=100%` trên mobile, body scroll, preview đọc nhanh.

## 6. i18n keys added/updated
- Added/updated (core):
  - `stock.list.currentPrice`, `stock.list.noPrice`, `stock.list.priceInfo`, `stock.list.receiveWithPricing`, `stock.list.latestReceivingEmpty`, `stock.list.unitAndBaseUnit`, `stock.list.empty`
  - `stock.detail.pricingAndReceiving`, `stock.detail.receiveWithPricing`, `stock.detail.currentPrice`, `stock.detail.currentPricePerBaseUnit`, `stock.detail.currentPriceBrand`, `stock.detail.latestReceiving`, `stock.detail.noPriceWarning`, `stock.detail.currentPriceExplain`, `stock.detail.brandsAndCurrentPricing`, `stock.detail.brandsCurrentPricingExplain`, `stock.detail.receivingLots`, `stock.detail.baseUnit`
- Added namespaces:
  - `stock.receive.*`
  - `stock.receivingLots.*`
  - `stock.brandPricing.*`

## 7. Tests executed
- `yarn workspace bakery-cms-web type-check`
- `yarn workspace bakery-cms-web test --run`
- `yarn workspace bakery-cms-web build`
- `yarn lint`

## 8. Test results
- `yarn workspace bakery-cms-web type-check`: PASS
- `yarn workspace bakery-cms-web test --run`: PASS
- `yarn workspace bakery-cms-web build`: PASS (Vite warnings tồn tại sẵn: empty LESS import + chunk size)
- `yarn lint`: PASS (có warnings tồn tại sẵn ở repo)

## 9. Bugs found during testing
- FE tests fail do mock i18n cũ trả về key/fallback, không hỗ trợ interpolation cho text mới.
- FE build fail do strict TS build với:
  - readonly array truyền vào AntD List
  - typing cho AntD Menu items
  - columns typing (Breakpoint[]) trong AntD Table
- Root lint fail do:
  - `eqeqeq` (dùng `!= null`)
  - `no-useless-escape` trong locale EN

## 10. Self-fixes applied
- Cập nhật mock `react-i18next` trong stock tests để dùng locale `vi` + interpolation đơn giản.
- Fix TS build:
  - spread readonly array khi truyền `dataSource` cho AntD List/Table
  - chuẩn hoá typing cho Menu items + ColumnsType
- Fix ESLint:
  - đổi `!= null` -> check `!== null && !== undefined`
  - bỏ escape `\"` không cần thiết trong string

## 11. Remaining risks
- `Grid.useBreakpoint()` trong unit tests phụ thuộc `matchMedia`; hiện suite pass nhưng responsive branch có thể khác trên môi trường khác nếu test setup thay đổi.
- Lint warnings tồn tại sẵn (API/Web/Storefront) ngoài scope task.

## 12. Next suggestions
- Thêm filter/sort cho “Giá”/“Nhập gần nhất” ở list (nếu backend hỗ trợ).
- Cho phép “Nhập kho + giá” ngay tại list mà không cần chuyển trang (tuỳ UX ưu tiên).
- Thêm KPI nhanh ở header (vd: “Giá lần gần nhất”, “Số lần nhập giá 30 ngày”).

## Self-fix log
### 1) FE tests failed (i18n mock)
- Failed command: `yarn workspace bakery-cms-web test --run`
- Error summary: không tìm thấy text data (brand/labels) vì `t()` trả về key
- Root cause: mock `useTranslation().t` chỉ dùng fallback/key, không đọc locale và không interpolate.
- Fix applied: mock t() đọc `vi` locale + interpolate `{{var}}`.
- Re-run result: PASS

### 2) FE build failed (strict TS build)
- Failed command: `yarn workspace bakery-cms-web build`
- Error summary: readonly array / Menu typing / Columns typing
- Root cause: `tsc -b` strict hơn và bắt các typing không chuẩn.
- Fix applied:
  - `dataSource={[...lots]}`
  - `MenuItem` typing + `ColumnsType<StockItem>`
- Re-run result: PASS

### 3) Root lint failed
- Failed command: `yarn lint`
- Error summary: `eqeqeq`, `no-useless-escape`
- Root cause: dùng `!= null` và escape dư trong locale EN.
- Fix applied: strict null checks + bỏ escape.
- Re-run result: PASS

