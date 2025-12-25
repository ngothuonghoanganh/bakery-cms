/**
 * StockMovement Sequelize model
 * Records all inventory changes for audit trail
 */

import { Model, DataTypes, Sequelize } from 'sequelize';
import { MovementType } from '@bakery-cms/common';

/**
 * StockMovement model class
 * Note: Classes are allowed for Sequelize models per constitution override
 * Note: This model does NOT support soft delete (immutable audit log)
 */
export class StockMovementModel extends Model {
  declare id: string;
  declare stockItemId: string;
  declare type: string;
  declare quantity: number;
  declare previousQuantity: number;
  declare newQuantity: number;
  declare reason: string | null;
  declare referenceType: string | null;
  declare referenceId: string | null;
  declare userId: string;
  declare readonly createdAt: Date;
}

/**
 * Initialize StockMovement model
 * Pure function that configures the model
 */
export const initStockMovementModel = (
  sequelize: Sequelize
): typeof StockMovementModel => {
  StockMovementModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      stockItemId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'stock_item_id',
        references: {
          model: 'stock_items',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      type: {
        type: DataTypes.ENUM(
          MovementType.RECEIVED,
          MovementType.USED,
          MovementType.ADJUSTED,
          MovementType.DAMAGED,
          MovementType.EXPIRED
        ),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        validate: {
          notZero(value: number) {
            if (value === 0) {
              throw new Error('Quantity cannot be zero');
            }
          },
        },
      },
      previousQuantity: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        field: 'previous_quantity',
      },
      newQuantity: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        field: 'new_quantity',
        validate: {
          min: 0,
          matchesCalculation(this: StockMovementModel, value: number) {
            const expected = Number(this.previousQuantity) + Number(this.quantity);
            if (Math.abs(value - expected) > 0.001) {
              throw new Error(
                'New quantity must equal previous quantity + quantity'
              );
            }
          },
        },
      },
      reason: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          requiredForTypes(this: StockMovementModel, value: string | null) {
            const requiresReason = [
              MovementType.ADJUSTED,
              MovementType.DAMAGED,
              MovementType.EXPIRED,
            ];
            if (requiresReason.includes(this['type'] as MovementType) && !value) {
              throw new Error(`Reason is required for movement type: ${this['type']}`);
            }
          },
        },
      },
      referenceType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'reference_type',
      },
      referenceId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'reference_id',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
    },
    {
      sequelize,
      tableName: 'stock_movements',
      timestamps: true,
      updatedAt: false,
      paranoid: false,
      underscored: true,
      indexes: [
        {
          fields: ['stock_item_id'],
          name: 'idx_sm_stock_item_id',
        },
        {
          fields: ['type'],
          name: 'idx_sm_type',
        },
        {
          fields: ['created_at'],
          name: 'idx_sm_created_at',
        },
        {
          fields: ['user_id'],
          name: 'idx_sm_user_id',
        },
        {
          fields: ['reference_type', 'reference_id'],
          name: 'idx_sm_reference',
        },
      ],
    }
  );

  return StockMovementModel;
};
