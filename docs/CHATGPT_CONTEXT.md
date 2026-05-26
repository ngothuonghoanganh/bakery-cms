# Bakery CMS Context for ChatGPT

Last reviewed against the codebase on 2026-05-26.

This file is the fastest reliable context handoff for future ChatGPT sessions that need to design or implement new features in this repository.

Do not trust the top-level README as the full source of truth. Several capabilities in the codebase are newer than the README.

## 1. Purpose

Use this document to answer:

- What this monorepo contains
- Which app is responsible for which user flow
- Which backend modules and business rules already exist
- Where the main extension points are for new features
- Which existing mismatches or stale docs can mislead implementation work

If a future prompt asks ChatGPT to build something new, the safest workflow is:

1. Read this file first.
2. Read the source files listed in "Source of Truth Files".
3. Implement changes in the smallest relevant app/package set.
4. Verify API contracts against backend routes and DTOs, not against older docs.

## 2. Monorepo Overview

Repository layout:

```text
bakery-cms/
├── bakery-cms-api/          # Backend monorepo (Express + Sequelize + TS)
│   └── packages/
│       ├── api/
│       ├── common/
│       └── database/
├── bakery-cms-web/          # CMS admin app (React + Vite + Ant Design + Zustand)
├── bakery-storefront-web/   # Public storefront (Next.js App Router)
├── docs/                    # Project docs
└── specs/                   # Feature/design specs from earlier implementation phases
```

Root workspace facts:

- Yarn workspaces span all three apps plus `bakery-cms-api/packages/*`.
- Root scripts orchestrate parallel dev/build/lint/test across apps.
- Node 18+ is the practical baseline for the current repo.

Main root commands:

```bash
yarn dev
yarn build
yarn lint
yarn test
```

## 3. Application Responsibilities

### `bakery-cms-api`

Backend API for:

- authentication and user/session management
- products and product images
- orders, bill snapshots, extra fees, cancellation
- payments, VietQR, refunds
- stock management, brands, recipes, stock movements
- files/upload metadata
- system settings used by both CMS and storefront

### `bakery-cms-web`

Protected CMS/admin UI for staff roles. It currently includes:

- login/register/forgot/reset password
- product management
- order management
- payment management
- stock items and stock movements
- system settings
- dashboard analytics
- i18n and theme state

### `bakery-storefront-web`

Public SEO-first storefront. It is currently a multilingual catalog site, not a checkout app.

It mainly consumes:

- `GET /api/v1/products?isPublished=true`
- `GET /api/v1/settings/public/storefront`

Current storefront scope:

- localized home page
- localized product listing
- localized product detail pages
- metadata, sitemap, robots
- public content blocks driven by system settings

There is no public cart/order/checkout flow in the storefront code today.

## 4. Backend Architecture

### Package split

`packages/common`

- shared enums
- shared type definitions
- shared auth/constants/utilities

`packages/database`

- Sequelize models
- migrations
- seeders
- model associations

`packages/api`

- Express app/server
- route modules
- middleware
- repositories
- services
- handlers/controllers
- validators

### Backend entrypoints

Primary source files:

- `bakery-cms-api/packages/api/src/server.ts`
- `bakery-cms-api/packages/api/src/app.ts`
- `bakery-cms-api/packages/api/src/config/env.ts`
- `bakery-cms-api/packages/database/src/models/index.ts`

Route registration in `app.ts`:

- `/api/v1/auth`
- `/api/v1/products`
- `/api/v1/orders`
- `/api/v1/payments`
- `/api/v1/stock`
- `/api/v1/files`
- `/api/v1/settings`

Other backend runtime notes:

- `helmet`, `cors`, JSON body parsing
- session + passport are enabled for OAuth flows
- global rate limiter is enabled
- static upload serving exists on both `/upload` and `/uploads`
- health check is `/health`

## 5. Backend Modules and Business Rules

### 5.1 Auth

Main capabilities:

- email/password login and register
- refresh token flow
- logout current session
- logout all sessions
- change password
- forgot/reset password
- email verification
- OAuth with Google/Facebook
- OAuth PKCE endpoints for modern client-driven flows
- admin-only user management routes

Role enum:

