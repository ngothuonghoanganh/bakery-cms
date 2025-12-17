/**
 * Soft Delete Types
 * 
 * Type definitions for soft delete functionality across all entities.
 * Follows functional programming paradigm with immutable data structures.
 */

/**
 * Base interface for models with soft delete support
 * 
 * @property deletedAt - Timestamp when record was soft deleted, null if active
 */
export type SoftDeletable = {
  deletedAt: Date | null;
};

/**
 * Soft delete filter options for queries
 * 
 * - 'active': Only non-deleted records (deletedAt IS NULL) - default behavior
 * - 'deleted': Only deleted records (deletedAt IS NOT NULL)
 * - 'all': All records including deleted (no filtering)
 */
export type SoftDeleteFilter = 
  | 'active'
  | 'deleted'
  | 'all';

/**
 * Soft delete metadata for logging and audit trail
 * 
 * @property entityType - Type of entity being soft deleted (e.g., 'Product', 'Order')
 * @property entityId - Unique identifier of the soft deleted entity
 * @property deletedAt - Timestamp when deletion occurred
 * @property deletedBy - Optional: User ID who performed deletion
 * @property reason - Optional: Reason for deletion
 */
export type SoftDeleteMetadata = {
  entityType: string;
  entityId: string;
  deletedAt: Date;
  deletedBy?: string;
  reason?: string;
};

/**
 * Utility type to include soft-deleted records in query results
 * 
 * Used when explicitly querying for deleted records alongside active ones.
 * 
 * @template T - The entity type being queried
 */
export type WithDeleted<T> = T & {
  includeDeleted: true;
};

/**
 * Repository delete method return type
 * 
 * @property success - Whether delete operation succeeded
 * @property recordsAffected - Number of records soft deleted
 */
export type DeleteResult = {
  success: boolean;
  recordsAffected: number;
};

/**
 * Repository restore method return type
 * 
 * @property success - Whether restore operation succeeded
 * @property recordsRestored - Number of records restored from soft delete
 */
export type RestoreResult = {
  success: boolean;
  recordsRestored: number;
};
