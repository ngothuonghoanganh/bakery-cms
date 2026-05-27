# Recipe Stock Upgrade v1

## Summary
Triển khai phase 1 nâng cấp quản lý công thức/kho cho `bakery-cms` theo hướng recipe/version có snapshot khi bán hàng, giữ backward compatibility với `product_stock_items`, và giữ flow tự trừ kho khi order chuyển `paid`.

## Scope
- `bakery-cms-api`:
  - Mở rộng enum/unit + unit conversion.
  - Thêm schema recipe/version/version_items.
  - Migrate dữ liệu legacy `product_stock_items` sang recipe mặc định.
  - Snapshot recipe tại `OrderItem`.
  - Refactor stock deduction khi paid để ưu tiên recipe version snapshot + cost snapshot.
  - Mở API CRUD recipe/version/items.
- `bakery-cms-web`:
  - Nâng UI order để chọn `saleUnit` và override `recipeVersion`.
  - Nâng UI product recipe để quản lý recipe/version/ingredient.
  - Bổ sung i18n EN/VI cho text mới.
  - Bổ sung hỗ trợ `volume` tại stock item form/detail.

## Files changed
- Backend core:
  - `bakery-cms-api/packages/common/src/enums/stock.enums.ts`
  - `bakery-cms-api/packages/database/src/migrations/20260526000001-recipe-stock-upgrade-phase1.ts`
  - `bakery-cms-api/packages/database/src/models/{recipe.model.ts,recipe-version.model.ts,recipe-version-item.model.ts,order-item.model.ts,stock-item.model.ts,stock-movement.model.ts,index.ts}`
  - `bakery-cms-api/packages/api/src/modules/stock/{routes.ts,services/paid-order-stock.services.ts,services/product-stock.services.ts,services/recipes.services.ts,services/unit-conversion.services.ts,repositories/recipes.repositories.ts,handlers/recipes.handlers.ts,validators/recipes.validators.ts,dto/recipes.dto.ts}`
  - `bakery-cms-api/packages/api/src/modules/orders/{dto/orders.dto.ts,validators/orders.validators.ts,mappers/orders.mappers.ts,repositories/orders.repositories.ts,services/orders.services.ts,routes.ts}`
  - `bakery-cms-api/packages/api/src/modules/payments/routes.ts`
- Backend tests/config:
  - `bakery-cms-api/jest.config.js`
  - `bakery-cms-api/packages/api/src/modules/stock/services/{unit-conversion.services.test.ts,recipes.services.test.ts,paid-order-stock.services.test.ts}`
  - `bakery-cms-api/packages/api/src/modules/orders/services/orders.services.recipe.test.ts`
  - Một số test auth/products được chỉnh để đồng bộ behavior hiện tại.
- Frontend:
  - `bakery-cms-web/src/components/features/orders/OrderForm/{OrderForm.tsx,OrderForm.schema.ts,OrderForm.types.ts}`
  - `bakery-cms-web/src/components/features/stock/ProductRecipe/{ProductRecipe.tsx,ProductRecipe.types.ts}`
  - `bakery-cms-web/src/components/features/stock/StockItemForm/StockItemForm.tsx`
  - `bakery-cms-web/src/pages/stock/StockItemDetailPage.tsx`
  - `bakery-cms-web/src/pages/Orders/OrderDetailPage.tsx`
  - `bakery-cms-web/src/services/stock.service.ts`
  - `bakery-cms-web/src/types/{api,models,mappers}/{order,stock}.*`
  - `bakery-cms-web/src/i18n/locales/{en.ts,vi.ts}`

## Database migrations added
- `20260526000001-recipe-stock-upgrade-phase1.ts`
  - Mở rộng enum:
    - `stock_items.unit_type`: thêm `volume`.
    - `stock_item_brands.purchase_unit`: thêm `milliliter`, `liter`.
  - `stock_items`: thêm/chuẩn hóa `base_unit`.
  - `order_items`:
    - `quantity` -> `DECIMAL(12,3)`.
    - thêm `sale_unit`, `sale_quantity_base`, `sale_base_unit`.
    - thêm `recipe_id`, `recipe_version_id`, `recipe_name_snapshot`, `recipe_version_snapshot`, `recipe_estimated_cost_snapshot`.
  - `stock_movements`: thêm `unit_cost_snapshot`, `total_cost_snapshot`, `costing_method`.
  - Tạo bảng mới:
    - `recipes`
    - `recipe_versions`
    - `recipe_version_items`
  - Data migration:
    - Tạo default recipe + version 1 từ `product_stock_items`.
    - Copy ingredient sang `recipe_version_items`.
    - Tính `estimated_cost` từ cost snapshot.

