# Project Proposal: Cookie Sales Management Application

## 1. Overview
This project proposes the development of a **Cookie Sales Management Application** designed for small businesses or freelancers selling cookies. The application will support end-to-end sales operations including product management, order creation, payment handling, revenue tracking, and business statistics.

The goal is to build a **simple, scalable, and practical system** that can be used daily by a cookie seller to manage sales efficiently and transparently.

---

## 2. Project Objectives
- Provide a centralized system to manage cookie products and inventory
- Support fast and flexible order creation (temporary and confirmed orders)
- Enable convenient payment via VietQR
- Track revenue and sales performance in real time
- Generate business statistics to support decision-making

---

## 3. Target Users
- Freelancers selling homemade cookies
- Small cookie shops
- Online cookie sellers (social media, chat-based selling)

---

## 4. Core Features

### 4.1 Business Model Support
The cookie shop operates under **two sales models**, both supported by the system:

1. **Made-to-Order Cookies**
   - Cookies are produced after receiving customer orders
   - Suitable for custom flavors, quantities, or special requests

2. **Ready-to-Sell Cookies**
   - Cookies are prepared in advance and sold from available stock
   - Quantity is limited by current inventory

Each order must specify which business model it belongs to.

---

### 4.2 Cookie Product Management
- Add, edit, delete cookie products
- Store product information:
  - Name
  - Description
  - Price
  - Category / flavor
  - Business type (made-to-order / ready-to-sell / both)
  - Status (available / out of stock)
- Import products manually or via data input form

---

### 4.3 Order Management
- Create **Temporary Orders** (draft orders):
  - Used while consulting with customers
  - Editable before confirmation
- Create **Official Orders**:
  - Converted from temporary orders
  - Locked after confirmation
- Order details include:
  - Order ID
  - Order type (made-to-order / ready-to-sell)
  - List of cookies
  - Quantity
  - Total amount
  - Order status (draft, confirmed, paid, cancelled)

---

### 4.4 Payment Feature
- Support payment processing via **VietQR**
- Automatically generate QR codes based on:
  - Total order amount
  - Seller bank information
  - Order reference code
- Payment status tracking:
  - Pending
  - Paid

---

### 4.5 Revenue & Sales Checking
- View daily, weekly, and monthly revenue
- Filter revenue by:
  - Date range
  - Order type (made-to-order / ready-to-sell)
  - Order status
- Real-time update after payment confirmation

---

### 4.6 Statistics & Reports
- Sales statistics dashboard:
  - Total revenue
  - Number of orders
  - Revenue by business model
  - Best-selling cookies
- Visual charts (bar / line / pie):
  - Revenue trends
  - Product performance
- Export basic reports (optional phase)

---

## 5. System Workflow
1. Seller adds cookie products to the system
2. Seller creates a temporary order for a customer
3. Order is confirmed and becomes an official order
4. System generates VietQR for payment
5. Customer completes payment
6. Order status updates to paid
7. Revenue and statistics are updated automatically

---

## 6. Technical Proposal (Suggested)

### 6.1 Application Type
- Web Application (responsive, mobile-friendly)
- Potential upgrade to mobile app in future

### 6.2 Suggested Tech Stack
- **Frontend**: React / Vue
- **Backend**: Node.js (NestJS / Express)
- **Database**: PostgreSQL / MySQL
- **QR Payment**: VietQR standard
- **Authentication**: Basic user login (optional phase)

---

## 7. Project Phases

### Phase 1 – MVP (Core Functions)
- Product management
- Order creation (temporary & official)
- VietQR generation
- Basic revenue tracking

### Phase 2 – Enhancement
- Statistics dashboard
- Advanced filters
- UI/UX improvements

### Phase 3 – Expansion (Optional)
- User roles
- Export reports
- Inventory tracking

---

## 8. Expected Deliverables
- Fully functional sales management application
- Source code repository
- System documentation
- User guide (basic)

---

## 9. Success Criteria
- Seller can manage products and orders without external tools
- Payment via VietQR works smoothly
- Revenue and statistics are accurate and easy to understand
- System is stable and easy to extend

---

## 10. Conclusion
This Cookie Sales Management Application will help freelancers and small sellers professionalize their sales process, reduce manual work, and gain better insight into business performance. The system is designed to start small (MVP) and grow based on real usage needs.

