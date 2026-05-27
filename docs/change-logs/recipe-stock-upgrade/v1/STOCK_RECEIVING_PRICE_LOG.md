# STOCK_RECEIVING_PRICE_LOG (v1)

## 1. Summary
- Added **stock receiving lots** to persist **per-receive pricing history** (price at time of receiving).
- Added backend APIs to **receive stock with pricing** and **query receiving lots history**.
- Updated stock item **list + detail UI** so users can see **current/latest price** immediately (list + header), and can open **“Nhập kho + giá”** modal to record a new priced receiving.
- Added backend + frontend tests for the new flow.

## 2. Why this change is needed
Current “brand current pricing” only stores **latest/current** price per brand, which is not enough for real stock operations:
- Each receiving can have different price (e.g. 2026-05-26: 90,000đ/kg; 2026-05-27: 100,000đ/kg).
- Price history per receiving is required for later phases (FIFO / weighted average / batch costing).
- Users need to see **price visibility** in list/detail without hunting inside brand tab.

## 3. Backend changes
- New Sequelize model: `stock_receiving_lots` (paranoid).
- New stock service methods:
  - `receiveWithPricing(...)`:
    - validates stock item + brand
    - validates price rules (afterTax >= beforeTax, >= 0)
    - validates unit compatibility and converts to base unit
    - creates `stock_receiving_lots`
    - increments `stock_items.currentQuantity` (base quantity)
    - creates `stock_movements` type `received` with **cost snapshot**
    - updates/creates `stock_item_brands` current/latest price for that brand
  - `getReceivingLots(...)` paginated history with filters.
- Stock item list & detail responses now include:
  - `priceSummary` (preferred/latest brand + latest receiving context)
  - `latestReceivingLot` (detail)

## 4. Frontend changes
- Stock list shows new columns:
  - current quantity, current price, price brand, latest receiving date, status, actions
  - displays Tag **“Chưa có giá”** when no price exists
- Stock item detail page refactor:
  - header shows: name, current stock, current price, price brand, latest receiving
  - new tab order prioritizing pricing/receiving
  - “Lịch sử nhập giá” tab renders real receiving lots from API with brand/date filters
- Replaced “Nhập kho” modal with **“Nhập kho + giá”**:
  - required brand, quantity + unit, price before/after tax, receivedAt, supplier/invoice/note
  - preview shows unit conversion, unit price per base unit, stock-after-receive

## 5. New APIs
- `POST /api/v1/stock/stock-items/:id/receive-with-pricing`
  - creates receiving lot + stock movement + updates brand pricing snapshot
- `GET /api/v1/stock/stock-items/:id/receiving-lots`
  - returns paginated receiving lots history (filters: brand/date range)
- Updated response shape for:
  - `GET /api/v1/stock/stock-items` (adds `priceSummary`)
  - `GET /api/v1/stock/stock-items/:id` (adds `priceSummary`, `latestReceivingLot`)

## 6. Database migrations
- Added migration: `bakery-cms-api/packages/database/src/migrations/20260527000002-stock-receiving-lots.ts`
  - creates `stock_receiving_lots` with indexes:
    - `stockItemId`, `brandId`, `receivedAt`, `(stockItemId, brandId)`
  - extends `stock_movements.costing_method` enum to support:
    - `receiving_lot_price`
    - `latest_receiving_price`

## 7. UI/UX changes
- Stock list now surfaces “has price / no price” immediately.
- Stock detail prioritizes pricing via:
  - first tab “Giá & nhập kho”
  - primary action “Nhập kho + giá”
- “Nhãn hàng & giá hiện tại” wording clarifies it is **latest/current per brand**, updated on priced receiving.

## 8. Stock receiving lot rules
1. `brandId` required.
2. `receivedQuantity > 0`.
3. `priceBeforeTax >= 0`.
4. `priceAfterTax >= 0`.
5. Reject `priceAfterTax < priceBeforeTax`.
6. `receivedQuantityBase` converted via unit conversion rules (weight/volume/piece).
7. `unitPriceBeforeTax = priceBeforeTax / receivedQuantityBase`.
8. `unitPriceAfterTax = priceAfterTax / receivedQuantityBase`.
9. `remainingQuantityBase` initially equals `receivedQuantityBase`.
10. `receivedAt` defaults to now if not provided.
11. No automatic backfill/fake historical lots from `stock_item_brands`.

## 9. Price summary rules
- “Current price” uses `latestUnitPriceAfterTax` per base unit when available.
- “Price brand” displays `latestPriceBrandName` (fallback to preferred brand when needed).
- “Latest receiving” displays `latestReceivedAt` if any lot exists.
- If no lot/brand price exists => `hasPrice=false` and UI shows **“Chưa có giá”**.

## 10. Tests executed
Backend:
- `yarn workspace bakery-cms-api type-check`
- `yarn workspace bakery-cms-api test`
- `yarn workspace bakery-cms-api build`
 - `cd bakery-cms-api && yarn migrate`
 - `cd bakery-cms-api && yarn seed`

Frontend:
- `yarn workspace bakery-cms-web type-check`
- `yarn workspace bakery-cms-web test --run`
- `yarn workspace bakery-cms-web build`

Root:
- `yarn lint`
- `yarn build`

