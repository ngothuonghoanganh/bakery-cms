import { randomUUID } from 'crypto';
import { QueryTypes } from 'sequelize';
import { DataTypes, QueryInterface } from 'sequelize';

const STOCK_ITEMS_TABLE = 'stock_items';
const STOCK_ITEM_BRANDS_TABLE = 'stock_item_brands';
const ORDER_ITEMS_TABLE = 'order_items';
const STOCK_MOVEMENTS_TABLE = 'stock_movements';
const RECIPES_TABLE = 'recipes';
const RECIPE_VERSIONS_TABLE = 'recipe_versions';
const RECIPE_VERSION_ITEMS_TABLE = 'recipe_version_items';

const addIndexIfMissing = async (
  queryInterface: QueryInterface,
  tableName: string,
  indexName: string,
  fields: string[],
  options: { unique?: boolean; where?: Record<string, unknown> } = {}
): Promise<void> => {
  const indexes = (await queryInterface.showIndex(tableName)) as Array<{
    name: string;
  }>;
  const hasIndex = indexes.some((index) => index.name === indexName);
  if (!hasIndex) {
    await queryInterface.addIndex(tableName, fields, {
      name: indexName,
      unique: options.unique ?? false,
      where: options.where,
    });
  }
};

const removeIndexIfExists = async (
  queryInterface: QueryInterface,
  tableName: string,
  indexName: string
): Promise<void> => {
  const indexes = (await queryInterface.showIndex(tableName)) as Array<{
    name: string;
  }>;
  const hasIndex = indexes.some((index) => index.name === indexName);
  if (hasIndex) {
    await queryInterface.removeIndex(tableName, indexName);
  }
};

const removeConstraintIfExists = async (
  queryInterface: QueryInterface,
  tableName: string,
  constraintName: string
): Promise<void> => {
  try {
    await queryInterface.removeConstraint(tableName, constraintName);
  } catch {
    // no-op
  }
};

const getBaseUnitByStockUnitType = (
  unitType: string | null
): 'piece' | 'gram' | 'milliliter' => {
  if (unitType === 'weight') {
    return 'gram';
  }
  if (unitType === 'volume') {
    return 'milliliter';
  }
  return 'piece';
};

