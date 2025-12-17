/**
 * Product Sequelize model
 * Represents products in the catalog (cookies)
 */

import { Model, DataTypes, Sequelize } from 'sequelize';
import { BusinessType, ProductStatus } from '@bakery-cms/common';

/**
 * Product model class
 * Note: Classes are allowed for Sequelize models per constitution override
 */
export class ProductModel extends Model {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare price: number;
  declare category: string | null;
  declare businessType: string;
  declare status: string;
  declare imageUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize Product model
 * Pure function that configures the model
 */
export const initProductModel = (sequelize: Sequelize): typeof ProductModel => {
  ProductModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, 1000],
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
          isDecimal: true,
        },
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      businessType: {
        type: DataTypes.ENUM(...Object.values(BusinessType)),
        allowNull: false,
        field: 'business_type',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(ProductStatus)),
        allowNull: false,
        defaultValue: ProductStatus.AVAILABLE,
      },
      imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'image_url',
        validate: {
          isUrl: true,
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: 'products',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['category'],
        },
        {
          fields: ['business_type'],
        },
        {
          fields: ['status'],
        },
      ],
    }
  );

  return ProductModel;
};
