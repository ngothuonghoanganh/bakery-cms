/**
 * Enum Export Contracts
 * 
 * This file documents the TypeScript enum structures exported from the backend
 * common package for use in the frontend. These are the authoritative type
 * definitions that frontend code should import.
 * 
 * Package: @bakery-cms/common
 * Location: bakery-cms-api/packages/common/src/enums/
 */

// =============================================================================
// AUTHENTICATION ENUMS
// =============================================================================

/**
 * UserRole - User permission levels
 * Source: auth.enums.ts
 * 
 * Values represent user access levels in the system.
 * All values are lowercase strings.
 */
export enum UserRole {
  /** Full system access - can manage all resources */
  ADMIN = 'admin',
  
  /** Can manage products, orders, and staff */
  MANAGER = 'manager',
  
  /** Can manage orders and view products */
  STAFF = 'staff',
  
  /** Can create products and manage own inventory */
  SELLER = 'seller',
  
  /** Can place orders */
  CUSTOMER = 'customer',
  
  /** Read-only access to the system */
  VIEWER = 'viewer',
}

/**
 * UserStatus - User account state
 * Source: auth.enums.ts
 * 
 * Values represent the current status of a user account.
 * Note: PENDING_VERIFICATION uses underscore (not hyphen).
 */
export enum UserStatus {
  /** User can log in and use system */
  ACTIVE = 'active',
  
  /** User account deactivated, cannot log in */
  INACTIVE = 'inactive',
  
  /** Temporarily blocked, usually for policy violation */
  SUSPENDED = 'suspended',
  
  /** Email not verified, limited access */
  PENDING_VERIFICATION = 'pending_verification',
}

/**
 * AuthProvider - Authentication method
 * Source: auth.enums.ts
 * 
 * Values indicate which authentication provider was used.
 */
export enum AuthProvider {
  /** Email/password authentication */
  LOCAL = 'local',
  
  /** OAuth with Google */
  GOOGLE = 'google',
  
  /** OAuth with Facebook */
  FACEBOOK = 'facebook',
}

/**
 * TokenType - JWT token purposes
 * Source: auth.enums.ts
 * 
 * Values differentiate between different types of JWT tokens.
 * Note: Uses underscores for multi-word values.
 */
export enum TokenType {
  /** Short-lived token for API access */
  ACCESS = 'access',
  
  /** Long-lived token for obtaining new access tokens */
  REFRESH = 'refresh',
  
  /** Token sent in email verification links */
  EMAIL_VERIFICATION = 'email_verification',
  
  /** Token sent in password reset links */
  PASSWORD_RESET = 'password_reset',
}

// =============================================================================
// PAYMENT ENUMS
// =============================================================================

/**
 * PaymentMethod - Supported payment methods
 * Source: payment.enums.ts
 * 
 * Values represent available payment options.
 * Note: BANK_TRANSFER uses hyphen (not underscore).
 */
export enum PaymentMethod {
  /** Cash on delivery or pickup */
  CASH = 'cash',
  
  /** QR code payment (Vietnamese standard) */
  VIETQR = 'vietqr',
  
  /** Direct bank transfer - note hyphen format */
  BANK_TRANSFER = 'bank-transfer',
}

/**
 * PaymentStatus - Payment lifecycle states
 * Source: payment.enums.ts
 * 
 * Values track the current state of a payment.
 * Note: Uses 'cancelled' not 'refunded'.
 */
export enum PaymentStatus {
  /** Payment initiated, awaiting confirmation */
  PENDING = 'pending',
  
  /** Payment successfully completed */
  PAID = 'paid',
  
  /** Payment attempt failed */
  FAILED = 'failed',
  
  /** Payment cancelled by user or system */
  CANCELLED = 'cancelled',
}

// =============================================================================
// PRODUCT ENUMS
// =============================================================================

/**
 * BusinessType - Product availability model
 * Source: product.enums.ts
 * 
 * Values define how a product is manufactured and sold.
 * Note: All values use hyphens for multi-word terms.
 */
