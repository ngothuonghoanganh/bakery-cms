# Quickstart Guide: Ant Design CMS Frontend

**Feature**: Ant Design CMS Frontend Setup
**Date**: December 17, 2025

This guide provides step-by-step instructions to test the Ant Design CMS implementation locally.

---

## Prerequisites

- Node.js 18+ installed
- Yarn package manager installed
- Backend API running at `http://localhost:3000` (optional for mock testing)
- Git repository cloned

---

## Installation & Setup

### 1. Install Dependencies

```bash
cd bakery-cms-web
yarn install
```

This will install:
- Ant Design 5.12.0
- Zustand 4.4.7
- Zod 3.22.4
- All existing dependencies

### 2. Environment Configuration

Create `.env.local` file:

```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api/v1

# Feature Flags
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_MOCK_DATA=false
```

### 3. Start Development Server

```bash
yarn dev
```

Application will be available at: `http://localhost:5173`

---

## Testing Scenarios

### Scenario 1: Dashboard Layout & Navigation

**Objective**: Verify responsive dashboard layout with sidebar navigation

#### Steps:

1. **Open Application**
   ```
   Navigate to: http://localhost:5173
   ```

2. **Verify Dashboard Layout**
   - ✅ Sidebar visible on left with navigation menu
   - ✅ Header at top with logo and user menu
   - ✅ Main content area displays dashboard
   - ✅ Footer at bottom (optional)

3. **Test Navigation**
   - Click "Products" in sidebar → Should navigate to `/products`
   - Click "Orders" in sidebar → Should navigate to `/orders`
   - Click "Payments" in sidebar → Should navigate to `/payments`
   - Click "Dashboard" → Should navigate back to `/`

4. **Test Responsive Design**
   - Resize browser to mobile width (< 768px)
   - ✅ Sidebar should collapse to icons only
   - ✅ Menu icon should appear in header
   - Click menu icon → Sidebar should expand as drawer
   - ✅ Content area should be full width

**Expected Result**: Professional CMS layout with working navigation and responsive behavior.

---

### Scenario 2: Product Management

**Objective**: Test complete CRUD operations for products

#### Steps:

1. **View Products List**
   ```
   Navigate to: http://localhost:5173/products
   ```
   - ✅ Products table displayed with columns: Name, Category, Price, Status, Actions
   - ✅ Pagination controls visible at bottom
   - ✅ "Add Product" button visible at top

2. **Create New Product**
   - Click "Add Product" button
   - ✅ Modal dialog opens with form
   - Fill in form:
     - Name: `Chocolate Chip Cookie`
     - Description: `Delicious homemade chocolate chip cookies`
     - Price: `5.99`
     - Category: `Cookies`
     - Business Type: `B2C`
     - Status: `Active`
   - Click "OK"
   - ✅ Success notification appears
   - ✅ New product appears in table
   - ✅ Modal closes

3. **Search Products**
   - Type in search box: `Chocolate`
   - ✅ Table filters to show matching products
   - Clear search
   - ✅ All products shown again

4. **Filter Products**
   - Select Category filter: `Cookies`
   - ✅ Table shows only cookies
   - Select Status filter: `Active`
   - ✅ Table shows only active products

5. **Edit Product**
   - Click "Edit" button on a product row
   - ✅ Modal opens with pre-filled form data
   - Change Price to: `6.99`
   - Click "OK"
   - ✅ Success notification
   - ✅ Table updates with new price

6. **Delete Product**
   - Click "Delete" button on a product
   - ✅ Confirmation popover appears
   - Click "Yes"
   - ✅ Success notification
   - ✅ Product removed from table

**Expected Result**: Full CRUD functionality working with proper validation and notifications.

---

### Scenario 3: Order Management

**Objective**: Test order viewing and status updates

#### Steps:

1. **View Orders List**
   ```
   Navigate to: http://localhost:5173/orders
   ```
   - ✅ Orders table with: Order #, Customer, Total, Status, Items, Date
   - ✅ Status badges colored appropriately
   - ✅ Filter controls at top

2. **Filter by Status**
   - Select status filter: `Pending`
   - ✅ Only pending orders shown
   - Select `Confirmed`
   - ✅ Only confirmed orders shown

3. **View Order Details**
   - Click on any order row
   - ✅ Drawer opens from right side
   - ✅ Customer information displayed
   - ✅ Order items table shown with quantities and prices
   - ✅ Total amount calculated correctly
   - ✅ Current status displayed

4. **Update Order Status**
   - In order detail drawer, find status updater
   - Select new status: `Preparing`
   - Add note: `Order preparation started`
   - Click "Update Status"
   - ✅ Success notification
   - ✅ Status badge updates
   - ✅ Close drawer
   - ✅ Table shows updated status

5. **Date Range Filter**
   - Click date range picker
   - Select: Last 7 days
   - ✅ Only recent orders shown
   - Clear filter
   - ✅ All orders shown again

**Expected Result**: Order management interface with filtering, details view, and status updates working.

---

### Scenario 4: Payment Management

**Objective**: Test payment viewing and QR code generation

#### Steps:

1. **View Payments List**
   ```
   Navigate to: http://localhost:5173/payments
   ```
   - ✅ Payments table with: Order #, Amount, Method, Status, Transaction ID, Date
   - ✅ Status badges (Pending, Completed, Failed, Refunded)

2. **Filter Payments**
   - Select method filter: `Bank Transfer`
   - ✅ Only bank transfer payments shown
   - Select status filter: `Pending`
   - ✅ Only pending payments shown

