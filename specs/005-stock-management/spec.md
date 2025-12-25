# Feature Specification: Stock Management for CMS

**Feature Branch**: `005-stock-management`
**Created**: 2025-12-22
**Status**: Draft
**Input**: User description: "Create feature manage stock for CMS - each product is created by items in stock, items manage price before/after tax, items can have multiple brands with different prices"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage Stock Items (Priority: P1)

As a CMS administrator, I want to create and manage stock items that represent raw materials or components used to create products, so that I can track inventory levels and costs accurately.

**Why this priority**: Stock items are the foundation of the entire inventory system. Without the ability to create and manage stock items, no other feature can function. This is the core building block.

**Independent Test**: Can be fully tested by creating a stock item with name, description, quantity, and prices (before/after tax), then verifying it appears in the stock list with correct values.

**Acceptance Scenarios**:

1. **Given** I am logged in as an admin/manager, **When** I navigate to the Stock Items section and click "Add Stock Item", **Then** I should see a form to enter item details including name, description, quantity, price before tax, and price after tax.

2. **Given** I am on the Stock Item creation form, **When** I fill in valid details (name: "Flour", quantity: 100, price before tax: 45000 VND, price after tax: 49500 VND) and submit, **Then** the stock item should be created and appear in the stock items list.

3. **Given** I have an existing stock item, **When** I click edit and modify the quantity or prices, **Then** the changes should be saved and reflected immediately.

4. **Given** I have a stock item that is no longer needed, **When** I delete it, **Then** it should be soft-deleted (can be restored) if not used in any product, or show an error if it's currently in use.

---

### User Story 2 - Manage Brands and Brand Pricing (Priority: P1)

As a CMS administrator, I want to associate multiple brands with each stock item where each brand has its own pricing, so that I can track costs from different suppliers and choose the best option.

**Why this priority**: Brand pricing is essential for accurate cost tracking and supplier management. This is core to the requirement that "each item can have many brands and each brand have another price".

**Independent Test**: Can be tested by adding multiple brands (e.g., "Brand A", "Brand B") to a stock item, each with different prices, and verifying the brand options and prices display correctly.

**Acceptance Scenarios**:

1. **Given** I am on the Stock Item detail page and want to add a brand, **When** I select an existing brand or click "Create New Brand" to open an inline modal, **Then** I can create a new brand without leaving the page and immediately associate it with pricing (before/after tax).

2. **Given** a stock item has multiple brands, **When** I view the stock item details, **Then** I should see all associated brands with their respective prices before and after tax.

3. **Given** a stock item has 3 brands (Brand A: 45000 VND, Brand B: 42000 VND, Brand C: 48000 VND), **When** I view the item, **Then** I should be able to compare prices across brands and identify the best value.

4. **Given** I want to remove a brand from a stock item, **When** I delete the brand association, **Then** the brand should be removed from that stock item only (the brand itself can still exist for other items).

---

### User Story 3 - Link Stock Items to Products (Priority: P1)

As a CMS administrator, I want to define which stock items (and quantities) are required to create each product, so that I can track ingredient usage and calculate product costs.

**Why this priority**: This directly addresses the requirement that "each product is created by some items in stock". Without this link, products cannot be tied to inventory.

**Independent Test**: Can be tested by linking stock items to a product (e.g., "Croissant" requires "Flour: 200g", "Butter: 50g"), then verifying the recipe displays correctly on the product page.

**Acceptance Scenarios**:

1. **Given** I am editing a product, **When** I add stock items as ingredients with quantities, **Then** the product should show its "recipe" (list of required stock items and amounts).

2. **Given** a product requires multiple stock items, **When** I view the product details, **Then** I should see all required items with their quantities and can calculate the total cost based on selected brand prices.

3. **Given** I have a product with ingredients defined, **When** I modify the required quantity of an ingredient, **Then** the change should be saved and cost calculations should update accordingly.

4. **Given** I try to delete a stock item that is linked to products, **When** I confirm deletion, **Then** the system should warn me about affected products and require confirmation.

---

### User Story 4 - Stock Quantity Tracking (Priority: P2)

As a CMS administrator, I want to track current stock quantities and receive alerts when items run low, so that I can reorder supplies before running out.

**Why this priority**: While important for operations, basic stock management can function without automated alerts. This enhances the core functionality.

**Independent Test**: Can be tested by setting a reorder threshold, reducing stock quantity below that threshold, and verifying a low-stock warning is displayed.

**Acceptance Scenarios**:

1. **Given** a stock item has a defined reorder threshold, **When** the current quantity falls below the threshold, **Then** the item should be flagged as "Low Stock" in the system.

2. **Given** I am on the stock dashboard, **When** there are items below their reorder threshold, **Then** I should see a summary of low-stock items requiring attention.

3. **Given** I receive new inventory, **When** I update the stock quantity by adding the received amount, **Then** the quantity should increase and the low-stock flag should clear if above threshold.

---

### User Story 5 - Stock Movement History (Priority: P3)

As a CMS administrator, I want to see a history of all stock movements (additions, deductions, adjustments), so that I can audit inventory changes and identify discrepancies.

**Why this priority**: Audit trails are valuable but not essential for basic operations. This provides accountability and troubleshooting capability.

