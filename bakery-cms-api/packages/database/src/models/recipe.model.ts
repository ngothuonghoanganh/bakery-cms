import { DataTypes, Model, Sequelize } from 'sequelize';
import { RecipeStatus } from '@bakery-cms/common';

export class RecipeModel extends Model {
  declare id: string;
  declare productId: string;
  declare name: string;
  declare isDefault: boolean;
  declare status: string;
  declare note: string | null;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initRecipeModel = (sequelize: Sequelize): typeof RecipeModel => {
  RecipeModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_id',
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_default',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(RecipeStatus)),
        allowNull: false,
        defaultValue: RecipeStatus.DRAFT,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'recipes',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        {
          fields: ['product_id'],
          name: 'idx_recipes_product_id',
        },
        {
          fields: ['status'],
          name: 'idx_recipes_status',
        },
        {
          fields: ['is_default'],
          name: 'idx_recipes_is_default',
        },
      ],
    }
  );

  return RecipeModel;
};
