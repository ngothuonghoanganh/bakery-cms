/**
 * ProductRecipe component
 * Recipe management for product:
 * - Recipe list
 * - Recipe versions
 * - Version ingredients
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Popconfirm,
  Typography,
  Spin,
  Alert,
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  Tag,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useStockItems } from '@/hooks/useStockItems';
import { stockService } from '@/services/stock.service';
import { useNotification } from '@/hooks/useNotification';
import { useCrudErrorNotification } from '@/hooks/useCrudErrorNotification';
import { StockPurchaseUnit, StockUnitType } from '@bakery-cms/common';
import type {
  ProductRecipeProps,
  RecipeFormValues,
  RecipeVersionFormValues,
  RecipeVersionItemFormValues,
} from './ProductRecipe.types';
import type {
  ProductCost,
  Recipe,
  RecipeStatus,
  RecipeVersion,
  RecipeVersionDetail,
  RecipeVersionItem,
  StockItem,
  StockItemBrand,
} from '@/types/models/stock.model';

const { Text } = Typography;
const { TextArea } = Input;

export const ProductRecipe: React.FC<ProductRecipeProps> = ({
  productId,
  onRecipeChange,
}) => {
  const { t } = useTranslation();
  const { stockItems } = useStockItems({ pagination: { limit: 200 } });
  const { success } = useNotification();
  const { showCrudError } = useCrudErrorNotification();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<readonly Recipe[]>([]);
  const [cost, setCost] = useState<ProductCost | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [versionDetail, setVersionDetail] = useState<RecipeVersionDetail | null>(
    null
  );
  const [versionLoading, setVersionLoading] = useState(false);

  const [recipeForm] = Form.useForm<RecipeFormValues>();
  const [versionForm] = Form.useForm<RecipeVersionFormValues>();
  const [ingredientForm] = Form.useForm<RecipeVersionItemFormValues>();

  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [recipeModalMode, setRecipeModalMode] = useState<'create' | 'edit'>(
    'create'
  );
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versionModalMode, setVersionModalMode] = useState<'create' | 'edit'>(
    'create'
  );

  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] =
    useState<RecipeVersionItem | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [brandOptions, setBrandOptions] = useState<readonly StockItemBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const selectedStockItemId = Form.useWatch('stockItemId', ingredientForm);

  const sortedRecipes = useMemo(
    () =>
      [...recipes].sort((a, b) => {
        if (a.isDefault !== b.isDefault) {
          return Number(b.isDefault) - Number(a.isDefault);
        }
        return a.name.localeCompare(b.name);
      }),
    [recipes]
  );

  const selectedRecipe = useMemo(
    () => sortedRecipes.find((recipe) => recipe.id === selectedRecipeId) ?? null,
    [selectedRecipeId, sortedRecipes]
  );

  const versionOptions = useMemo(() => {
    if (!selectedRecipe?.versions) {
      return [];
    }

    return [...selectedRecipe.versions].sort(
      (a, b) => b.versionNumber - a.versionNumber
    );
  }, [selectedRecipe?.versions]);

  const currentSelectedVersion = useMemo(() => {
    if (!selectedVersionId) {
      return null;
    }
    return versionOptions.find((version) => version.id === selectedVersionId) ?? null;
  }, [selectedVersionId, versionOptions]);

  const linkedStockItemIds = useMemo(() => {
    return new Set((versionDetail?.items || []).map((item) => item.stockItemId));
  }, [versionDetail?.items]);

  const selectableStockItems = useMemo((): StockItem[] => {
    if (!stockItems || stockItems.length === 0) {
      return [];
    }
    if (editingIngredient) {
      return [...stockItems];
    }
    return stockItems.filter((item) => !linkedStockItemIds.has(item.id));
  }, [editingIngredient, linkedStockItemIds, stockItems]);

  const getActiveVersion = useCallback((recipe: Recipe): RecipeVersion | null => {
    const activeVersions = (recipe.versions || [])
      .filter((version) => version.status === 'active')
      .sort((a, b) => b.versionNumber - a.versionNumber);
    return activeVersions[0] || null;
  }, []);

  const loadRecipesAndCost = useCallback(async () => {
    if (!productId) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const [recipesResult, costResult] = await Promise.all([
      stockService.getRecipesByProduct(productId),
      stockService.getProductCost(productId),
    ]);

    if (!recipesResult.success) {
      setErrorMessage(recipesResult.error.message);
      setRecipes([]);
      setCost(null);
      setLoading(false);
      return;
    }

    const loadedRecipes = recipesResult.data || [];
    setRecipes(loadedRecipes);
    setCost(costResult.success ? costResult.data : null);

    setSelectedRecipeId((currentSelectedRecipeId) => {
      if (
        currentSelectedRecipeId &&
        loadedRecipes.some((recipe) => recipe.id === currentSelectedRecipeId)
      ) {
        return currentSelectedRecipeId;
      }

      const defaultRecipe = loadedRecipes.find((recipe) => recipe.isDefault);
      return defaultRecipe?.id || loadedRecipes[0]?.id || null;
    });

    setLoading(false);
  }, [productId]);

  useEffect(() => {
    void loadRecipesAndCost();
  }, [loadRecipesAndCost]);

  useEffect(() => {
    if (!selectedRecipe) {
      setSelectedVersionId(null);
      return;
    }

    setSelectedVersionId((currentSelectedVersionId) => {
      const versions = selectedRecipe.versions || [];
      if (versions.length === 0) {
        return null;
      }

      if (
        currentSelectedVersionId &&
        versions.some((version) => version.id === currentSelectedVersionId)
      ) {
        return currentSelectedVersionId;
      }

      const activeVersion = getActiveVersion(selectedRecipe);
      return activeVersion?.id || versions[0]?.id || null;
    });
  }, [getActiveVersion, selectedRecipe]);

  const loadSelectedVersionDetail = useCallback(async () => {
    if (!productId || !selectedRecipeId || !selectedVersionId) {
      setVersionDetail(null);
      return;
    }

    setVersionLoading(true);
    const detailResult = await stockService.getRecipeVersionDetail(
      productId,
      selectedRecipeId,
      selectedVersionId
    );

    if (detailResult.success) {
      setVersionDetail(detailResult.data);
    } else {
      setVersionDetail(null);
      showCrudError(detailResult.error);
    }
    setVersionLoading(false);
  }, [productId, selectedRecipeId, selectedVersionId, showCrudError]);

  useEffect(() => {
    void loadSelectedVersionDetail();
  }, [loadSelectedVersionDetail]);

  const handleCreateRecipe = useCallback(() => {
    setRecipeModalMode('create');
    setEditingRecipe(null);
    recipeForm.setFieldsValue({
      name: '',
      status: 'draft',
      isDefault: false,
      note: '',
    });
    setRecipeModalOpen(true);
  }, [recipeForm]);

  const handleEditRecipe = useCallback(
    (recipe: Recipe) => {
      setRecipeModalMode('edit');
      setEditingRecipe(recipe);
      recipeForm.setFieldsValue({
        name: recipe.name,
        status: recipe.status,
        isDefault: recipe.isDefault,
        note: recipe.note || '',
      });
      setRecipeModalOpen(true);
    },
    [recipeForm]
  );

  const handleSubmitRecipe = useCallback(
    async (values: RecipeFormValues) => {
      if (!productId) {
        return;
      }

      setSubmitting(true);
      try {
        if (recipeModalMode === 'create') {
          const createResult = await stockService.createRecipe(productId, {
            name: values.name,
            status: values.status,
            isDefault: values.isDefault,
            note: values.note,
          });

          if (!createResult.success) {
            showCrudError(createResult.error);
            return;
          }

          success(
            t('stock.recipe.recipeCreated', 'Recipe created'),
            t('stock.recipe.recipeCreatedMessage', 'Recipe has been created.')
          );
          setSelectedRecipeId(createResult.data.id);
        } else if (editingRecipe) {
          const updateResult = await stockService.updateRecipe(
            productId,
            editingRecipe.id,
            {
              name: values.name,
              status: values.status,
              isDefault: values.isDefault,
              note: values.note ?? null,
            }
          );

          if (!updateResult.success) {
            showCrudError(updateResult.error);
            return;
          }

          success(
            t('stock.recipe.recipeUpdated', 'Recipe updated'),
            t('stock.recipe.recipeUpdatedMessage', 'Recipe has been updated.')
          );
          setSelectedRecipeId(updateResult.data.id);
        }

        setRecipeModalOpen(false);
        await loadRecipesAndCost();
        onRecipeChange?.();
      } catch (err) {
        showCrudError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [
      editingRecipe,
      loadRecipesAndCost,
      onRecipeChange,
      productId,
      recipeModalMode,
      showCrudError,
      success,
      t,
    ]
  );

  const handleSetDefaultRecipe = useCallback(
    async (recipe: Recipe) => {
      if (!productId) {
        return;
      }

      const result = await stockService.setDefaultRecipe(productId, recipe.id);
      if (!result.success) {
        showCrudError(result.error);
        return;
      }

      success(
        t('stock.recipe.defaultUpdated', 'Default updated'),
        t('stock.recipe.defaultUpdatedMessage', 'Default recipe was updated.')
      );
      await loadRecipesAndCost();
      onRecipeChange?.();
    },
    [loadRecipesAndCost, onRecipeChange, productId, showCrudError, success, t]
  );

  const handleCreateVersion = useCallback(() => {
    setVersionModalMode('create');
    versionForm.setFieldsValue({
      status: 'draft',
      yieldQuantity: 1,
      yieldUnit: StockPurchaseUnit.PIECE,
    });
    setVersionModalOpen(true);
  }, [versionForm]);

  const handleEditVersion = useCallback(() => {
    if (!versionDetail) {
      return;
    }
    setVersionModalMode('edit');
    versionForm.setFieldsValue({
      status: versionDetail.status,
      yieldQuantity: versionDetail.yieldQuantity,
      yieldUnit: versionDetail.yieldUnit,
      effectiveFrom: versionDetail.effectiveFrom
        ? versionDetail.effectiveFrom.toISOString()
        : null,
    });
    setVersionModalOpen(true);
  }, [versionDetail, versionForm]);

  const handleSubmitVersion = useCallback(
    async (values: RecipeVersionFormValues) => {
      if (!productId || !selectedRecipeId) {
        return;
      }

      setSubmitting(true);
      try {
        if (versionModalMode === 'create') {
          const createResult = await stockService.createRecipeVersion(
            productId,
            selectedRecipeId,
            {
              status: values.status,
              yieldQuantity: values.yieldQuantity,
              yieldUnit: values.yieldUnit,
              effectiveFrom: values.effectiveFrom ?? null,
            }
          );
          if (!createResult.success) {
            showCrudError(createResult.error);
            return;
          }
          success(
            t('stock.recipe.versionCreated', 'Recipe version created'),
            t(
              'stock.recipe.versionCreatedMessage',
              'A new recipe version has been created.'
            )
          );
          setSelectedVersionId(createResult.data.id);
        } else if (selectedVersionId) {
          const updateResult = await stockService.updateRecipeVersion(
            productId,
            selectedRecipeId,
            selectedVersionId,
            {
              status: values.status,
              yieldQuantity: values.yieldQuantity,
              yieldUnit: values.yieldUnit,
              effectiveFrom: values.effectiveFrom ?? null,
            }
          );
          if (!updateResult.success) {
            showCrudError(updateResult.error);
            return;
          }
          success(
            t('stock.recipe.versionUpdated', 'Recipe version updated'),
            t(
              'stock.recipe.versionUpdatedMessage',
              'Recipe version has been updated.'
            )
          );
        }

        setVersionModalOpen(false);
        await loadRecipesAndCost();
        await loadSelectedVersionDetail();
        onRecipeChange?.();
      } catch (err) {
        showCrudError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [
      loadRecipesAndCost,
      loadSelectedVersionDetail,
      onRecipeChange,
      productId,
      selectedRecipeId,
      selectedVersionId,
      showCrudError,
      success,
      t,
      versionModalMode,
    ]
  );

  const handleAddIngredient = useCallback(() => {
    setEditingIngredient(null);
    setBrandOptions([]);
    ingredientForm.resetFields();
    ingredientForm.setFieldsValue({
      quantity: 1,
      unit: StockPurchaseUnit.PIECE,
      wastePercent: 0,
    });
    setIngredientModalOpen(true);
  }, [ingredientForm]);

  const handleEditIngredient = useCallback(
    (item: RecipeVersionItem) => {
      setEditingIngredient(item);
      ingredientForm.setFieldsValue({
        stockItemId: item.stockItemId,
        quantity: item.quantity,
        unit: item.unit,
        wastePercent: item.wastePercent,
        preferredBrandId: item.preferredBrandId || null,
        note: item.note || null,
      });
      setIngredientModalOpen(true);
    },
    [ingredientForm]
  );

  useEffect(() => {
    if (!ingredientModalOpen || !selectedStockItemId) {
      setBrandOptions([]);
      setBrandsLoading(false);
      return;
    }

    let isMounted = true;

    const loadBrands = async (): Promise<void> => {
      setBrandsLoading(true);
      const result = await stockService.getStockItemBrands(selectedStockItemId);

      if (!isMounted) {
        return;
      }

      if (result.success) {
        setBrandOptions(result.data);
        const selectedBrandId = ingredientForm.getFieldValue('preferredBrandId');
        if (
          selectedBrandId &&
          !result.data.some((brand) => brand.brandId === selectedBrandId)
        ) {
          ingredientForm.setFieldValue('preferredBrandId', null);
        }
      } else {
        setBrandOptions([]);
        showCrudError(result.error);
      }

      setBrandsLoading(false);
    };

    void loadBrands();

    return () => {
      isMounted = false;
    };
  }, [ingredientForm, ingredientModalOpen, selectedStockItemId, showCrudError]);

  const getAllowedUnitsByStockItem = useCallback((item?: StockItem): StockPurchaseUnit[] => {
    if (!item) {
      return [StockPurchaseUnit.PIECE];
    }

    if (item.unitType === StockUnitType.WEIGHT) {
      return [StockPurchaseUnit.GRAM, StockPurchaseUnit.KILOGRAM];
    }
    if (item.unitType === StockUnitType.VOLUME) {
      return [StockPurchaseUnit.MILLILITER, StockPurchaseUnit.LITER];
    }
    return [StockPurchaseUnit.PIECE];
  }, []);

  const selectedIngredientStockItem = useMemo(() => {
    if (!selectedStockItemId) {
      return null;
    }
    return stockItems?.find((item) => item.id === selectedStockItemId) || null;
  }, [selectedStockItemId, stockItems]);

  const unitOptionsForIngredient = useMemo(
    () => getAllowedUnitsByStockItem(selectedIngredientStockItem || undefined),
    [getAllowedUnitsByStockItem, selectedIngredientStockItem]
  );

  const handleSubmitIngredient = useCallback(
    async (values: RecipeVersionItemFormValues) => {
      if (!productId || !selectedRecipeId || !selectedVersionId) {
        return;
      }

      setSubmitting(true);
      try {
        if (editingIngredient) {
          const updateResult = await stockService.updateRecipeVersionItem(
            productId,
            selectedRecipeId,
            selectedVersionId,
            editingIngredient.id,
            {
              quantity: values.quantity,
              unit: values.unit,
              wastePercent: values.wastePercent ?? 0,
              preferredBrandId: values.preferredBrandId ?? null,
              note: values.note ?? null,
            }
          );

          if (!updateResult.success) {
            showCrudError(updateResult.error);
            return;
          }
          success(
            t('stock.recipe.ingredientUpdated', 'Ingredient updated'),
            t(
              'stock.recipe.ingredientUpdatedMessage',
              'Ingredient has been updated successfully.'
            )
          );
        } else {
          const createResult = await stockService.createRecipeVersionItem(
            productId,
            selectedRecipeId,
            selectedVersionId,
            {
              stockItemId: values.stockItemId,
              quantity: values.quantity,
              unit: values.unit,
              wastePercent: values.wastePercent ?? 0,
              preferredBrandId: values.preferredBrandId ?? null,
              note: values.note ?? null,
            }
          );

          if (!createResult.success) {
            showCrudError(createResult.error);
            return;
          }
          success(
            t('stock.recipe.ingredientAdded', 'Ingredient added'),
            t(
              'stock.recipe.ingredientAddedMessage',
              'Ingredient has been added successfully.'
            )
          );
        }

        setIngredientModalOpen(false);
        await loadRecipesAndCost();
        await loadSelectedVersionDetail();
        onRecipeChange?.();
      } catch (err) {
        showCrudError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [
      editingIngredient,
      loadRecipesAndCost,
      loadSelectedVersionDetail,
      onRecipeChange,
      productId,
      selectedRecipeId,
      selectedVersionId,
      showCrudError,
      success,
      t,
    ]
  );

  const handleDeleteIngredient = useCallback(
    async (itemId: string) => {
      if (!productId || !selectedRecipeId || !selectedVersionId) {
        return;
      }

      const result = await stockService.deleteRecipeVersionItem(
        productId,
        selectedRecipeId,
        selectedVersionId,
        itemId
      );
      if (!result.success) {
        showCrudError(result.error);
        return;
      }

      success(
        t('stock.recipe.ingredientRemoved', 'Ingredient removed'),
        t(
          'stock.recipe.ingredientRemovedMessage',
          'Ingredient has been removed successfully.'
        )
      );
      await loadRecipesAndCost();
      await loadSelectedVersionDetail();
      onRecipeChange?.();
    },
    [
      loadRecipesAndCost,
      loadSelectedVersionDetail,
      onRecipeChange,
      productId,
      selectedRecipeId,
      selectedVersionId,
      showCrudError,
      success,
      t,
    ]
  );

  const recipeColumns = useMemo(
    () => [
      {
        title: t('stock.recipe.recipeName', 'Recipe'),
        dataIndex: 'name',
        key: 'name',
        render: (name: string, record: Recipe) => (
          <Space>
            <Button
              type={record.id === selectedRecipeId ? 'link' : 'text'}
              onClick={() => setSelectedRecipeId(record.id)}
              style={{
                padding: 0,
                fontWeight: record.id === selectedRecipeId ? 600 : 400,
              }}
            >
              {name}
            </Button>
            {record.isDefault ? (
              <Tag color="gold">{t('stock.recipe.defaultTag', 'Default')}</Tag>
            ) : null}
          </Space>
        ),
      },
      {
        title: t('stock.recipe.status', 'Status'),
        dataIndex: 'status',
        key: 'status',
        render: (status: RecipeStatus) => (
          <Tag
            color={
              status === 'active'
                ? 'green'
                : status === 'draft'
                  ? 'blue'
                  : 'default'
            }
          >
            {status}
          </Tag>
        ),
      },
      {
        title: t('stock.recipe.versions', 'Versions'),
        key: 'versions',
        render: (_: unknown, record: Recipe) => record.versions?.length || 0,
      },
      {
        title: t('common.table.actions'),
        key: 'actions',
        render: (_: unknown, record: Recipe) => (
          <Space size="small">
            <Button
              size="small"
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditRecipe(record)}
            >
              {t('common.actions.edit')}
            </Button>
            {!record.isDefault && record.status === 'active' ? (
              <Button
                size="small"
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => void handleSetDefaultRecipe(record)}
              >
                {t('stock.recipe.setDefault', 'Set default')}
              </Button>
            ) : null}
          </Space>
        ),
      },
    ],
    [handleEditRecipe, handleSetDefaultRecipe, selectedRecipeId, t]
  );

  const ingredientColumns = useMemo(
    () => [
      {
        title: t('stock.recipe.stockItem'),
        dataIndex: 'stockItemName',
        key: 'stockItemName',
      },
      {
        title: t('stock.recipe.quantity'),
        key: 'quantity',
        render: (_: unknown, item: RecipeVersionItem) =>
          `${item.quantity} ${item.unit} (${item.baseQuantity} ${item.baseUnit})`,
      },
      {
        title: t('stock.recipe.wastePercent', 'Waste %'),
        dataIndex: 'wastePercent',
        key: 'wastePercent',
        render: (wastePercent: number) => `${wastePercent}%`,
      },
      {
        title: t('stock.recipe.preferredBrand'),
        dataIndex: 'preferredBrandName',
        key: 'preferredBrandName',
        render: (value: string | null) =>
          value || <Text type="secondary">{t('stock.recipe.noPreference')}</Text>,
      },
      {
        title: t('stock.recipe.unitCostSnapshot', 'Unit Cost'),
        dataIndex: 'unitCostSnapshot',
        key: 'unitCostSnapshot',
        render: (value: number) => `${value.toLocaleString()} VND`,
      },
      {
        title: t('stock.recipe.totalCostSnapshot', 'Total Cost'),
        dataIndex: 'totalCostSnapshot',
        key: 'totalCostSnapshot',
        render: (value: number) => `${value.toLocaleString()} VND`,
      },
      {
        title: t('common.table.actions'),
        key: 'action',
        render: (_: unknown, record: RecipeVersionItem) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditIngredient(record)}
            >
              {t('common.actions.edit')}
            </Button>
            <Popconfirm
              title={t('stock.recipe.removeConfirm')}
              onConfirm={() => void handleDeleteIngredient(record.id)}
              okText={t('common.confirm.yes')}
              cancelText={t('common.confirm.no')}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                {t('common.actions.remove')}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleDeleteIngredient, handleEditIngredient, t]
  );

  if (loading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card>
        <Alert
          message={t('common.status.error')}
          description={errorMessage}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!recipes.length) {
    return (
      <>
        <Card
          title={t('stock.recipe.title')}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateRecipe}
            >
              {t('stock.recipe.createRecipe', 'Create Recipe')}
            </Button>
          }
        >
          {cost ? (
            <Alert
              message={
                <Space>
                  <DollarOutlined />
                  <Text strong>
                    {t('stock.recipe.estimatedCost', {
                      cost: cost.totalCost.toLocaleString(),
                    })}
                  </Text>
                </Space>
              }
              type="info"
              style={{ marginBottom: 16 }}
              showIcon
            />
          ) : null}
          <Empty description={t('stock.recipe.noRecipes', 'No recipes yet')} />
        </Card>

        <Modal
          title={t('stock.recipe.createRecipe', 'Create Recipe')}
          open={recipeModalOpen}
          onCancel={() => setRecipeModalOpen(false)}
          onOk={() => recipeForm.submit()}
          confirmLoading={submitting}
        >
          <Form form={recipeForm} layout="vertical" onFinish={handleSubmitRecipe}>
            <Form.Item
              name="name"
              label={t('stock.recipe.recipeName', 'Recipe Name')}
              rules={[
                {
                  required: true,
                  message: t(
                    'stock.recipe.recipeNameRequired',
                    'Recipe name is required'
                  ),
                },
              ]}
            >
              <Input
                placeholder={t(
                  'stock.recipe.recipeNamePlaceholder',
                  'Default Recipe'
                )}
              />
            </Form.Item>
            <Form.Item
              name="status"
              label={t('stock.recipe.status', 'Status')}
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'draft', label: 'draft' },
                  { value: 'active', label: 'active' },
                  { value: 'archived', label: 'archived' },
                ]}
              />
            </Form.Item>
            <Form.Item name="note" label={t('stock.recipe.notes')}>
              <TextArea rows={3} />
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  }

  return (
    <>
      <Card
        title={t('stock.recipe.title')}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateRecipe}
            >
              {t('stock.recipe.createRecipe', 'Create Recipe')}
            </Button>
            {selectedRecipe ? (
              <Button icon={<PlusOutlined />} onClick={handleCreateVersion}>
                {t('stock.recipe.createVersion', 'Create Version')}
              </Button>
            ) : null}
          </Space>
        }
      >
        {cost && (
          <Alert
            message={
              <Space>
                <DollarOutlined />
                <Text strong>
                  {t('stock.recipe.estimatedCost', {
                    cost: cost.totalCost.toLocaleString(),
                  })}
                </Text>
              </Space>
            }
            type="info"
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}

        <Table
          columns={recipeColumns}
          dataSource={sortedRecipes}
          rowKey="id"
          pagination={false}
          size="small"
        />

        <div style={{ marginTop: 16 }}>
          <Space style={{ marginBottom: 12 }} wrap>
            <Text strong>{t('stock.recipe.version', 'Version')}:</Text>
            <Select
              style={{ minWidth: 260 }}
              value={selectedVersionId ?? undefined}
              onChange={(value) => setSelectedVersionId(value)}
              placeholder={t('stock.recipe.selectVersion', 'Select version')}
              options={versionOptions.map((version) => ({
                value: version.id,
                label: `v${version.versionNumber} - ${version.status}`,
              }))}
            />
            <Button onClick={handleEditVersion} disabled={!versionDetail}>
              {t('stock.recipe.editVersion', 'Edit Version')}
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={handleAddIngredient}
              disabled={!selectedVersionId}
            >
              {t('stock.recipe.addIngredient')}
            </Button>
          </Space>

          {currentSelectedVersion ? (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message={t('stock.recipe.versionSummary', {
                defaultValue:
                  'Yield: {{yieldQuantity}} {{yieldUnit}} (base {{yieldBaseQuantity}} {{yieldBaseUnit}}) | Estimated cost: {{estimatedCost}} VND',
                yieldQuantity: currentSelectedVersion.yieldQuantity,
                yieldUnit: currentSelectedVersion.yieldUnit,
                yieldBaseQuantity: currentSelectedVersion.yieldBaseQuantity,
                yieldBaseUnit: currentSelectedVersion.yieldBaseUnit,
                estimatedCost:
                  currentSelectedVersion.estimatedCost.toLocaleString(),
              })}
            />
          ) : null}

          {versionLoading ? (
            <Spin />
          ) : (
            <Table
              columns={ingredientColumns}
              dataSource={versionDetail?.items || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          )}
        </div>
      </Card>

      <Modal
        title={
          recipeModalMode === 'create'
            ? t('stock.recipe.createRecipe', 'Create Recipe')
            : t('stock.recipe.editRecipe', 'Edit Recipe')
        }
        open={recipeModalOpen}
        onCancel={() => setRecipeModalOpen(false)}
        onOk={() => recipeForm.submit()}
        confirmLoading={submitting}
      >
        <Form form={recipeForm} layout="vertical" onFinish={handleSubmitRecipe}>
          <Form.Item
            name="name"
            label={t('stock.recipe.recipeName', 'Recipe Name')}
            rules={[
              {
                required: true,
                message: t(
                  'stock.recipe.recipeNameRequired',
                  'Recipe name is required'
                ),
              },
            ]}
          >
            <Input
              placeholder={t(
                'stock.recipe.recipeNamePlaceholder',
                'Default Recipe'
              )}
            />
          </Form.Item>
          <Form.Item
            name="status"
            label={t('stock.recipe.status', 'Status')}
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'draft', label: 'draft' },
                { value: 'active', label: 'active' },
                { value: 'archived', label: 'archived' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="isDefault"
            label={t('stock.recipe.defaultFlag', 'Set as default')}
          >
            <Select
              options={[
                { value: true, label: t('common.confirm.yes') },
                { value: false, label: t('common.confirm.no') },
              ]}
            />
          </Form.Item>
          <Form.Item name="note" label={t('stock.recipe.notes')}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          versionModalMode === 'create'
            ? t('stock.recipe.createVersion', 'Create Version')
            : t('stock.recipe.editVersion', 'Edit Version')
        }
        open={versionModalOpen}
        onCancel={() => setVersionModalOpen(false)}
        onOk={() => versionForm.submit()}
        confirmLoading={submitting}
      >
        <Form form={versionForm} layout="vertical" onFinish={handleSubmitVersion}>
          <Form.Item
            name="status"
            label={t('stock.recipe.status', 'Status')}
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'draft', label: 'draft' },
                { value: 'active', label: 'active' },
                { value: 'archived', label: 'archived' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="yieldQuantity"
            label={t('stock.recipe.yieldQuantity', 'Yield Quantity')}
            rules={[
              {
                required: true,
                message: t(
                  'stock.recipe.yieldQuantityRequired',
                  'Yield quantity is required'
                ),
              },
            ]}
          >
            <InputNumber min={0.001} precision={3} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="yieldUnit"
            label={t('stock.recipe.yieldUnit', 'Yield Unit')}
            rules={[
              {
                required: true,
                message: t(
                  'stock.recipe.yieldUnitRequired',
                  'Yield unit is required'
                ),
              },
            ]}
          >
            <Select
              options={[
                { value: StockPurchaseUnit.PIECE, label: StockPurchaseUnit.PIECE },
                { value: StockPurchaseUnit.GRAM, label: StockPurchaseUnit.GRAM },
                {
                  value: StockPurchaseUnit.KILOGRAM,
                  label: StockPurchaseUnit.KILOGRAM,
                },
                {
                  value: StockPurchaseUnit.MILLILITER,
                  label: StockPurchaseUnit.MILLILITER,
                },
                { value: StockPurchaseUnit.LITER, label: StockPurchaseUnit.LITER },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          editingIngredient
            ? t('stock.recipe.editIngredient')
            : t('stock.recipe.addIngredient')
        }
        open={ingredientModalOpen}
        onCancel={() => setIngredientModalOpen(false)}
        onOk={() => ingredientForm.submit()}
        confirmLoading={submitting}
      >
        <Form
          form={ingredientForm}
          layout="vertical"
          onFinish={handleSubmitIngredient}
        >
          <Form.Item
            name="stockItemId"
            label={t('stock.recipe.stockItem')}
            rules={[
              { required: true, message: t('stock.recipe.selectStockItemRequired') },
            ]}
          >
            <Select
              placeholder={t('stock.recipe.selectStockItem')}
              showSearch
              optionFilterProp="children"
              disabled={!!editingIngredient}
              onChange={() => {
                ingredientForm.setFieldValue('preferredBrandId', null);
                const item = stockItems?.find(
                  (stockItem) =>
                    stockItem.id === ingredientForm.getFieldValue('stockItemId')
                );
                const units = getAllowedUnitsByStockItem(item);
                ingredientForm.setFieldValue('unit', units[0]);
              }}
              notFoundContent={t('stock.recipe.noAvailableStockItems')}
            >
              {selectableStockItems.map((item) => (
                <Select.Option key={item.id} value={item.id}>
                  {item.name} ({item.unitOfMeasure})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label={t('stock.recipe.quantity')}
            rules={[{ required: true, message: t('stock.recipe.quantityRequired') }]}
          >
            <InputNumber
              min={0.001}
              step={0.001}
              precision={3}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="unit"
            label={t('stock.recipe.unit', 'Unit')}
            rules={[
              {
                required: true,
                message: t('stock.recipe.unitRequired', 'Please select a unit'),
              },
            ]}
          >
            <Select>
              {unitOptionsForIngredient.map((unit) => (
                <Select.Option key={unit} value={unit}>
                  {unit}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="wastePercent"
            label={t('stock.recipe.wastePercent', 'Waste %')}
          >
            <InputNumber min={0} step={0.1} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="preferredBrandId"
            label={t('stock.recipe.preferredBrand')}
          >
            <Select
              placeholder={t('stock.recipe.selectPreferredBrand')}
              allowClear
              loading={brandsLoading}
              disabled={!selectedStockItemId}
              notFoundContent={
                selectedStockItemId
                  ? t('stock.recipe.noBrandsAvailable')
                  : t('stock.recipe.selectStockItemFirst')
              }
            >
              {brandOptions.map((brand) => (
                <Select.Option key={brand.brandId} value={brand.brandId}>
                  {brand.brandName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="note" label={t('stock.recipe.notes')}>
            <TextArea rows={3} placeholder={t('stock.recipe.notesPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
