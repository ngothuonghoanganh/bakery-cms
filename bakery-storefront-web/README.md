# Bakery Storefront Web

Next.js storefront for customer-facing online sales.

## Features

- SEO-first App Router pages (SSR + metadata + sitemap + robots)
- Multilingual routes (`/vi`, `/en`)
- Bakery-themed responsive UI for product discovery and detail pages
- Data connection to existing API: `GET /api/v1/products`

## Quick Start

```bash
cd bakery-storefront-web
cp .env.example .env
yarn install
yarn dev
```

Default local URL: `http://localhost:4000`

## Environment

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:4000
```
