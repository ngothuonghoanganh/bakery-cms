# Research: Stock Management Feature

**Feature Branch**: `005-stock-management`
**Created**: 2025-12-22
**Status**: Complete

## Research Summary

This document consolidates research findings for the Stock Management feature, resolving all technical decisions and establishing patterns to follow.

---

## 1. Data Model Design Decisions

### Decision: Stock Item - Brand Relationship Pattern

**Decision**: Use a junction table (StockItemBrand) with embedded pricing
**Rationale**:
- Each brand can have different prices for the same stock item
- Prices need to be tracked per stock item-brand combination, not at the brand level
- Supports the requirement that "each item can have many brands and each brand have another price"

**Alternatives Considered**:
1. Store brand and price directly on stock item → Rejected: Only allows one brand per item
2. Create separate price history table → Rejected: Over-engineering for current requirements
3. Store array of brand-price objects in JSON → Rejected: Violates relational model, harder to query

### Decision: Product-Stock Item Linking (Recipe/BOM)

**Decision**: Use ProductStockItem junction table with quantity and optional brand preference
**Rationale**:
- Many-to-many relationship between products and stock items
- Need to store quantity of each stock item required per product
- Optional brand preference allows cost optimization

**Alternatives Considered**:
1. JSON field on product with ingredient list → Rejected: Hard to query, no referential integrity
2. Separate Recipe entity → Rejected: Extra abstraction not needed, product already represents the recipe

### Decision: Stock Movement Tracking Pattern

**Decision**: Event sourcing-lite with StockMovement records for all changes
**Rationale**:
- Complete audit trail for inventory changes
- Can reconstruct stock levels from movement history
- Supports compliance and troubleshooting requirements

**Alternatives Considered**:
1. Only track current quantity, no history → Rejected: No audit trail
2. Full event sourcing with replay → Rejected: Over-engineering for CMS

---

## 2. API Design Decisions

### Decision: REST API Structure

**Decision**: Follow existing module pattern with nested resources where appropriate

**Endpoints Structure**:
```
# Stock Items (primary resource)
GET    /api/stock-items           # List with filtering/pagination
POST   /api/stock-items           # Create stock item
GET    /api/stock-items/:id       # Get single item with brands
PATCH  /api/stock-items/:id       # Update stock item
DELETE /api/stock-items/:id       # Soft delete stock item
POST   /api/stock-items/:id/restore  # Restore soft-deleted item

# Stock Item Brands (nested under stock item)
GET    /api/stock-items/:id/brands     # Get brands for stock item
POST   /api/stock-items/:id/brands     # Add brand to stock item
PATCH  /api/stock-items/:id/brands/:brandId  # Update brand pricing
DELETE /api/stock-items/:id/brands/:brandId  # Remove brand from item

# Stock Quantity Operations
POST   /api/stock-items/:id/receive    # Receive stock (add quantity)
POST   /api/stock-items/:id/adjust     # Adjust stock (with reason)

# Brands (standalone resource)
GET    /api/brands                # List all brands
POST   /api/brands                # Create brand
GET    /api/brands/:id            # Get single brand
PATCH  /api/brands/:id            # Update brand
DELETE /api/brands/:id            # Soft delete brand

# Stock Movements (read-only audit log)
GET    /api/stock-movements       # List with filtering
GET    /api/stock-movements/:id   # Get single movement

# Product Stock Items (recipe management)
GET    /api/products/:id/stock-items     # Get recipe for product
POST   /api/products/:id/stock-items     # Add stock item to recipe
PATCH  /api/products/:id/stock-items/:stockItemId  # Update quantity
DELETE /api/products/:id/stock-items/:stockItemId  # Remove from recipe
GET    /api/products/:id/cost            # Calculate product cost
```

**Rationale**:
- Follows RESTful conventions
- Nested resources for clear ownership (brand pricing belongs to stock item)
- Separate endpoints for stock operations (receive/adjust) to enforce business rules
- Read-only stock movements endpoint for audit compliance

---

## 3. Frontend Implementation Decisions

### Decision: Component Structure

**Decision**: Feature components in stock/ directory following existing patterns

**Component Hierarchy**:
```
Detail Components (feature-specific):
├── StockItemList       - Table with filters, search, actions
├── StockItemForm       - Create/Edit form with brand pricing
├── StockItemDetail     - View with brands, movements, linked products
├── BrandManagement     - Brand CRUD in stock item context
├── ProductRecipe       - Add/edit stock items for a product
├── StockMovementHistory - Audit log viewer
└── LowStockDashboard   - Alert widget for low-stock items

Shared Components (reused from existing):
├── Table, Form, Input, Button, Card (from Ant Design)
└── ErrorMessage, Spinner, Pagination (from existing shared/)
```