## 11. Test results
- All commands above executed successfully (warnings present in lint/build, but exit code = 0).
- Note: `bakery-storefront-web` build prints repeated `fetch failed (ECONNREFUSED)` during static generation, but build still completes successfully.
- Manual smoke test (real API + real DB): created brand + stock item, called `receive-with-pricing`, verified:
  - stock quantity increased
  - list/detail include `priceSummary`
  - detail includes `latestReceivingLot`
  - receiving lots history endpoint returns the lot

## 12. Bugs found during testing
- FE tests: selector/regex issues caused failing tests when multiple “Nhập kho + giá” buttons exist.
- FE build: strict TS errors due to:
  - matcher function returning `boolean | undefined`
  - unused imports/vars
  - readonly array assigned into state setter
  - `FileUpload.accept` prop typed as union (`image|all|video`)
- API build: `noImplicitAny` error from a Jest test referencing a variable inside its own initializer.
- Root lint: ESLint errors due to missing curly braces in test code and unnecessary escape characters in FE test title.
- DB migrate: MySQL FK error `created_by_user_id` incompatible with `users.id`.
- DB seed: `yarn seed` failed because `products.product_code` is required but `seed-products` does not provide it (legacy seed drift).

## 13. Self-fixes applied
- Stabilized RTL tests by:
  - fixing regex literal escaping for `+`
  - scoping selection to avoid ambiguous matches
  - targeting AntD Select dropdown option nodes reliably
- Adjusted FE code for strict TS build:
  - removed unused import/vars
  - copied receiving lots array before setting state
  - changed `FileUpload.accept` to `"image"`
- Fixed backend test typing + lint style:
  - avoided self-referential initializer pattern
  - added curly braces for ESLint `curly`

## 14. Remaining risks
- Stock receiving + movement + brand price updates are not wrapped in a single DB transaction in all environments; concurrency/race conditions should be reviewed if multiple users receive the same item simultaneously.
- “Current price” is based on **latest receiving lot** or brand current price fallback; future costing methods (FIFO/weighted average) may require richer summary strategy.
- `bakery-storefront-web` build attempts network `fetch` during SSG; local CI/CD without API may keep printing `ECONNREFUSED` (though build currently succeeds).

## 15. Next phase suggestions
- Implement FIFO consumption using `stock_receiving_lots.remainingQuantityBase`.
- Implement weighted average costing for consumption.
- Add production batch + batch-level costing snapshots.
- Add finished goods inventory.
- Add stock consumption request approval workflow (especially for large adjustments).

## Self-fix log

### 1) FE tests failed (ambiguous button selectors / wrong regex)
- Failed command: `yarn workspace bakery-cms-web test --run`
- Error summary: cannot find or finds multiple “Nhập kho + giá” buttons.
- Root cause: regex used `/Nhập kho \\+ giá/i` (matched backslashes), and queries assumed the button was unique.
- Fix applied: change to `/Nhập kho \+ giá/i` (match literal `+`), switch to `findAllByRole` + scoped queries (modal `within(dialog)`, AntD Select option matcher).
- Re-run command: `yarn workspace bakery-cms-web test --run`
- Re-run result: pass.

### 2) FE build failed (strict TS errors)
- Failed command: `yarn workspace bakery-cms-web build`
- Error summary: matcher function type mismatch, unused vars, readonly lots state, invalid `FileUpload.accept` type.
- Root cause: TS build includes test files + strict checks and wrapper prop typing.
- Fix applied: ensure matcher returns boolean, remove unused import/vars, spread `lots` into state, set `accept="image"`.
- Re-run command: `yarn workspace bakery-cms-web build`
- Re-run result: pass.

### 3) API build failed (noImplicitAny in test)
- Failed command: `yarn workspace bakery-cms-api build`
- Error summary: self-referential `stockItem` initializer inferred as `any`.
- Root cause: `update` mock referenced `stockItem` inside the object literal initializer.
- Fix applied: declare `stockItem: any` then assign `stockItem.update` after initialization.
- Re-run command: `yarn workspace bakery-cms-api build`
- Re-run result: pass.

### 4) Root lint failed (ESLint errors in new tests)
- Failed command: `yarn lint`
- Error summary: `curly` errors in backend test + `no-useless-escape` in FE test title.
- Root cause: missing braces in `if (...) return;` and unnecessary escaping in string literal.
- Fix applied: add curly braces; remove unnecessary escapes.
- Re-run command: `yarn lint`
- Re-run result: pass.

### 5) DB migration failed (FK type mismatch)
- Failed command: `cd bakery-cms-api && yarn migrate`
- Error summary: `Referencing column 'created_by_user_id' and referenced column 'id' ... are incompatible.`
- Root cause: legacy `users.id` is stored as `CHAR(36)` while the new migration created `created_by_user_id` as UUID (`CHAR(36) BINARY`), which is incompatible for MySQL FK.
- Fix applied: change `created_by_user_id` type to `CHAR(36)` in migration + align model field type to `DataTypes.CHAR(36)`.
- Re-run command: `cd bakery-cms-api && yarn migrate`
- Re-run result: pass.

### 6) DB seed failed (legacy seed drift)
- Failed command: `cd bakery-cms-api && yarn seed`
- Error summary: `Field 'product_code' doesn't have a default value`.
- Root cause: `seed-products` seeder does not include `product_code` after schema changes.
- Fix applied: updated `bakery-cms-api/packages/database/src/seeders/20251216000001-seed-products.ts` to include unique `product_code` values.
- Re-run command: `cd bakery-cms-api && yarn seed`
- Re-run result: pass.
