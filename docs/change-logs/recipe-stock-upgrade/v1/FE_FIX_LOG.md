# FE Fix Log - Recipe Stock Upgrade v1

## 1. Summary
- Fixed continuous API call loops in `OrderForm` and unstable fetch patterns in `ProductRecipe`/stock hooks.
- Reduced unnecessary API calls by introducing stable dependency keys, request dedupe, and targeted cache invalidation.
- Refactored recipe UX for bakery operators: summary-first recipe view, ingredient-centered workflow, and advanced version management in collapsible section.
- Refactored stock item detail UX into clearer operational tabs and improved brand price conversion preview.

## 2. Root cause analysis
### API loop root cause
- `OrderForm` used `useEffect` dependency on full `items` object and a `loadRecipeOptions` callback that depended on mutable cache/loading state (`recipeOptionsByProductId`, `loadingRecipesByProductId`).
- `loadRecipeOptions` updated those same state objects, causing callback identity changes and repeated effect re-triggers.
- `ProductRecipe` had broad refetch behavior (`recipes + cost + version detail`) after most CRUD actions, causing unnecessary API pressure.
- Brand fetch for ingredient modal lacked explicit request/cache dedupe and could refetch excessively.
- Fetch hooks (`useStockItems`, `useBrands`, `useProducts`) relied on basic object-stringify tracking without explicit fetch key dedupe behavior.

### Files/components involved
- `bakery-cms-web/src/components/features/orders/OrderForm/OrderForm.tsx`
- `bakery-cms-web/src/components/features/stock/ProductRecipe/ProductRecipe.tsx`
- `bakery-cms-web/src/pages/stock/StockItemDetailPage.tsx`
- `bakery-cms-web/src/hooks/useStockItems.ts`
- `bakery-cms-web/src/hooks/useBrands.ts`
- `bakery-cms-web/src/hooks/useProducts.ts`

## 3. Files changed
- `bakery-cms-web/src/components/features/orders/OrderForm/OrderForm.tsx`
- `bakery-cms-web/src/components/features/stock/ProductRecipe/ProductRecipe.tsx`
- `bakery-cms-web/src/pages/stock/StockItemDetailPage.tsx`
- `bakery-cms-web/src/hooks/useStockItems.ts`
- `bakery-cms-web/src/hooks/useBrands.ts`
- `bakery-cms-web/src/hooks/useProducts.ts`
- `bakery-cms-web/src/utils/stable-key.utils.ts` (new)
- `bakery-cms-web/src/utils/recipe-events.ts` (new)

## 4. API call optimizations
### Before
- `OrderForm` fetched recipe options with effect dependency on `items` and callback dependencies on mutable cache states, which could trigger repeated recipe API calls.
- No dedicated in-flight dedupe map for recipe option requests in order form.
- `ProductRecipe` reloaded `recipes + cost + detail` after many actions even when only one part needed refresh.
- Ingredient brand fetching did not have a robust in-flight/cache ref dedupe layer.
- Data hooks auto-fetch could be retriggered without explicit request key dedupe strategy.

### After
- `OrderForm` now uses stable `productIdsKey` derived from selected product IDs, not full `items` object.
- `OrderForm` recipe fetch now uses refs:
  - `recipeOptionsCacheRef`
  - `loadingRecipeProductIdsRef`
  - `inFlightRecipeRequestsRef`
- `OrderForm` blocks API calls when product is empty/cached/loading/in-flight.
- Added targeted recipe cache invalidation via `recipe-events` so only affected product cache is invalidated/refetched.
- `ProductRecipe` split refresh responsibilities:
  - detail-only refresh when needed
  - recipes refresh for summary changes
  - cost refresh only when relevant for selected/default cost path
- Ingredient brand fetch in `ProductRecipe` now runs only when modal is open and stock item is selected, with cache + in-flight dedupe.
- `useStockItems` / `useBrands` / `useProducts` now use stable request keys and skip redundant auto-fetch when key is unchanged and data already loaded.

## 5. UX improvements
### Recipe management
- Added recipe summary-first layout:
  - recipe name
  - default/active tags
  - yield and base yield
  - estimated cost
  - ingredient count
  - quick actions (edit recipe, create version from current, set default)
- Ingredient table is now central workflow with explicit columns:
  - ingredient
  - quantity
  - unit
  - base quantity/unit
  - preferred brand
  - waste %
  - unit cost
  - total cost
- Added warning UI when ingredient has no brand pricing (cost temporarily 0).
- Added preferred brand price preview in ingredient modal.
- Added advanced version management section using collapse (recipe list + version list + select/edit).
- Added smart empty-state CTA: create default recipe + version 1 and jump into add ingredient flow.

### Stock/material management
- Refactored `StockItemDetailPage` tabs to operational layout:
  - Giá & nhập kho
  - Tổng quan
  - Lịch sử nhập giá
  - Lịch sử biến động kho