**Rationale**: Follows constitution component type requirements and existing structure

### Decision: State Management

**Decision**: Use Zustand for stock-related state, custom hooks for data fetching
**Rationale**:
- Consistent with existing frontend patterns
- Custom hooks encapsulate API calls and mapping
- Zustand for cross-component state (e.g., selected stock item, filters)

---

## 4. Database Schema Decisions

### Decision: Decimal Precision

**Decision**: Use DECIMAL(10, 3) for quantity, DECIMAL(12, 2) for prices
**Rationale**:
- 3 decimal places for quantity supports grams, liters, etc. (per FR-008)
- 2 decimal places for prices matches VND currency precision
- DECIMAL(12, 2) allows values up to 9,999,999,999.99 VND

### Decision: Enum Values for Stock Status

**Decision**: Create StockItemStatus enum with AVAILABLE, LOW_STOCK, OUT_OF_STOCK
**Rationale**:
- Computed from quantity vs reorderThreshold
- LOW_STOCK when quantity <= reorderThreshold && quantity > 0
- OUT_OF_STOCK when quantity = 0

### Decision: Movement Types

**Decision**: Create MovementType enum with RECEIVED, USED, ADJUSTED, DAMAGED, EXPIRED
**Rationale**:
- RECEIVED: Stock added from supplier
- USED: Stock consumed for order production
- ADJUSTED: Manual correction (inventory count)
- DAMAGED: Stock written off due to damage
- EXPIRED: Stock written off due to expiration

---

## 5. Security Decisions

### Decision: Role-Based Access

**Decision**: Restrict stock management to ADMIN and MANAGER roles
**Rationale**:
- Stock operations affect financial data (pricing, costs)
- Consistent with existing permission model for sensitive operations
- STAFF/SELLER can view but not modify stock

**Access Matrix**:
| Operation | ADMIN | MANAGER | STAFF | SELLER |
|-----------|-------|---------|-------|--------|
| View stock items | ✅ | ✅ | ✅ | ✅ |
| Create/Edit stock items | ✅ | ✅ | ❌ | ❌ |
| Delete stock items | ✅ | ✅ | ❌ | ❌ |
| Manage brands | ✅ | ✅ | ❌ | ❌ |
| Receive/Adjust stock | ✅ | ✅ | ❌ | ❌ |
| View movements | ✅ | ✅ | ✅ | ❌ |
| Manage product recipes | ✅ | ✅ | ❌ | ❌ |

---

## 6. Integration Decisions

### Decision: Product Module Integration

**Decision**: Extend Product module to include stock item linking (recipe)
**Rationale**:
- Product already exists with full CRUD
- Add recipe management as product detail feature
- Cost calculation as derived data from product + linked stock items

**Changes to Product**:
- No schema changes to Product table
- New ProductStockItem junction table
- New endpoints: `/products/:id/stock-items`, `/products/:id/cost`

### Decision: Order Integration (Future)

**Decision**: Defer automatic stock deduction on order completion to Phase 2
**Rationale**:
- Requires changes to order workflow
- Can be added as enhancement after core stock management works
- Current spec mentions it but priorities it as P3

---

## 7. Validation Rules

### Decision: Stock Item Validation

```typescript
name: required, min 1, max 255 characters
description: optional, max 1000 characters
unitOfMeasure: required, max 50 characters (e.g., "g", "kg", "pcs", "ml", "L")
currentQuantity: required, min 0, max 3 decimal places
reorderThreshold: optional, min 0, max 3 decimal places
```

### Decision: Brand Price Validation

```typescript
brandId: required, valid UUID, must exist
priceBeforeTax: required, min 0, max 2 decimal places
priceAfterTax: required, min priceBeforeTax, max 2 decimal places
```

### Decision: Stock Movement Validation

```typescript
quantity: required, non-zero, max 3 decimal places
type: required, valid MovementType enum
reason: required for ADJUSTED/DAMAGED/EXPIRED types, max 500 characters
referenceId: optional, UUID (for linking to order)
```

---

## 8. Best Practices Applied

### From Constitution

1. **Functional Programming**: All services use factory functions with Result type
2. **Type-Driven**: Types defined first, then implementation
3. **SOLID**: Single responsibility per file, dependency injection
4. **Immutability**: Spread operators for updates, no mutation

### Industry Standards

1. **Inventory Management**: Event-sourced movements for audit trail
2. **Pricing**: Store both before/after tax for transparency
3. **Recipe Management**: BOM pattern with quantities per unit product
4. **Soft Delete**: Paranoid mode for all entities to prevent data loss

---

## Research Status: ✅ COMPLETE

All unknowns resolved. Ready for Phase 1: Design & Contracts.