- `admin`
- `manager`
- `staff`
- `seller`
- `customer`
- `viewer`

Status enum:

- `active`
- `inactive`
- `suspended`
- `pending_verification`

Important backend auth routes:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout/all`
- `PATCH /auth/password`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`
- `GET /auth/profile`
- `PATCH /auth/profile`
- `GET /auth/oauth/:provider/authorize`
- `GET /auth/oauth/:provider/callback`
- `POST /auth/oauth/:provider/exchange`
- `POST /auth/oauth/link`
- `DELETE /auth/oauth/unlink`
- `POST /auth/oauth/revoke`
- `GET|POST|PATCH|DELETE /auth/admin/...`

Authorization style:

- JWT auth middleware injects `req.user`
- RBAC middleware gates by role
- common guards include `requireAdmin`, `requireManager`, `requireStaff`, `requireSeller`, `requireAuthenticated`

### 5.2 Products

Current product model includes:

- `productCode`
- `name`
- `description`
- `price`
- `saleUnitType` = `piece | weight`
- `category`
- `businessType` = `made-to-order | ready-to-sell | both`
- `status` = `available | out-of-stock`
- `productType` = `single | combo`
- `isPublished`
- `imageUrl`
- `imageFileId`
- soft delete via `deletedAt`

Important rules:

- product code is unique
- if missing, backend can auto-generate a code with prefix `SP`
- combo products must contain at least one child item
- combo products cannot include themselves
- combo products cannot contain duplicate child products
- combo children cannot themselves be combo products
- product images are stored separately in `product_images`
- storefront only fetches `isPublished=true` products

Product routes:

- `GET /products`
- `GET /products/:id`
- `POST /products`
- `PATCH /products/:id`
- `DELETE /products/:id`
- image subroutes under `/products/:productId/images`

### 5.3 Orders

Current order model includes:

- `orderNumber`
- `orderType` = `temporary | official`
- `businessModel` = `made-to-order | ready-to-sell`
- `totalAmount`
- `extraAmount`
- `extraFees` as serialized JSON
- `hasPendingExtraPayment`
- `status`
- customer name/phone/address
- notes
- `confirmedAt`
- soft delete

Order status flow:

- `draft`
- `confirmed`
- `paid`
- `refund_pending`
- `refunded`
- `cancelled`

Key order behavior:

- order items snapshot `productName` / `productCode` at order time
- extra fees can be added after initial order creation
- order bills can be saved and later voided
- confirm order may create payment context and optional VietQR data
- only some transitions are valid
- paid status can depend on payment totals, not just one payment record

Order routes:

- `GET /orders`
- `GET /orders/:id`
- `GET /orders/:id/bills`
- `POST /orders/:id/bills`
- `POST /orders/:id/bills/:billId/void`
- `POST /orders`
- `PATCH /orders/:id`
- `POST /orders/:id/confirm`
- `POST /orders/:id/extras`
- `POST /orders/:id/cancel`
- `DELETE /orders/:id`

### 5.4 Payments

Payment model includes:

- `orderId`
- `paymentType` = `payment | refund`
- `amount`
- `method` = `cash | vietqr | bank-transfer`
- `status` = `pending | paid | failed | cancelled`
- `transactionId`
- `vietqrData`
- `paidAt`
- notes
- soft delete

Important payment behavior:

- one order can have multiple payment rows
- refund is represented as a separate payment row with `paymentType=refund`
- marking a payment as paid can transition the order to `paid`
- when an order becomes fully paid, stock consumption is triggered
- if the order total changes later, `hasPendingExtraPayment` is used to track a remaining balance

Payment routes:

- `GET /payments`
- `GET /payments/:id`
- `GET /payments/order/:orderId`
- `GET /payments/order/:orderId/vietqr`
- `POST /payments`
- `POST /payments/order/:orderId/refund`
- `POST /payments/:id/mark-paid`

### 5.5 Stock

Stock module is more advanced than the README suggests.

Entities:

- stock items
- brands
- stock item brand pricing associations
- product recipe entries (`product_stock_items`)
- stock movements audit trail

Current stock concepts:

