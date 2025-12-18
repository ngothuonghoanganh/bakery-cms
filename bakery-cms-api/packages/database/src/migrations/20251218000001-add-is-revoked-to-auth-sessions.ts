/**
 * Migration: Add is_revoked to auth_sessions
 * 
 * Adds the is_revoked field to auth_sessions table to support explicit
 * session revocation separate from expiration. This enables:
 * - Logout functionality (revoke refresh tokens)
 * - Security features (revoke all user sessions)
 * - Session management (revoke specific sessions)
 */

import { QueryInterface, DataTypes } from 'sequelize';

const tableName = 'auth_sessions';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Add is_revoked column
  await queryInterface.addColumn(tableName, 'is_revoked', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether this session has been explicitly revoked',
  });

  // Add index for revocation queries
  await queryInterface.addIndex(tableName, ['is_revoked'], {
    name: 'auth_sessions_is_revoked_index',
  });

  // Add composite index for active non-revoked sessions
  await queryInterface.addIndex(tableName, ['user_id', 'is_revoked', 'is_active'], {
    name: 'auth_sessions_user_id_is_revoked_is_active_index',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Drop indexes first
  await queryInterface.removeIndex(tableName, 'auth_sessions_is_revoked_index');
  await queryInterface.removeIndex(tableName, 'auth_sessions_user_id_is_revoked_is_active_index');

  // Drop column
  await queryInterface.removeColumn(tableName, 'is_revoked');
};
