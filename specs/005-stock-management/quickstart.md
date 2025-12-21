# Quickstart: Stock Management Feature

**Feature Branch**: `005-stock-management`
**Created**: 2025-12-22

## Overview

This document provides a quick reference for implementing the Stock Management feature in the Bakery CMS.

---

## Prerequisites

1. Clone and set up the repository on branch `005-stock-management`
2. Ensure database is running (MySQL)
3. Run existing migrations: `yarn migrate`
4. Verify auth module is working (JWT-based)

---

## Implementation Order

### Phase 1: Backend Foundation (P1 Features)

```
1. Create enums (packages/common)
   └── stock.enums.ts (StockItemStatus, MovementType)

2. Create database models (packages/database)
   └── brand.model.ts
   └── stock-item.model.ts
   └── stock-item-brand.model.ts
   └── product-stock-item.model.ts
   └── stock-movement.model.ts

3. Create migrations (packages/database)
   └── [timestamp]-create-brands.ts
   └── [timestamp]-create-stock-items.ts
   └── [timestamp]-create-stock-item-brands.ts
   └── [timestamp]-create-product-stock-items.ts
   └── [timestamp]-create-stock-movements.ts

4. Run migrations
   └── yarn migrate
```

### Phase 2: Backend Stock Module (P1 Features)

```
5. Create stock module structure (packages/api)
   └── modules/stock/
       ├── dto/
       ├── validators/
       ├── mappers/
       ├── repositories/
       ├── services/
       ├── handlers/
       └── routes.ts

6. Implement in order:
   a. DTOs and validators
   b. Repositories (data access)
   c. Services (business logic)
   d. Handlers (HTTP)
   e. Routes (wire up)

7. Register routes in main app
```

### Phase 3: Frontend Stock Module (P1 Features)

```
8. Create types and mappers
   └── types/api/stock.api.ts
   └── types/models/stock.model.ts
   └── types/mappers/stock.mapper.ts

9. Create stock service
   └── services/stock.service.ts

10. Create custom hooks
    └── hooks/useStockItems.ts
    └── hooks/useBrands.ts

11. Create components
    └── components/features/stock/
        ├── StockItemList/
        ├── StockItemForm/
        └── BrandManagement/

12. Create pages
    └── pages/stock/
        ├── StockItemsPage.tsx
        └── BrandsPage.tsx

13. Add routes to router
```

### Phase 4: P2/P3 Features

```
14. Low stock alerts (P2)
    └── LowStockDashboard component
    └── Dashboard widget integration

15. Stock movements (P3)
    └── StockMovementHistory component
    └── StockMovementsPage
```

---

## Key Code Patterns

### Backend Service Pattern

```typescript
// services/stock-items.services.ts
export const createStockItemService = (
  repository: StockItemRepository,
  movementRepo: StockMovementRepository
): StockItemService => {
  const createStockItem = async (
    dto: CreateStockItemDto
  ): Promise<Result<StockItemResponseDto, AppError>> => {
    try {
      const attributes = toStockItemCreationAttributes(dto);
      const stockItem = await repository.create(attributes);
      return ok(toStockItemResponseDto(stockItem));
    } catch (error) {
      return err(createDatabaseError('Failed to create stock item'));
    }
  };

  // ... other methods

  return { createStockItem, /* ... */ };
};
```

### Frontend Hook Pattern

```typescript
// hooks/useStockItems.ts
export const useStockItems = (filters?: StockItemFilters) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await stockService.getStockItems(filters);
        if (result.success) {
          setStockItems(result.data);
        } else {
          setError(result.error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  return { stockItems, loading, error };
};
```

---

## API Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock-items` | List stock items |
| POST | `/api/stock-items` | Create stock item |
| GET | `/api/stock-items/:id` | Get stock item with brands |
| PATCH | `/api/stock-items/:id` | Update stock item |
| DELETE | `/api/stock-items/:id` | Soft delete stock item |
| POST | `/api/stock-items/:id/brands` | Add brand to stock item |
| POST | `/api/stock-items/:id/receive` | Receive stock |
| POST | `/api/stock-items/:id/adjust` | Adjust stock |
| GET | `/api/brands` | List brands |
| POST | `/api/brands` | Create brand |
| GET | `/api/products/:id/stock-items` | Get product recipe |
| POST | `/api/products/:id/stock-items` | Add to recipe |
| GET | `/api/products/:id/cost` | Calculate product cost |
| GET | `/api/stock-movements` | List movements (audit) |

---

## Database Quick Reference

### Tables

| Table | Purpose |
|-------|---------|
| `brands` | Supplier/brand master data |
| `stock_items` | Raw materials/components |
| `stock_item_brands` | Brand pricing per stock item |
| `product_stock_items` | Product recipes (BOM) |
| `stock_movements` | Audit trail for all changes |

### Key Relationships

```
Product (existing) ─┬─< ProductStockItem >─── StockItem
                    │                              │
                    │                              └──< StockItemBrand >── Brand
                    │                              │
                    │                              └──< StockMovement
                    │
                    └── (existing relationships)
```

---

## Testing Checklist

### Backend Tests

- [ ] Unit tests for stock item service
- [ ] Unit tests for brand service
- [ ] Unit tests for stock movement service
- [ ] Integration tests for stock item endpoints
- [ ] Integration tests for brand endpoints
- [ ] Integration tests for product recipe endpoints

### Frontend Tests

- [ ] StockItemList component tests
- [ ] StockItemForm component tests
- [ ] BrandManagement component tests
- [ ] useStockItems hook tests
- [ ] useBrands hook tests

---

## Common Commands

```bash
# Backend
yarn dev                    # Start dev server
yarn test                   # Run tests
yarn migrate               # Run migrations
yarn migrate:undo          # Rollback migration

# Frontend
yarn dev                    # Start dev server
yarn test                   # Run tests
yarn build                  # Build for production
```

---

## Troubleshooting

### Common Issues

1. **Migration fails**: Check database connection in `.env`
2. **Foreign key error**: Ensure referenced records exist
3. **Negative stock error**: Check stock quantity before deduction
4. **Permission denied**: Verify user role is ADMIN or MANAGER

### Debug Tips

- Check backend logs with `DEBUG=*` environment variable
- Use React DevTools for frontend state inspection
- Check Network tab for API request/response details