- stock items have `unitType` with `piece | weight`
- brands can be attached to stock items with purchase pricing
- products can have recipes made from stock items
- recipes may prefer a specific brand
- product cost is calculable from recipe + brand pricing
- stock movements capture receiving, usage, adjustments, damage, expiry
- paid orders consume stock automatically
- combo products recursively consume stock via their child products

Stock routes:

- `/stock/stock-items/*`
- `/stock/brands/*`
- `/stock/stock-items/:stockItemId/brands/*`
- `/stock/products/:id/stock-items/*`
- `/stock/products/:id/cost`
- `/stock/stock-items/:id/deletion-protection`
- `/stock/stock-movements/*`

### 5.6 Files

Files module handles upload metadata plus physical file serving.

Important facts:

- files are uploaded through API and stored on disk
- metadata is stored in `files`
- uploaded content is served publicly via `/upload` and `/uploads`
- product images and brand images link to file records
- storefront normalizes file URLs before rendering

File routes:

- `POST /files/upload`
- `GET /files`
- `GET /files/:id`
- `GET /files/:id/download`
- `DELETE /files/:id`

### 5.7 Settings

Settings is a key integration point between CMS and storefront.

Stored settings include:

- VietQR bank receiver config
- order extra fee templates
- invoice language
- store profile
- storefront home content in `vi` and `en`

Important settings keys used in code:

- `vietqr.bank_receiver`
- `orders.extra_fee_templates`
- `orders.invoice_language`
- `orders.store_profile`
- `storefront.home_content`

Public/private split:

- public storefront settings are exposed without auth
- system settings updates are admin-only

Settings routes:

- `GET /settings/public/storefront`
- `GET /settings/system`
- `PUT /settings/system/bank-receiver`
- `PUT /settings/system/order-extra-fees`
- `PUT /settings/system/invoice-language`
- `PUT /settings/system/store-profile`
- `PUT /settings/system/storefront-home-content`
- `GET /settings/vietqr/banks`

## 6. Database Model Relationships

High-level relationship map:

- `Order` has many `OrderItem`
- `Order` has many `OrderBill`
- `Order` has many `Payment`
- `User` has many `AuthSession`
- `StockItem` has many `StockItemBrand`
- `StockItem` has many `ProductStockItem`
- `StockItem` has many `StockMovement`
- `Brand` participates in stock-item pricing and optional preferred brand selection
- `Product` has many `ProductStockItem`
- `Product` has many `ProductImage`
- `Product` has many `ProductComboItem` as combo parent
- `Product` can also be referenced as combo child
- `File` can be attached to products, brands, and product images

Soft delete is enabled on many core tables, including:

- products
- orders
- payments
- users
- stock items
- brands

## 7. CMS Web Architecture

### Frontend stack

- React 19
- Vite
- TypeScript
- Ant Design 5
- Zustand
- Axios
- i18next
- Vitest

### Frontend structure

Core folders:

- `src/components/core`
- `src/components/shared`
- `src/components/features`
- `src/pages`
- `src/services`
- `src/stores`
- `src/types`
- `src/hooks`
- `src/i18n`

### Frontend runtime model

`src/App.tsx` is the actual route source of truth.

Current protected app routes:

- `/`
- `/products`
- `/products/:id`
- `/orders`
- `/orders/:id`
- `/payments`
- `/payments/:id`
- `/stock/items`
- `/stock/items/:id`
- `/stock/movements`
- `/settings`

Current public routes:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

### State management

Main Zustand stores:

- `authStore`
- `languageStore`
- `themeStore`
- `notificationStore`

Auth state is persisted in local storage.

### Frontend data layer

Pattern:

- `services/*` call backend endpoints
- services often return a custom `Result` object instead of throwing directly
- `types/api/*` model raw API contracts
- `types/mappers/*` convert API responses to frontend models
- hooks such as `useProducts`, `useOrders`, `usePayments`, `useStockItems` coordinate fetching

### UI and workflow notes

Products page:

- supports filters, pagination, create/update/delete
- supports `productType`, `isPublished`, combo items, and images

Orders page/detail:

- supports create/update/delete/confirm/cancel
- supports extra fees
- supports bill snapshots
- supports refund creation
- supports VietQR rendering

Payments page:

- supports list/filter/create/mark-as-paid
- supports refund-aware payment type display