**Independent Test**: Can be tested by performing several stock operations (add, remove, adjust), then viewing the movement history and verifying all actions are recorded with timestamps and reasons.

**Acceptance Scenarios**:

1. **Given** I add stock quantity to an item, **When** I view the movement history, **Then** I should see an entry with date, quantity added, reason, and who made the change.

2. **Given** an order is completed that uses stock items, **When** I view the movement history, **Then** I should see automatic deductions linked to that order.

3. **Given** I need to adjust stock for reasons like damage or expiry, **When** I make an adjustment, **Then** I must provide a reason which is recorded in the history.

---

### Edge Cases

- What happens when a stock item quantity reaches zero? The item should be marked as "Out of Stock" but remain in the system for reordering.
- How does the system handle negative stock? The system should prevent stock from going negative and warn users before deducting more than available.
- What happens when a brand is discontinued? The brand should be marked inactive but historical records should remain intact for cost tracking.
- How are decimal quantities handled (e.g., 2.5 kg of flour)? The system should support decimal quantities with configurable precision (default: 3 decimal places).
- What happens when tax rates change? Existing records retain their original tax values; new entries use updated rates.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create stock items with name, description, unit of measure, current quantity, and prices (before and after tax).
- **FR-002**: System MUST support associating multiple brands with each stock item, where each brand has its own price before tax and price after tax.
- **FR-003**: System MUST allow linking multiple stock items to a product with specified quantities (product recipe/composition).
- **FR-004**: System MUST track current stock quantity for each item and update it when stock is received or used.
- **FR-005**: System MUST display stock items in a list view with filtering by name, brand, stock status (normal, low, out of stock).
- **FR-006**: System MUST allow soft deletion of stock items and brands, with ability to restore.
- **FR-007**: System MUST prevent deletion of stock items that are actively linked to products without explicit confirmation.
- **FR-008**: System MUST support decimal quantities for stock items (up to 3 decimal places).
- **FR-009**: System MUST calculate and display the cost breakdown for products based on their linked stock items and selected brand prices.
- **FR-010**: System MUST allow setting a reorder threshold for each stock item and flag items below this threshold.
- **FR-011**: System MUST record all stock quantity changes (additions, deductions, adjustments) with timestamp, quantity, reason, and user reference.
- **FR-012**: System MUST prevent stock quantity from going negative during deduction operations.
- **FR-013**: System MUST support searching stock items by name or brand name.
- **FR-014**: System MUST display price before tax and price after tax separately for transparency.
- **FR-015**: System MUST allow bulk import of stock items via CSV file upload.

### Key Entities

- **Stock Item**: Represents a raw material or component (e.g., Flour, Sugar, Butter). Contains name, description, unit of measure, current quantity, reorder threshold, and status.
- **Brand**: Represents a supplier or brand for stock items (e.g., "Golden Bell Flour", "Vinamilk Butter"). Has name and status.
- **Stock Item Brand Price**: Links a stock item to a brand with specific pricing (price before tax, price after tax). Allows same item from different brands at different prices.
- **Product Stock Item**: Links products to their required stock items with quantities (recipe/bill of materials). Includes optional brand preference.
- **Stock Movement**: Records all inventory changes with type (received, used, adjusted, damaged, expired), quantity, reason, reference (e.g., order ID), and user who made the change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: CMS users can create a complete stock item with brand pricing in under 2 minutes.
- **SC-002**: CMS users can define a product's recipe (link stock items) in under 3 minutes for products with up to 10 ingredients.
- **SC-003**: Stock levels update within 5 seconds of completing stock-related operations.
- **SC-004**: Low-stock items are visible on the dashboard within 10 seconds of crossing the reorder threshold.
- **SC-005**: 95% of stock quantity changes are recorded with complete audit trail (timestamp, user, reason).
- **SC-006**: Users can find any stock item by name or brand within 3 seconds using the search feature.
- **SC-007**: Cost calculations for products are accurate to within 0.01 currency unit based on selected brand prices.
- **SC-008**: System prevents all attempts to reduce stock below zero (100% enforcement).

## Assumptions

- Tax rates are managed externally and entered manually per price record (price before tax and price after tax are both stored explicitly).
- Users have appropriate permissions (Admin or Manager role) to manage stock items.
- The existing Product entity will be extended to support stock item linkages without breaking existing functionality.
- Currency is Vietnamese Dong (VND) based on existing product pricing in the system.
- Stock quantities use a single unit per item (e.g., grams, pieces, liters) - no unit conversion is required.
- The feature will integrate with the existing soft-delete pattern used throughout the system.

## Clarifications

### Session 2025-12-26

- Q: When linking a stock item to a product recipe, how should the system determine which brand's price to use for cost calculations? → A: Each product-stock-item link specifies a preferred brand (stored in ProductStockItem.preferredBrandId)
- Q: How should users add a brand that doesn't exist yet when managing stock item pricing? → A: Inline brand creation via modal within Stock Item detail page - users can create a new brand without leaving the page, then immediately associate it with pricing
- Q: Where should brand and pricing CRUD operations be performed? → A: All brand and brand-pricing management is done within Stock Item detail page (no separate Brands page needed). Users can create, edit, delete brands and their prices directly from the stock item context.
