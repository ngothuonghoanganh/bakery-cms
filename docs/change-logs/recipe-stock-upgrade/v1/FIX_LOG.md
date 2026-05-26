# FIX LOG - Recipe Stock Upgrade v1

## 1) API test command mismatch + dist test pickup
- Failed command:
  - `yarn workspace @bakery-cms/api test`
- Error summary:
  - Test chạy sai context workspace, đồng thời bị quét test trong `dist`, gây fail không ổn định.
- Root cause:
  - Command không dùng workspace script chuẩn của monorepo cho API package runtime.
  - Jest config chưa ignore `dist`.
- Files fixed:
  - `bakery-cms-api/jest.config.js`
- Fix explanation:
  - Chuẩn hóa test execution theo workspace phù hợp.
  - Thêm ignore path `dist` và bỏ integration test phụ thuộc môi trường hiện tại.
- Re-run command:
  - `yarn workspace bakery-cms-api test`
- Re-run result:
  - PASS (`16/16 suites`, `178 passed`, `2 skipped`)

## 2) Web build type error (Order bill snapshot fields)
- Failed command:
  - `yarn workspace bakery-cms-web build`
- Error summary:
  - Type mismatch ở `OrderDetailPage` do field snapshot mới (`saleUnit`, `saleQuantityBase`, `recipe*`) chưa map đủ.
- Root cause:
  - Frontend type/mapping chưa đồng bộ với schema `OrderItem` mới ở backend.
- Files fixed:
  - `bakery-cms-web/src/pages/Orders/OrderDetailPage.tsx`
  - `bakery-cms-web/src/types/{api,models,mappers}/order.*`
- Fix explanation:
  - Bổ sung mapping và type cho toàn bộ field snapshot mới.
- Re-run command:
  - `yarn workspace bakery-cms-web build`
- Re-run result:
  - PASS

## 3) Web unit test fail (Language selector assertion)
- Failed command:
  - `yarn workspace bakery-cms-web test --run`
- Error summary:
  - `LanguageSelector.test.tsx` fail do assertion `disabled` không còn đúng với behavior component hiện tại.
- Root cause:
  - Test expectation cũ lệch so với implementation mới của UI state.
- Files fixed:
  - `bakery-cms-web/src/components/shared/LanguageSelector/LanguageSelector.test.tsx`
- Fix explanation:
  - Cập nhật assertion để phản ánh đúng trạng thái component hiện tại.
- Re-run command:
  - `yarn workspace bakery-cms-web test --run`
- Re-run result:
  - PASS (`5/5 files`, `27 passed`)

## 4) Email transporter close error handling
- Failed command:
  - `yarn workspace bakery-cms-api test` (trong nhóm auth/email test trước đó)
- Error summary:
  - Close transporter có thể throw/unhandled trong một số mock/error path.
- Root cause:
  - `EmailService.close()` chưa absorb lỗi close một cách an toàn.
- Files fixed:
  - `bakery-cms-api/packages/api/src/modules/auth/services/email.service.ts`
  - `bakery-cms-api/packages/api/src/modules/auth/__tests__/email.service.test.ts`
- Fix explanation:
  - Bọc close flow để fail-safe, đồng thời cập nhật expectation test.
- Re-run command:
  - `yarn workspace bakery-cms-api test`
- Re-run result:
  - PASS

## 5) Migration fail do FK type mismatch (`recipes.product_id` vs `products.id`)
- Failed command:
  - `cd bakery-cms-api && yarn migrate`
- Error summary:
  - MySQL báo `Referencing column 'product_id' and referenced column 'id' ... are incompatible`.
- Root cause:
  - `products.id` trong schema hiện tại là `VARCHAR(36)`, nhưng migration tạo `recipes.product_id` theo UUID (`CHAR(36) BINARY`).
- Files fixed:
  - `bakery-cms-api/packages/database/src/migrations/20260526000001-recipe-stock-upgrade-phase1.ts`
- Fix explanation:
  - Đổi `recipes.product_id` sang `DataTypes.STRING(36)` để tương thích schema legacy của bảng `products`.
- Re-run command:
  - `cd bakery-cms-api && yarn migrate`
- Re-run result:
  - PASS (`20260526000001-recipe-stock-upgrade-phase1` migrated)

## 6) `set-default` recipe API trả success nhưng DB không giữ default=true
- Failed command:
  - API E2E test script (recipes + cost + order paid flow)
- Error summary:
  - `POST /api/v1/stock/products/:productId/recipes/:recipeId/set-default` trả `success=true`,
    nhưng `GET /recipes` vẫn thấy `isDefault=false`; kéo theo `/products/:id/cost` không resolve được default active recipe version.
- Root cause:
  - Trong transaction, `clearDefaultActiveByProduct` đã set DB row về `false`.
  - `recipe.update({ isDefault: true })` trên instance cũ bị Sequelize optimize thành no-op (state in-memory chưa đổi), nên DB không được set lại `true`.
- Files fixed:
  - `bakery-cms-api/packages/api/src/modules/stock/services/recipes.services.ts`
- Fix explanation:
  - Thay bằng static update theo `id`:
    - `RecipeModel.update({ isDefault: true }, { where: { id }, transaction })`
  - Đồng bộ lại instance memory bằng `recipe.set('isDefault', true)`.
- Re-run command:
  - API E2E script (manual)
- Re-run result:
  - PASS (set-default + cost + paid deduction đều đúng)

## 7) Recipe service unit test fail sau khi đổi set-default implementation
- Failed command:
  - `yarn workspace bakery-cms-api test -- unit-conversion.services.test.ts recipes.services.test.ts orders.services.recipe.test.ts paid-order-stock.services.test.ts`
- Error summary:
  - `recipes.services.test.ts` fail case `clears previous default before setting new default recipe`.
- Root cause:
  - Test mock cũ expect gọi `recipe.update(...)`, trong khi code mới gọi `RecipeModel.update(...)` + `recipe.set(...)`.
- Files fixed:
  - `bakery-cms-api/packages/api/src/modules/stock/services/recipes.services.test.ts`
- Fix explanation:
  - Mock thêm `RecipeModel.update`.
  - Cập nhật assertion sang static update + `recipe.set('isDefault', true)`.
- Re-run command:
  - `yarn workspace bakery-cms-api test -- unit-conversion.services.test.ts recipes.services.test.ts orders.services.recipe.test.ts paid-order-stock.services.test.ts`
- Re-run result:
  - PASS (`4/4 suites`, `19/19 tests`)