Stock pages:

- stock item CRUD
- detail flows
- stock movement history
- low stock dashboard widgets
- recipe management components exist

Settings page:

- bank receiver settings
- extra fee templates
- invoice language
- store profile
- storefront home content editing
- logo upload integration

Dashboard:

- aggregates orders/payments/products
- computes revenue and profit-oriented summaries
- displays low-stock signals

### i18n

The CMS web already has bilingual structure:

- i18next resources for `vi` and `en`
- persisted language store
- Ant Design locale sync
- dayjs locale sync

When adding frontend features, assume text should be translated.

## 8. Storefront Architecture

### Stack

- Next.js 15 App Router
- React 19
- TypeScript
- server-rendered localized pages

### Routing model

Localized route prefix:

- `/vi`
- `/en`

Main pages:

- `src/app/[locale]/page.tsx`
- `src/app/[locale]/products/page.tsx`
- `src/app/[locale]/products/[id]/page.tsx`

### Storefront data sources

Products:

- fetched from public products API
- only published products are shown

Storefront content:

- fetched from public settings API
- locale-specific text can come from admin-managed settings
- if settings are missing, dictionary fallback text is used

### Storefront rendering model

The storefront normalizes asset URLs and product image ordering before rendering.

Notable behavior:

- prefers primary image first
- falls back from `product.images` to `imageFile` to `imageUrl`
- uses server `fetch` with revalidation for product data
- uses `no-store` for storefront settings

## 9. Cross-App Data Flows

### Product publish flow

1. CMS admin creates or updates a product.
2. Product may include combo children, images, and publication state.
3. Storefront fetches only `isPublished=true` products.
4. Storefront resolves display image from product image relations and file URLs.

### Order payment flow

1. Staff creates an order with items and optional extra fees.
2. Staff confirms the order with a payment method.
3. Backend can generate VietQR data for VietQR payments.
4. Payment records accumulate against the order.
5. When payment totals satisfy the order balance, backend marks the order paid.
6. Stock consumption happens when the order becomes fully paid.

### Refund flow

1. Refund is created as a `paymentType=refund` record.
2. Order/payment detail UI shows refund history and refundable balance logic.
3. Order status can move through `refund_pending` and `refunded`.

### Storefront content flow

1. Admin updates store profile and storefront home content in CMS settings.
2. Backend stores them in `system_settings`.
3. Public storefront settings endpoint exposes the resolved content.
4. Next.js storefront pulls those settings on each request or no-store fetch path.

## 10. Source of Truth Files

When implementing features, start here.

Backend:

- `bakery-cms-api/packages/api/src/app.ts`
- `bakery-cms-api/packages/api/src/modules/auth/routes.ts`
- `bakery-cms-api/packages/api/src/modules/products/routes.ts`
- `bakery-cms-api/packages/api/src/modules/orders/routes.ts`
- `bakery-cms-api/packages/api/src/modules/payments/routes.ts`
- `bakery-cms-api/packages/api/src/modules/stock/routes.ts`
- `bakery-cms-api/packages/api/src/modules/files/routes.ts`
- `bakery-cms-api/packages/api/src/modules/settings/routes.ts`
- `bakery-cms-api/packages/api/src/modules/products/services/products.services.ts`
- `bakery-cms-api/packages/api/src/modules/orders/services/orders.services.ts`
- `bakery-cms-api/packages/api/src/modules/payments/services/payments.services.ts`
- `bakery-cms-api/packages/api/src/modules/settings/services/settings.services.ts`
- `bakery-cms-api/packages/api/src/modules/stock/services/paid-order-stock.services.ts`
- `bakery-cms-api/packages/database/src/models/index.ts`

Shared/backend enums:

- `bakery-cms-api/packages/common/src/enums/auth.enums.ts`
- `bakery-cms-api/packages/common/src/enums/product.enums.ts`
- `bakery-cms-api/packages/common/src/enums/order.enums.ts`
- `bakery-cms-api/packages/common/src/enums/payment.enums.ts`
- `bakery-cms-api/packages/common/src/enums/stock.enums.ts`

CMS web:

