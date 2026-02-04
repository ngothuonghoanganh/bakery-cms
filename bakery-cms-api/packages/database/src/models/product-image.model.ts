/**
 * ProductImage model definition
 * Represents the junction table between products and files for multiple images
 */

import { Model, DataTypes, Sequelize } from 'sequelize';

export class ProductImageModel extends Model {
  declare id: string;
  declare productId: string;
  declare fileId: string;
  declare displayOrder: number;
  declare isPrimary: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize ProductImage model
 * Pure function that configures the model with the given Sequelize instance
 */
export const initProductImageModel = (sequelize: Sequelize): typeof ProductImageModel => {
  ProductImageModel.init(
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      productId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'product_id',
      },
      fileId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'file_id',
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'display_order',
      },
      isPrimary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_primary',
      },
    },
    {
      sequelize,
      tableName: 'product_images',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return ProductImageModel;
};