3. **Generate QR Code** (if unpaid order exists)
   - Find pending payment
   - Click "Generate QR" button
   - ✅ Modal opens with QR code
   - ✅ Payment amount displayed
   - ✅ Payment instructions shown
   - ✅ "Copy Link" button available
   - ✅ "Download QR" button available
   - Click "Download QR"
   - ✅ QR code image downloads

4. **View Payment Details**
   - Click on a payment row
   - ✅ Detail view shows full payment information
   - ✅ Related order information displayed
   - ✅ Transaction details (if completed)

**Expected Result**: Payment management with QR generation working properly.

---

### Scenario 5: Theme & Responsive Design

**Objective**: Test dark mode and responsive layouts

#### Steps:

1. **Toggle Dark Mode**
   - Find theme toggle in header (sun/moon icon)
   - Click theme toggle
   - ✅ Entire interface switches to dark theme
   - ✅ All components adapt to dark colors
   - ✅ Text remains readable
   - ✅ Ant Design dark algorithm applied
   - Click again
   - ✅ Switches back to light theme

2. **Test Mobile View** (< 768px)
   - Open browser DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
   - Select iPhone 12 Pro or similar
   - ✅ Sidebar collapses completely
   - ✅ Hamburger menu appears
   - ✅ Content uses full width
   - ✅ Tables scroll horizontally
   - ✅ Forms stack vertically
   - Click hamburger → ✅ Sidebar opens as drawer
   - Click outside → ✅ Drawer closes

3. **Test Tablet View** (768px - 992px)
   - Switch to iPad or similar
   - ✅ Sidebar shows icons only
   - ✅ Hover over icons shows labels
   - ✅ Tables adjust column widths
   - ✅ Touch-friendly button sizes

**Expected Result**: Seamless theme switching and responsive design across all screen sizes.

---

## Automated Testing

### Run Unit Tests

```bash
# Run all tests
yarn test

# Run with coverage report
yarn test:coverage

# Run in watch mode (for development)
yarn test:watch

# Run tests with UI
yarn test:ui
```

**Expected Output**:
```
Test Files  45 passed (45)
Tests  203 passed (203)
Duration: 8.5s

Coverage:
  Statements: 85%
  Branches: 82%
  Functions: 88%
  Lines: 85%
```

### Run Linting

```bash
yarn lint

# Auto-fix issues
yarn lint:fix
```

### Type Checking

```bash
yarn type-check
```

Should output: `No errors found`

### Build Production Bundle

```bash
yarn build
```

**Expected Output**:
```
✓ 156 modules transformed.
dist/index.html                   0.45 kB
dist/assets/index-abc123.css     45.23 kB
dist/assets/index-def456.js     152.67 kB
dist/assets/vendor-react-xyz.js  142.34 kB
dist/assets/vendor-antd-uvw.js   285.12 kB

✓ built in 12.34s
```

---

## Performance Verification

### Lighthouse Audit

1. Open application in Chrome
2. Open DevTools (F12)
3. Go to "Lighthouse" tab
4. Select "Performance" only
5. Click "Generate report"

**Expected Scores**:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90

### Bundle Size Analysis

```bash
yarn build
npx vite-bundle-visualizer dist/stats.html
```

Open `dist/stats.html` in browser to view bundle composition.

**Expected**:
- Main chunk: < 200 KB
- Ant Design chunk: < 300 KB
- React vendor chunk: < 150 KB
- Total initial load: < 500 KB

---

## Troubleshooting

### Issue: Ant Design styles not loading

**Solution**:
```bash
# Clear cache and rebuild
rm -rf node_modules .vite
yarn install
yarn dev
```

### Issue: Dark mode not persisting

**Check**: Browser localStorage
```javascript
// Open browser console
localStorage.getItem('theme-storage')
// Should return: {"state":{"mode":"dark"},...}
```

### Issue: API calls failing

**Verify**:
1. Backend API is running at configured URL
2. CORS is configured correctly on backend
3. Check browser console for network errors
4. Verify `.env.local` has correct `VITE_API_URL`

**Enable Mock Mode** (for testing without backend):
```bash
# In .env.local
VITE_ENABLE_MOCK_DATA=true
```

### Issue: TypeScript errors

```bash
# Rebuild TypeScript types
yarn type-check

# If using VSCode, reload window
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

## Verification Checklist

Before considering feature complete:

### Functionality
- [ ] Dashboard layout renders correctly
- [ ] All navigation links work
- [ ] Products CRUD operations work
- [ ] Orders viewing and status updates work
- [ ] Payments viewing and QR generation work
- [ ] Search and filtering work on all pages
- [ ] Pagination works correctly
- [ ] Form validation shows proper errors
- [ ] Success/error notifications appear

### UI/UX
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] Dark mode toggle works
- [ ] Theme persists after page reload
- [ ] Loading states show during API calls
- [ ] Empty states show when no data
- [ ] Error states show on failures
- [ ] All icons and images load

### Technical
- [ ] Test coverage ≥ 80%
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Bundle size < 500KB initial
- [ ] Lighthouse score > 90
- [ ] All API calls use Result type pattern
- [ ] All forms use Zod validation

### Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] No memory leaks (check DevTools Memory tab)
- [ ] Smooth scrolling on large tables
- [ ] No layout shifts during load

---

## Next Steps

After verifying all scenarios:

1. **Document any issues** in GitHub Issues
2. **Update README.md** with setup instructions
3. **Create demo video** showing key features
4. **Deploy to staging** environment
5. **Request user acceptance testing**

---

## Support

For issues or questions:
- Check console logs in browser DevTools
- Review backend API logs
- Check GitHub Issues
- Contact development team

**End of Quickstart Guide**