- `bakery-cms-web/src/App.tsx`
- `bakery-cms-web/src/services/api/client.ts`
- `bakery-cms-web/src/stores/authStore.ts`
- `bakery-cms-web/src/services/auth.service.ts`
- `bakery-cms-web/src/services/product.service.ts`
- `bakery-cms-web/src/services/order.service.ts`
- `bakery-cms-web/src/services/payment.service.ts`
- `bakery-cms-web/src/services/stock.service.ts`
- `bakery-cms-web/src/services/settings.service.ts`
- `bakery-cms-web/src/pages/ProductsPage.tsx`
- `bakery-cms-web/src/pages/OrdersPage.tsx`
- `bakery-cms-web/src/pages/PaymentsPage.tsx`
- `bakery-cms-web/src/pages/SettingsPage.tsx`

Storefront:

- `bakery-storefront-web/src/lib/api.ts`
- `bakery-storefront-web/src/lib/storefront-content.ts`
- `bakery-storefront-web/src/app/[locale]/page.tsx`
- `bakery-storefront-web/src/app/[locale]/products/page.tsx`
- `bakery-storefront-web/src/app/[locale]/products/[id]/page.tsx`

## 11. Known Drift and Caution Areas

These are important before building new features.

### 11.1 Frontend auth contract drift

The CMS web auth service does not fully match the backend auth routes today.

Observed mismatches:

- frontend calls `GET /auth/me`, backend exposes `GET /auth/profile`
- frontend calls `GET /auth/verify-email?token=...`, backend route is `POST /auth/verify-email`

Any new auth-related work should verify actual backend routes first.

### 11.2 OAuth callback route drift in CMS web

`src/pages/OAuthCallback/OAuthCallback.tsx` exists and `routes.config.ts` references it, but `src/App.tsx` does not currently register a live route for it.

If new OAuth features are added, route wiring should be checked first.

### 11.3 `routes.config.ts` is not the actual router source of truth

`src/App.tsx` hardcodes the live routes. Treat `routes.config.ts` as supporting metadata, not authoritative routing.

### 11.4 Temporary debug code exists in `App.tsx`

`App.tsx` contains a temporary import test and `console.log` for `@bakery-cms/common`.

That is not architectural logic and should not be copied into future designs.

### 11.5 README and older docs are partially stale

The codebase now includes features that older docs understate or omit:

- stock/recipe/brand pricing
- product combo items
- storefront content settings
- refund flow
- order bill snapshots
- OAuth PKCE

Use source files and current DTOs/routes instead of older summaries.

### 11.6 Storefront is catalog-only

Do not assume public ordering, cart, checkout, or customer self-service flows already exist in the Next.js app.

## 12. Recommended Feature Design Checklist

Before implementing any new feature, answer these questions:

1. Which app owns the feature: API, CMS web, storefront, or multiple?
2. Does the feature affect RBAC?
3. Does it need bilingual text in CMS and/or storefront?
4. Does it require DB schema changes or only API/UI changes?
5. Does it affect product publication, pricing, stock consumption, or payment state transitions?
6. Does it require file upload or public asset delivery?
7. Does it need new settings so non-developers can manage behavior?
8. Does it impact dashboard aggregation or reporting?

## 13. Suggested Prompt Template for Future ChatGPT Sessions

```text
Read docs/CHATGPT_CONTEXT.md first.

We need to build: <feature>.

Scope:
- Target app(s): <api | cms web | storefront>
- User roles affected: <roles>
- Main user flow: <flow>
- Required API/data changes: <brief>
- UI routes/screens affected: <brief>
- i18n required: <yes/no>
- Tests expected: <brief>

Important:
- Use the current code as source of truth, not stale README docs.
- Verify backend DTOs/routes before changing frontend services.
- Call out any contract drift you find before implementing.
```

## 14. Bottom Line

This repository is no longer just a simple bakery CRUD demo.

It is now a three-app system with:

- role-aware internal operations
- public multilingual storefront content
- order/payment/refund flows
- inventory and recipe costing
- settings-driven public presentation

For most new features, expect the real work to touch at least:

- one backend module/service
- one frontend service + page/component
- shared enums/types or API mappers

And for anything customer-facing on the storefront, also check:

- `isPublished`
- public settings
- asset URL normalization
- localization
