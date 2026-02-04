/**
 * Brand Sequelize model
 * Represents brands/suppliers for stock items
 */

import { Model, DataTypes, Sequelize } from 'sequelize';

/**
 * Brand model class
 * Note: Classes are allowed for Sequelize models per constitution override
 */
export class BrandModel extends Model {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare isActive: boolean;
  declare imageFileId: string | null;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize Brand model
 * Pure function that configures the model
 */
export const initBrandModel = (sequelize: Sequelize): typeof BrandModel => {
  BrandModel.init(
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
        unique: true,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      imageFileId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'image_file_id',
        references: {
          model: 'files',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      tableName: 'brands',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        {
          fields: ['name'],
          name: 'idx_brands_name',
        },
        {
          fields: ['is_active'],
          name: 'idx_brands_is_active',
        },
        {
          fields: ['deleted_at'],
          name: 'idx_brands_deleted_at',
        },
      ],
    }
  );

  return BrandModel;
};