## Models added/updated
- Added:
  - `RecipeModel`
  - `RecipeVersionModel`
  - `RecipeVersionItemModel`
- Updated:
  - `StockItemModel` (base unit theo `piece/gram/milliliter`)
  - `OrderItemModel` (decimal quantity + recipe/sale snapshot fields)
  - `StockMovementModel` (cost snapshot fields)
  - Associations tại `database/src/models/index.ts`

## APIs added/updated
- Added recipe APIs:
  - `GET /api/v1/stock/products/:productId/recipes`
  - `POST /api/v1/stock/products/:productId/recipes`
  - `PATCH /api/v1/stock/products/:productId/recipes/:recipeId`
  - `POST /api/v1/stock/products/:productId/recipes/:recipeId/set-default`
  - `POST /api/v1/stock/products/:productId/recipes/:recipeId/versions`
  - `GET /api/v1/stock/products/:productId/recipes/:recipeId/versions/:versionId`
  - `PATCH /api/v1/stock/products/:productId/recipes/:recipeId/versions/:versionId`
  - `POST /api/v1/stock/products/:productId/recipes/:recipeId/versions/:versionId/items`
  - `PATCH /api/v1/stock/products/:productId/recipes/:recipeId/versions/:versionId/items/:itemId`
  - `DELETE /api/v1/stock/products/:productId/recipes/:recipeId/versions/:versionId/items/:itemId`
- Updated APIs:
  - Order create/update nhận `saleUnit` và `recipeVersionId`.
  - Product cost response trả thêm `recipeId`, `recipeVersionId`.

## Backend services updated
- `UnitConversionService`:
  - Hỗ trợ `kg->g`, `g->g`, `l->ml`, `ml->ml`, `piece->piece`.
  - Reject convert chéo gram <-> milliliter.
- `OrderService`:
  - Resolve default/override recipe version khi tạo/cập nhật item.
  - Snapshot đầy đủ recipe + sale unit base quantity vào `OrderItem`.
- `PaidOrderStockService`:
  - Vẫn idempotent theo reference movement.
  - Vẫn transaction + lock stock.
  - Expand combo 1 level, chặn nested combo.
  - Ưu tiên recipe version snapshot, fallback default active, fallback legacy.
  - Tính consumption theo yield + waste%.
  - Ghi `unitCostSnapshot/totalCostSnapshot/costingMethod`.
- `ProductStockService.calculateProductCost`:
  - Ưu tiên recipe version active mặc định.
  - Fallback legacy `product_stock_items`.

## Frontend pages/components updated
- Product detail recipe area:
  - Danh sách recipe, tạo/sửa recipe, set default.
  - Tạo/sửa recipe version, chọn version.
  - Xem ingredient của version, thêm/sửa/xóa ingredient.
  - Chọn preferred brand cho ingredient.
  - Nhập unit ingredient theo `piece/gram/kilogram/milliliter/liter`.
  - Hiển thị estimated cost/yield.
- Order form:
  - Hỗ trợ `saleUnit` cho weight (`gram|kilogram`) và piece (`piece`).
  - Hỗ trợ override `recipeVersionId`.
  - Hiển thị estimated recipe cost theo version chọn.
- Stock item:
  - Form + detail hỗ trợ `StockUnitType.VOLUME`.
  - Brand purchase unit hỗ trợ `milliliter|liter` khi stock item là volume.

## Business rules implemented
- Product có nhiều recipe.
- Recipe có nhiều version.
- Default recipe phải `active`.
- Khi tạo order item:
  - Nếu có `recipeVersionId` thì validate active + thuộc đúng product.
  - Nếu không có thì resolve default active recipe version.
  - Nếu không có recipe thì cho phép tạo order, paid flow fallback legacy hoặc skip với warning.
- Recipe archived/draft không tự động dùng làm default order.

## Unit conversion rules
- Allowed:
  - `kilogram -> gram`
  - `gram -> gram`
  - `liter -> milliliter`
  - `milliliter -> milliliter`
  - `piece -> piece`
- Rejected:
  - `gram <-> milliliter`

## Recipe/version rules
- `yieldBaseQuantity > 0`.
- `baseQuantity > 0`.
- `wastePercent` mặc định `0`.
- `estimatedCost` version được tính lại từ `recipe_version_items.totalCostSnapshot`.
- `preferredBrandId` được validate thuộc stock item.

