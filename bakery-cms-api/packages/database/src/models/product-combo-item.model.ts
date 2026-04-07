/**
 * ProductComboItem Sequelize model
 * Junction table linking combo products to child products with quantities
 */

import { Model, DataTypes, Sequelize } from 'sequelize';

/**
 * ProductComboItem model class
 */
export class ProductComboItemModel extends Model {
  declare id: string;
  declare comboProductId: string;
  declare itemProductId: string;
  declare quantity: number;
  declare displayOrder: number;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize ProductComboItem model
 */
export const initProductComboItemModel = (
  sequelize: Sequelize
): typeof ProductComboItemModel => {
  ProductComboItemModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      comboProductId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        field: 'combo_product_id',
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      itemProductId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        field: 'item_product_id',
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        validate: {
          min: 0.001,
          isDecimal: true,
        },
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'display_order',
      },
    },
    {
      sequelize,
      tableName: 'product_combo_items',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        {
          fields: ['combo_product_id'],
          name: 'idx_pci_combo_product_id',
        },
        {
          fields: ['item_product_id'],
          name: 'idx_pci_item_product_id',
        },
        {
          fields: ['combo_product_id', 'display_order'],
          name: 'idx_pci_combo_display_order',
        },
      ],
    }
  );

  return ProductComboItemModel;
};