export enum BusinessType {
  /** Products created after order placement */
  MADE_TO_ORDER = 'made-to-order',
  
  /** Products available in inventory for immediate sale */
  READY_TO_SELL = 'ready-to-sell',
  
  /** Can be sold from inventory or made to order */
  BOTH = 'both',
}

/**
 * ProductStatus - Product availability
 * Source: product.enums.ts
 * 
 * Values indicate whether a product can be ordered.
 * Note: Uses 'available' not 'active'.
 */
export enum ProductStatus {
  /** Product can be ordered */
  AVAILABLE = 'available',
  
  /** Product currently unavailable */
  OUT_OF_STOCK = 'out-of-stock',
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/**
 * Example: Importing in Frontend Code
 * 
 * ```typescript
 * // Single import
 * import { UserRole } from '@bakery-cms/common';
 * 
 * // Multiple imports
 * import { 
 *   UserRole, 
 *   UserStatus, 
 *   PaymentMethod 
 * } from '@bakery-cms/common';
 * 
 * // Using in code
 * const checkAdminAccess = (role: UserRole): boolean => {
 *   return role === UserRole.ADMIN;
 * };
 * 
 * // Using in API calls
 * const createPayment = async (method: PaymentMethod) => {
 *   return apiClient.post('/payments', {
 *     method, // Will send 'cash', 'vietqr', or 'bank-transfer'
 *   });
 * };
 * 
 * // Type-safe object properties
 * type User = {
 *   id: string;
 *   email: string;
 *   role: UserRole;  // TypeScript enforces valid enum values
 *   status: UserStatus;
 * };
 * ```
 */

/**
 * Example: Type Guards (provided by backend)
 * 
 * The backend common package also exports type guard functions:
 * 
 * ```typescript
 * import { 
 *   PaymentMethod,
 *   isValidPaymentMethod 
 * } from '@bakery-cms/common';
 * 
 * const validatePayment = (data: unknown) => {
 *   if (!isValidPaymentMethod(data.method)) {
 *     throw new Error('Invalid payment method');
 *   }
 *   // data.method is now typed as PaymentMethod
 * };
 * ```
 */

// =============================================================================
// MIGRATION NOTES
// =============================================================================

/**
 * Key Changes from Frontend Local Enums:
 * 
 * 1. UserRole values are lowercase (was UPPERCASE)
 *    - OLD: 'ADMIN', 'MANAGER'
 *    - NEW: 'admin', 'manager'
 * 
 * 2. UserStatus.PENDING_VERIFICATION uses full name
 *    - OLD: 'PENDING'
 *    - NEW: 'pending_verification'
 * 
 * 3. PaymentMethod.BANK_TRANSFER uses hyphen
 *    - OLD: 'bank_transfer'
 *    - NEW: 'bank-transfer'
 * 
 * 4. PaymentStatus uses CANCELLED not REFUNDED
 *    - OLD: 'refunded' (does not exist in backend)
 *    - NEW: 'cancelled'
 * 
 * 5. BusinessType includes BOTH option
 *    - NEW: 'both' (was missing in frontend)
 * 
 * 6. ProductStatus uses AVAILABLE not ACTIVE
 *    - OLD: 'active', 'inactive'
 *    - NEW: 'available', 'out-of-stock'
 */

// =============================================================================
// TYPESCRIPT CONFIGURATION
// =============================================================================

/**
 * Required Frontend Configuration:
 * 
 * 1. package.json dependency:
 * ```json
 * {
 *   "dependencies": {
 *     "@bakery-cms/common": "workspace:*"
 *   }
 * }
 * ```
 * 
 * 2. tsconfig.json reference (optional but recommended):
 * ```json
 * {
 *   "references": [
 *     { "path": "../bakery-cms-api/packages/common" }
 *   ]
 * }
 * ```
 * 
 * 3. Ensure backend common package is built:
 * ```bash
 * cd bakery-cms-api/packages/common
 * yarn build  # Generates dist/index.js and dist/index.d.ts
 * ```
 */

export {};