- Overview now explicitly shows base unit in detail section.
- Per-receiving lot price history is implemented via `stock_receiving_lots` (no fake/backfill history).

### Brand pricing
- Improved brand price modal preview with conversion lines:
  - purchase spec to total price
  - converted unit price per base unit
- Added explicit purchase unit compatibility validator for stock item type.

## 6. Tests executed
- `yarn workspace bakery-cms-web type-check`
- `yarn workspace bakery-cms-web test --run`
- `yarn workspace bakery-cms-web build`
- `yarn lint`

## 7. Test results
- `yarn workspace bakery-cms-web type-check`: PASS
- `yarn workspace bakery-cms-web test --run`: PASS (`5/5` files, `27/27` tests)
- `yarn workspace bakery-cms-web build`: PASS (with existing non-blocking Vite warnings: empty LESS import, large chunk warnings)
- `yarn lint`: PASS with existing repository warnings (API/Web/Storefront warnings only, no errors)

## 8. Bugs found during testing
- Build failed once due unused icon import in `ProductRecipe.tsx`.

## 9. Auto-fixes applied
- Removed unused `DollarOutlined` import causing TS build failure.
- Re-ran build and full required command set successfully.

## 10. Remaining risks
- Current recipe event invalidation is frontend event-based and depends on mutation paths dispatching `recipe-events`.
- Product recipe UI still does not implement full version/recipe archival workflows beyond current scope.
- Price history timeline is intentionally not implemented (phase-limited), only current brand price is shown.
- Existing monorepo lint warnings remain outside this task scope.

## 11. Next phase proposal
- Add advanced costing methods:
  - FIFO
  - Weighted average
- Add production batch and finished goods inventory workflow.
  - Receiving lots are now the base for FIFO/weighted average (see `STOCK_RECEIVING_PRICE_LOG.md`).

## 12. Update (2026-05-27) - Receiving lots + pricing
- Implemented “Nhập kho + giá” with real receiving lots history; details in `docs/change-logs/recipe-stock-upgrade/v1/STOCK_RECEIVING_PRICE_LOG.md`.

## Add Ingredient stock item select fix
### Root cause
- `ProductRecipe` relied on `stockItems` list from hook state but did not actively ensure fetch when opening Add Ingredient modal.
- After API-loop optimization, stock items loading became lazy-sensitive and modal flow could open while `stockItems` was still `null`, resulting in empty Select options.
- `useStockItems` skip logic only checked request key + loaded flag, which was not explicit enough for `null` data / failed previous request scenarios.

### Files changed
- `bakery-cms-web/src/components/features/stock/ProductRecipe/ProductRecipe.tsx`
- `bakery-cms-web/src/hooks/useStockItems.ts`

### API behavior before
- Opening Add Ingredient modal could show empty stock item list without triggering `/stock/stock-items` in that user path.
- No modal-specific guard to load stock items when data was not ready.

### API behavior after
- `ProductRecipe` now uses `useStockItems({ pagination: { limit: 200 }, autoFetch: false })` and triggers guarded fetch through `ensureStockItemsLoaded()` when ingredient modal opens.
- Fetch is deduped with refs:
  - `stockItemsRequestedRef`
  - `stockItemsInFlightRef`
- No re-fetch when stock items are already loaded, currently loading, or an in-flight request exists.
- `useStockItems` skip logic now only skips redundant auto-fetch when:
  - same request key has successful load
  - current data is not `null`
  - request key is not marked failed

### Network verification
- Trigger point: open Product Detail -> Recipe -> Add Ingredient when stock items are not loaded yet.
- Expected/implemented behavior:
  - exactly one request to `/stock/stock-items?...` is fired for initial modal-open load
  - closing/opening modal again does not trigger repeated fetch while cached data is still valid
  - no per-render fetch loop because modal effect is guarded by loaded/loading/in-flight checks

### Tests executed
- `yarn workspace bakery-cms-web type-check`
- `yarn workspace bakery-cms-web test --run`
- `yarn workspace bakery-cms-web build`

### Test results
- `type-check`: PASS
- `test --run`: PASS (`5/5` files, `27/27` tests)
- `build`: PASS (existing non-blocking warnings remain)

### Remaining risks
- Current stock item fetch for Add Ingredient is modal-driven and does not yet include explicit TTL invalidation policy.
- If stock items are updated elsewhere while modal remains open, user may need reopen or manual refresh path in future enhancement.

## Self-fix log
- Failed command: `yarn workspace bakery-cms-web build`
- Error summary: TS6133 unused import `DollarOutlined` in `ProductRecipe.tsx`
- Root cause: leftover icon import after UI refactor
- Fix applied: removed unused import
- Re-run command: `yarn workspace bakery-cms-web build`
- Re-run result: PASS
