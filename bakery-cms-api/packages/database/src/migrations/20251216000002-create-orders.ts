/**
 * Migration: Create orders table
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('orders', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    order_type: {
      type: DataTypes.ENUM('TEMPORARY', 'CONFIRMED'),
      allowNull: false,
      defaultValue: 'TEMPORARY',
    },
    business_model: {
      type: DataTypes.ENUM('MADE_TO_ORDER', 'READY_TO_SELL', 'HYBRID'),
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
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
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    customer_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  // Create indexes
  await queryInterface.addIndex('orders', ['order_number'], {
    name: 'orders_order_number_unique',
    unique: true,
  });

  await queryInterface.addIndex('orders', ['status'], {
    name: 'orders_status_idx',
  });

  await queryInterface.addIndex('orders', ['order_type'], {
    name: 'orders_order_type_idx',
  });

  await queryInterface.addIndex('orders', ['business_model'], {
    name: 'orders_business_model_idx',
  });

  await queryInterface.addIndex('orders', ['customer_phone'], {
    name: 'orders_customer_phone_idx',
  });

  await queryInterface.addIndex('orders', ['created_at'], {
    name: 'orders_created_at_idx',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('orders');
};
