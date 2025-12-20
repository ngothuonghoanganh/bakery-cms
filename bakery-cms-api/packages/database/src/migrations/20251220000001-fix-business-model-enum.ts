/**
 * Migration: Fix enum values to match application code
 * Updates order_type, business_model, and status columns to use correct enum values
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Fix order_type enum values
  await queryInterface.changeColumn('orders', 'order_type', {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'temporary',
  });

  // Fix business_model enum values  
  await queryInterface.changeColumn('orders', 'business_model', {
    type: DataTypes.STRING(50),
    allowNull: false,
  });

  // Fix status enum values to match application code
  await queryInterface.changeColumn('orders', 'status', {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'draft',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Revert to the original ENUM values
  await queryInterface.changeColumn('orders', 'order_type', {
    type: DataTypes.ENUM('TEMPORARY', 'CONFIRMED'),
    allowNull: false,
    defaultValue: 'TEMPORARY',
  });

  await queryInterface.changeColumn('orders', 'business_model', {
    type: DataTypes.ENUM('MADE_TO_ORDER', 'READY_TO_SELL', 'HYBRID'),
    allowNull: false,
  });

  await queryInterface.changeColumn('orders', 'status', {
    type: DataTypes.ENUM(
      'DRAFT',
      'PENDING_PAYMENT', 
      'PAYMENT_RECEIVED',
      'CONFIRMED',
      'IN_PRODUCTION',
      'READY_FOR_PICKUP',
      'COMPLETED',
      'CANCELLED'
    ),
    allowNull: false,
    defaultValue: 'DRAFT',
  });
};