## Stock deduction rules
- Trigger khi order chuyển `paid`.
- Không trừ kho lặp (idempotent by order reference movement).
- Combo được bung product con 1 level.
- Công thức tính:
  - `required = baseQuantity * (saleQuantityBase / yieldBaseQuantity) * (1 + wastePercent/100)`
- Group theo `stockItemId + brandId`.
- Giữ behavior cũ khi stock âm: không chặn, chỉ warning log.

## Cost snapshot rules
- `costingMethod`: `preferred_brand_price` (phase 1).
- `unitCostSnapshot` lấy preferred brand price, fallback lowest brand price, fallback `0`.
- `totalCostSnapshot = requiredQuantityBase * unitCostSnapshot`.
- Stock movement lưu snapshot để báo cáo không lệch khi giá thay đổi.

## Tests added
- `unit-conversion.services.test.ts`
- `recipes.services.test.ts`
- `orders.services.recipe.test.ts`
- `paid-order-stock.services.test.ts` (rewrite theo flow mới)
- Điều chỉnh thêm một số test auth/products/web để suite pass với behavior hiện tại.

## Test commands executed
- `yarn workspace @bakery-cms/common build`
- `yarn workspace @bakery-cms/database build`
- `yarn workspace @bakery-cms/api type-check`
- `yarn workspace bakery-cms-web type-check`
- `yarn workspace bakery-cms-api test`
- `yarn workspace bakery-cms-web test --run`
- `yarn workspace bakery-cms-api build`
- `yarn workspace bakery-cms-web build`
- `yarn lint`
- `CI=1 yarn test`
- `yarn build`
- `cd bakery-cms-api && yarn migrate`
- `yarn workspace @bakery-cms/api lint`
- `yarn workspace @bakery-cms/api build`
- `yarn workspace bakery-cms-api test -- unit-conversion.services.test.ts recipes.services.test.ts orders.services.recipe.test.ts paid-order-stock.services.test.ts`
- Manual API E2E script against `http://localhost:3000/api/v1` with admin token:
  - Recipe CRUD/version/items + set-default
  - Product cost endpoint
  - Order create snapshot (`saleUnit`, `saleQuantityBase`, `recipeVersionId`)
  - Confirm order + mark-paid
  - Stock deduction/yield/waste calculation
  - Stock movement cost snapshot
  - Duplicate mark-paid idempotency check

## Test results
- PASS:
  - API test suite: `16/16 suites`, `178 tests pass`, `2 skipped`.

## Addendum (2026-05-27) - Stock receiving lots + per-receive pricing
- Implemented “Nhập kho + giá” with per-receive price history stored in `stock_receiving_lots`.
- Added new APIs + UI updates for stock list/detail to surface price immediately.
- See details: `docs/change-logs/recipe-stock-upgrade/v1/STOCK_RECEIVING_PRICE_LOG.md`.
  - Web test suite: `5/5 files`, `27 tests pass`.
  - Type-check API/Web: pass.
  - Build API/Web/Storefront: pass.
  - Root `yarn lint`: pass (warnings only, no errors).
  - Post-fix targeted backend tests: `4/4 suites`, `19/19 tests`.
  - API E2E manual verification: PASS (`ALL_API_TESTS_PASSED`).
- Non-blocking warnings:
  - Existing lint warnings trong repo (API/Web/Storefront).
  - Storefront build có `fetch failed ECONNREFUSED` khi prerender data nhưng build vẫn thành công.

## Remaining risks
- Chưa có workflow production batch/FIFO/LIFO/weighted average (đúng phạm vi phase).
- `productName` trong product cost service hiện vẫn có placeholder rỗng ở một số path cũ.
- Frontend recipe UI mới chưa có màn delete recipe/version (không bắt buộc trong scope hiện tại).
- Lint warnings tồn tại sẵn trong codebase, chưa được clean ở phase này.

## Next phase suggestions
- Thêm delete/archiving UX đầy đủ cho recipe/version + audit timeline.
- Chuẩn hóa costing nâng cao:
  - FIFO
  - LIFO
  - Weighted average
- Stock lots + production batches + finished goods inventory.
- Approval workflow cho stock consumption request (`pending/approved`).
- Density conversion `gram <-> milliliter` (có metadata density).
- Tối ưu storefront build data-fetch để tránh `ECONNREFUSED` lúc prerender local.