const getYieldBaseUnitBySaleUnitType = (
  saleUnitType: string | null
): 'piece' | 'gram' => {
  if (saleUnitType === 'weight') {
    return 'gram';
  }
  return 'piece';
};

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const stockItemsTable = await queryInterface.describeTable(STOCK_ITEMS_TABLE);
  const orderItemsTable = await queryInterface.describeTable(ORDER_ITEMS_TABLE);
  const stockMovementsTable = await queryInterface.describeTable(
    STOCK_MOVEMENTS_TABLE
  );

  await queryInterface.changeColumn(STOCK_ITEMS_TABLE, 'unit_type', {
    type: DataTypes.ENUM('piece', 'weight', 'volume'),
    allowNull: false,
    defaultValue: 'piece',
  });

  if (!stockItemsTable['base_unit']) {
    await queryInterface.addColumn(STOCK_ITEMS_TABLE, 'base_unit', {
      type: DataTypes.ENUM('piece', 'gram', 'milliliter'),
      allowNull: true,
      defaultValue: 'piece',
    });
  }

  await queryInterface.sequelize.query(`
    UPDATE ${STOCK_ITEMS_TABLE}
    SET
      unit_of_measure = CASE
        WHEN unit_type = 'weight' THEN 'gram'
        WHEN unit_type = 'volume' THEN 'milliliter'
        ELSE 'piece'
      END,
      base_unit = CASE
        WHEN unit_type = 'weight' THEN 'gram'
        WHEN unit_type = 'volume' THEN 'milliliter'
        ELSE 'piece'
      END
  `);

  await queryInterface.changeColumn(STOCK_ITEMS_TABLE, 'base_unit', {
    type: DataTypes.ENUM('piece', 'gram', 'milliliter'),
    allowNull: false,
    defaultValue: 'piece',
  });

  await addIndexIfMissing(
    queryInterface,
    STOCK_ITEMS_TABLE,
    'idx_stock_items_base_unit',
    ['base_unit']
  );

  await queryInterface.changeColumn(STOCK_ITEM_BRANDS_TABLE, 'purchase_unit', {
    type: DataTypes.ENUM('piece', 'gram', 'kilogram', 'milliliter', 'liter'),
    allowNull: false,
    defaultValue: 'piece',
  });

  await queryInterface.changeColumn(ORDER_ITEMS_TABLE, 'quantity', {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
  });

  if (!orderItemsTable['sale_unit']) {
    await queryInterface.addColumn(ORDER_ITEMS_TABLE, 'sale_unit', {
      type: DataTypes.ENUM('piece', 'gram', 'kilogram', 'milliliter', 'liter'),
      allowNull: true,
      defaultValue: 'piece',
    });
  }
  if (!orderItemsTable['sale_quantity_base']) {
    await queryInterface.addColumn(ORDER_ITEMS_TABLE, 'sale_quantity_base', {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    });
  }
  if (!orderItemsTable['sale_base_unit']) {
    await queryInterface.addColumn(ORDER_ITEMS_TABLE, 'sale_base_unit', {
      type: DataTypes.ENUM('piece', 'gram', 'milliliter'),
      allowNull: true,
      defaultValue: 'piece',
    });
  }
  if (!orderItemsTable['recipe_id']) {
    await queryInterface.addColumn(ORDER_ITEMS_TABLE, 'recipe_id', {
      type: DataTypes.UUID,
      allowNull: true,
    });
  }
  if (!orderItemsTable['recipe_version_id']) {
    await queryInterface.addColumn(ORDER_ITEMS_TABLE, 'recipe_version_id', {
      type: DataTypes.UUID,
      allowNull: true,
    });
  }
  if (!orderItemsTable['recipe_name_snapshot']) {
    await queryInterface.addColumn(ORDER_ITEMS_TABLE, 'recipe_name_snapshot', {
      type: DataTypes.STRING(255),
      allowNull: true,
    });
  }
  if (!orderItemsTable['recipe_version_snapshot']) {
    await queryInterface.addColumn(
      ORDER_ITEMS_TABLE,
      'recipe_version_snapshot',
      {
        type: DataTypes.INTEGER,
        allowNull: true,
      }
    );
  }
  if (!orderItemsTable['recipe_estimated_cost_snapshot']) {
    await queryInterface.addColumn(
      ORDER_ITEMS_TABLE,
      'recipe_estimated_cost_snapshot',
      {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: true,
      }
    );
  }

  await queryInterface.sequelize.query(`
    UPDATE ${ORDER_ITEMS_TABLE}
    SET
      sale_unit = CASE WHEN sale_unit_type = 'weight' THEN 'gram' ELSE 'piece' END,
      sale_base_unit = CASE WHEN sale_unit_type = 'weight' THEN 'gram' ELSE 'piece' END,
      sale_quantity_base = quantity
    WHERE sale_quantity_base IS NULL
  `);

  await queryInterface.changeColumn(ORDER_ITEMS_TABLE, 'sale_unit', {
    type: DataTypes.ENUM('piece', 'gram', 'kilogram', 'milliliter', 'liter'),
    allowNull: false,
    defaultValue: 'piece',
  });
  await queryInterface.changeColumn(ORDER_ITEMS_TABLE, 'sale_base_unit', {
    type: DataTypes.ENUM('piece', 'gram', 'milliliter'),
    allowNull: false,
    defaultValue: 'piece',
  });
  await queryInterface.changeColumn(ORDER_ITEMS_TABLE, 'sale_quantity_base', {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
  });

  await addIndexIfMissing(
    queryInterface,
    ORDER_ITEMS_TABLE,
    'idx_order_items_recipe_id',
    ['recipe_id']
  );
  await addIndexIfMissing(
    queryInterface,
    ORDER_ITEMS_TABLE,
    'idx_order_items_recipe_version_id',
    ['recipe_version_id']
  );

  if (!stockMovementsTable['unit_cost_snapshot']) {
    await queryInterface.addColumn(STOCK_MOVEMENTS_TABLE, 'unit_cost_snapshot', {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: true,
    });
  }
  if (!stockMovementsTable['total_cost_snapshot']) {
    await queryInterface.addColumn(
      STOCK_MOVEMENTS_TABLE,
      'total_cost_snapshot',
      {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: true,
      }
    );
  }
  if (!stockMovementsTable['costing_method']) {
    await queryInterface.addColumn(STOCK_MOVEMENTS_TABLE, 'costing_method', {
      type: DataTypes.ENUM('preferred_brand_price'),
      allowNull: true,
    });
  }
  await addIndexIfMissing(
    queryInterface,
    STOCK_MOVEMENTS_TABLE,
    'idx_sm_costing_method',
    ['costing_method']
  );

  await queryInterface.createTable(RECIPES_TABLE, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    product_id: {
      // Keep compatibility with legacy products.id (VARCHAR(36) in existing DBs)
      // to avoid FK incompatibility with UUID->CHAR(36) BINARY generated type.
      type: DataTypes.STRING(36),
      allowNull: false,
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
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    note: {
      type: DataTypes.TEXT,
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await addIndexIfMissing(
    queryInterface,
    RECIPES_TABLE,
    'idx_recipes_product_id',
    ['product_id']
  );
  await addIndexIfMissing(
    queryInterface,
    RECIPES_TABLE,
    'idx_recipes_status',
    ['status']
  );
  await addIndexIfMissing(
    queryInterface,
    RECIPES_TABLE,
    'idx_recipes_is_default',
    ['is_default']
  );
  await addIndexIfMissing(
    queryInterface,
    RECIPES_TABLE,
    'idx_recipes_unique_default_active_per_product',
    ['product_id', 'is_default', 'status'],
    {
      unique: true,
      where: {
        is_default: true,
        status: 'active',
        deleted_at: null,
      },
    }
  );

  await queryInterface.createTable(RECIPE_VERSIONS_TABLE, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    recipe_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: RECIPES_TABLE,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    version_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    yield_quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    yield_unit: {
      type: DataTypes.ENUM('piece', 'gram', 'kilogram', 'milliliter', 'liter'),
      allowNull: false,
    },
    yield_base_quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    yield_base_unit: {
      type: DataTypes.ENUM('piece', 'gram', 'milliliter'),
      allowNull: false,
    },
    estimated_cost: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    costing_method: {
      type: DataTypes.ENUM('preferred_brand_price'),
      allowNull: false,
      defaultValue: 'preferred_brand_price',
    },
    effective_from: {
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await addIndexIfMissing(
    queryInterface,
    RECIPE_VERSIONS_TABLE,
    'idx_recipe_versions_recipe_id',
    ['recipe_id']
  );
  await addIndexIfMissing(
    queryInterface,
    RECIPE_VERSIONS_TABLE,
    'idx_recipe_versions_status',
    ['status']
  );
  await addIndexIfMissing(
    queryInterface,
    RECIPE_VERSIONS_TABLE,
    'idx_recipe_versions_unique_recipe_version',
    ['recipe_id', 'version_number'],
    {
      unique: true,
      where: {
        deleted_at: null,
      },
    }
  );

  await queryInterface.createTable(RECIPE_VERSION_ITEMS_TABLE, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    recipe_version_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: RECIPE_VERSIONS_TABLE,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    stock_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: STOCK_ITEMS_TABLE,
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    unit: {
      type: DataTypes.ENUM('piece', 'gram', 'kilogram', 'milliliter', 'liter'),
      allowNull: false,
    },
    base_quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    base_unit: {
      type: DataTypes.ENUM('piece', 'gram', 'milliliter'),
      allowNull: false,
    },
    waste_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    preferred_brand_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'brands',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    unit_cost_snapshot: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false,
      defaultValue: 0,
    },
    total_cost_snapshot: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false,
      defaultValue: 0,
    },
    note: {
      type: DataTypes.TEXT,
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await addIndexIfMissing(
    queryInterface,
    RECIPE_VERSION_ITEMS_TABLE,
    'idx_rvi_recipe_version_id',
    ['recipe_version_id']
  );
  await addIndexIfMissing(
    queryInterface,
    RECIPE_VERSION_ITEMS_TABLE,
    'idx_rvi_stock_item_id',
    ['stock_item_id']
  );
  await addIndexIfMissing(
    queryInterface,
    RECIPE_VERSION_ITEMS_TABLE,
    'idx_rvi_preferred_brand_id',
    ['preferred_brand_id']
  );

  await queryInterface.addConstraint(ORDER_ITEMS_TABLE, {
    fields: ['recipe_id'],
    type: 'foreign key',
    name: 'fk_order_items_recipe_id',
    references: {
      table: RECIPES_TABLE,
      field: 'id',
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  await queryInterface.addConstraint(ORDER_ITEMS_TABLE, {
    fields: ['recipe_version_id'],
    type: 'foreign key',
    name: 'fk_order_items_recipe_version_id',
    references: {
      table: RECIPE_VERSIONS_TABLE,
      field: 'id',
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  const productsWithStockItems = (await queryInterface.sequelize.query(
    `
      SELECT DISTINCT
        p.id AS productId,
        p.sale_unit_type AS saleUnitType
      FROM products p
      INNER JOIN product_stock_items psi
        ON psi.product_id = p.id
       AND psi.deleted_at IS NULL
      WHERE p.deleted_at IS NULL
    `,
    {
      type: QueryTypes.SELECT,
    }
  )) as Array<{ productId: string; saleUnitType: string | null }>;

  for (const product of productsWithStockItems) {
    const now = new Date();
    const recipeId = randomUUID();
    const recipeVersionId = randomUUID();
    const yieldBaseUnit = getYieldBaseUnitBySaleUnitType(product.saleUnitType);
    const yieldUnit = yieldBaseUnit;

    await queryInterface.bulkInsert(RECIPES_TABLE, [
      {
        id: recipeId,
        product_id: product.productId,
        name: 'Default Recipe',
        is_default: true,
        status: 'active',
        note: 'Auto migrated from product_stock_items',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);

    await queryInterface.bulkInsert(RECIPE_VERSIONS_TABLE, [
      {
        id: recipeVersionId,
        recipe_id: recipeId,
        version_number: 1,
        status: 'active',
        yield_quantity: 1,
        yield_unit: yieldUnit,
        yield_base_quantity: 1,
        yield_base_unit: yieldBaseUnit,
        estimated_cost: 0,
        costing_method: 'preferred_brand_price',
        effective_from: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);

    const ingredients = (await queryInterface.sequelize.query(
      `
        SELECT
          psi.stock_item_id AS stockItemId,
          psi.quantity AS quantity,
          psi.preferred_brand_id AS preferredBrandId,
          psi.notes AS note,
          si.unit_type AS stockUnitType,
          sib.unit_price_after_tax AS unitPriceAfterTax
        FROM product_stock_items psi
        INNER JOIN stock_items si
          ON si.id = psi.stock_item_id
        LEFT JOIN stock_item_brands sib
          ON sib.stock_item_id = psi.stock_item_id
         AND sib.brand_id = psi.preferred_brand_id
         AND sib.deleted_at IS NULL
        WHERE psi.product_id = :productId
          AND psi.deleted_at IS NULL
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          productId: product.productId,
        },
      }
    )) as Array<{
      stockItemId: string;
      quantity: string | number;
      preferredBrandId: string | null;
      note: string | null;
      stockUnitType: string | null;
      unitPriceAfterTax: string | number | null;
    }>;

    let totalEstimatedCost = 0;
    const recipeVersionItems: Record<string, unknown>[] = [];

    for (const ingredient of ingredients) {
      const baseUnit = getBaseUnitByStockUnitType(ingredient.stockUnitType);
      const quantity = Number(ingredient.quantity);
      const unitCostSnapshot = Number(ingredient.unitPriceAfterTax ?? 0);
      const totalCostSnapshot = quantity * unitCostSnapshot;
      totalEstimatedCost += totalCostSnapshot;

      recipeVersionItems.push({
        id: randomUUID(),
        recipe_version_id: recipeVersionId,
        stock_item_id: ingredient.stockItemId,
        quantity,
        unit: baseUnit,
        base_quantity: quantity,
        base_unit: baseUnit,
        waste_percent: 0,
        preferred_brand_id: ingredient.preferredBrandId,
        unit_cost_snapshot: unitCostSnapshot,
        total_cost_snapshot: totalCostSnapshot,
        note: ingredient.note,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
    }

    if (recipeVersionItems.length > 0) {
      await queryInterface.bulkInsert(RECIPE_VERSION_ITEMS_TABLE, recipeVersionItems);
    }

    await queryInterface.bulkUpdate(
      RECIPE_VERSIONS_TABLE,
      {
        estimated_cost: Math.round(totalEstimatedCost * 100) / 100,
      },
      {
        id: recipeVersionId,
      }
    );
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await removeIndexIfExists(
    queryInterface,
    STOCK_MOVEMENTS_TABLE,
    'idx_sm_costing_method'
  );
  await removeIndexIfExists(
    queryInterface,
    ORDER_ITEMS_TABLE,
    'idx_order_items_recipe_version_id'
  );
  await removeIndexIfExists(
    queryInterface,
    ORDER_ITEMS_TABLE,
    'idx_order_items_recipe_id'
  );
  await removeIndexIfExists(
    queryInterface,
    STOCK_ITEMS_TABLE,
    'idx_stock_items_base_unit'
  );

  await queryInterface.dropTable(RECIPE_VERSION_ITEMS_TABLE);
  await queryInterface.dropTable(RECIPE_VERSIONS_TABLE);
  await queryInterface.dropTable(RECIPES_TABLE);

  const orderItemsTable = await queryInterface.describeTable(ORDER_ITEMS_TABLE);
  if (orderItemsTable['recipe_estimated_cost_snapshot']) {
    await queryInterface.removeColumn(
      ORDER_ITEMS_TABLE,
      'recipe_estimated_cost_snapshot'
    );
  }
  if (orderItemsTable['recipe_version_snapshot']) {
    await queryInterface.removeColumn(ORDER_ITEMS_TABLE, 'recipe_version_snapshot');
  }
  if (orderItemsTable['recipe_name_snapshot']) {
    await queryInterface.removeColumn(ORDER_ITEMS_TABLE, 'recipe_name_snapshot');
  }
  if (orderItemsTable['recipe_version_id']) {
    await removeConstraintIfExists(
      queryInterface,
      ORDER_ITEMS_TABLE,
      'fk_order_items_recipe_version_id'
    );
    await queryInterface.removeColumn(ORDER_ITEMS_TABLE, 'recipe_version_id');
  }
  if (orderItemsTable['recipe_id']) {
    await removeConstraintIfExists(
      queryInterface,
      ORDER_ITEMS_TABLE,
      'fk_order_items_recipe_id'
    );
    await queryInterface.removeColumn(ORDER_ITEMS_TABLE, 'recipe_id');
  }
  if (orderItemsTable['sale_base_unit']) {
    await queryInterface.removeColumn(ORDER_ITEMS_TABLE, 'sale_base_unit');
  }
  if (orderItemsTable['sale_quantity_base']) {
    await queryInterface.removeColumn(ORDER_ITEMS_TABLE, 'sale_quantity_base');
  }
  if (orderItemsTable['sale_unit']) {
    await queryInterface.removeColumn(ORDER_ITEMS_TABLE, 'sale_unit');
  }

  const stockMovementsTable = await queryInterface.describeTable(STOCK_MOVEMENTS_TABLE);
  if (stockMovementsTable['costing_method']) {
    await queryInterface.removeColumn(STOCK_MOVEMENTS_TABLE, 'costing_method');
  }
  if (stockMovementsTable['total_cost_snapshot']) {
    await queryInterface.removeColumn(STOCK_MOVEMENTS_TABLE, 'total_cost_snapshot');
  }
  if (stockMovementsTable['unit_cost_snapshot']) {
    await queryInterface.removeColumn(STOCK_MOVEMENTS_TABLE, 'unit_cost_snapshot');
  }

  const stockItemsTable = await queryInterface.describeTable(STOCK_ITEMS_TABLE);
  if (stockItemsTable['base_unit']) {
    await queryInterface.removeColumn(STOCK_ITEMS_TABLE, 'base_unit');
  }
};
