/**
 * ProductRecipe component
 * Recipe management for product:
 * - Summary-first UX for bakery users
 * - Ingredient table as primary workflow
 * - Advanced version management in a collapsible section
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  Row,
  Col,
  Statistic,
  Collapse,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useStockItems } from '@/hooks/useStockItems';
import { stockService } from '@/services/stock.service';
import { useNotification } from '@/hooks/useNotification';
import { useCrudErrorNotification } from '@/hooks/useCrudErrorNotification';
import { formatCurrency } from '@/utils/format.utils';
import {
  emitRecipeChangedEvent,
  type RecipeChangedEventDetail,
} from '@/utils/recipe-events';
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

type BrandLoadOptions = {
  readonly force?: boolean;
};

export const ProductRecipe: React.FC<ProductRecipeProps> = ({
  productId,
  onRecipeChange,
}) => {
  const { t } = useTranslation();
  const {
    stockItems,
    loading: stockItemsLoading,
    refreshing: stockItemsRefreshing,
    error: stockItemsError,
    refetch: refetchStockItems,
  } = useStockItems({ pagination: { limit: 100 }, autoFetch: false });
  const { success } = useNotification();
  const { showCrudError } = useCrudErrorNotification();
  const showCrudErrorRef = useRef(showCrudError);

  useEffect(() => {
    showCrudErrorRef.current = showCrudError;
  }, [showCrudError]);

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

  const stockItemBrandsCacheRef = useRef<Record<string, readonly StockItemBrand[]>>(
    {}
  );
  const loadingStockItemBrandIdsRef = useRef<Set<string>>(new Set());
  const inFlightStockItemBrandRequestsRef = useRef<
    Map<string, Promise<readonly StockItemBrand[]>>
  >(new Map());
  const stockItemsRequestedRef = useRef(false);
  const stockItemsInFlightRef = useRef<Promise<void> | null>(null);

  const selectedStockItemId = Form.useWatch('stockItemId', ingredientForm);
  const selectedPreferredBrandId = Form.useWatch('preferredBrandId', ingredientForm);

  const notifyRecipeChanged = useCallback(
    (source: RecipeChangedEventDetail['source']): void => {
      emitRecipeChangedEvent({
        productId,
        source,
      });
      onRecipeChange?.();
    },
    [onRecipeChange, productId]
  );

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

  const ensureStockItemsLoaded = useCallback(async (): Promise<void> => {
    const hasData = Array.isArray(stockItems);
    const hasAnyData = (stockItems?.length || 0) > 0;
    const hasRequestedOnce = stockItemsRequestedRef.current;
    const hasInFlightRequest = stockItemsInFlightRef.current !== null;
    const isRequesting = stockItemsLoading || stockItemsRefreshing;
    const hasFetchError = Boolean(stockItemsError);

    if (hasData && hasAnyData) {
      return;
    }

    if (hasData && !hasAnyData && hasRequestedOnce && !hasFetchError) {
      return;
    }

    if (hasInFlightRequest || isRequesting) {
      return;
    }

    stockItemsRequestedRef.current = true;
    const request = refetchStockItems().finally(() => {
      if (stockItemsInFlightRef.current === request) {
        stockItemsInFlightRef.current = null;
      }
    });
    stockItemsInFlightRef.current = request;
    await request;
  }, [
    refetchStockItems,
    stockItems,
    stockItemsError,
    stockItemsLoading,
    stockItemsRefreshing,
  ]);

  const getActiveVersion = useCallback((recipe: Recipe): RecipeVersion | null => {
    const activeVersions = (recipe.versions || [])
      .filter((version) => version.status === 'active')
      .sort((a, b) => b.versionNumber - a.versionNumber);
    return activeVersions[0] || null;
  }, []);

  const refreshRecipes = useCallback(
    async (options?: { silentError?: boolean }): Promise<readonly Recipe[] | null> => {
      if (!productId) {
        return null;
      }

      const result = await stockService.getRecipesByProduct(productId);
      if (!result.success) {
        if (!options?.silentError) {
          showCrudErrorRef.current(result.error);
        }
        return null;
      }

      const loadedRecipes = result.data || [];
      setRecipes(loadedRecipes);

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

      return loadedRecipes;
    },
    [productId]
  );

  const refreshCost = useCallback(
    async (options?: { silentError?: boolean }): Promise<void> => {
      if (!productId) {
        return;
      }

      const costResult = await stockService.getProductCost(productId);
      if (!costResult.success) {
        if (!options?.silentError) {
          showCrudErrorRef.current(costResult.error);
        }
        setCost(null);
        return;
      }

      setCost(costResult.data);
    },
    [productId]
  );

  const loadSelectedVersionDetail = useCallback(async (): Promise<void> => {
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
      showCrudErrorRef.current(detailResult.error);
    }
    setVersionLoading(false);
  }, [productId, selectedRecipeId, selectedVersionId]);

  const loadStockItemBrands = useCallback(
    async (
      stockItemId: string,
      options?: BrandLoadOptions
    ): Promise<readonly StockItemBrand[]> => {
      if (!stockItemId) {
        return [];
      }

      const force = Boolean(options?.force);

      if (!force) {
        const cached = stockItemBrandsCacheRef.current[stockItemId];
        if (cached) {
          return cached;
        }
      }

      const existingInFlightRequest =
        inFlightStockItemBrandRequestsRef.current.get(stockItemId) || null;
      if (existingInFlightRequest) {
        return existingInFlightRequest;
      }

      if (loadingStockItemBrandIdsRef.current.has(stockItemId)) {
        return [];
      }

      loadingStockItemBrandIdsRef.current.add(stockItemId);

      const request = (async (): Promise<readonly StockItemBrand[]> => {
        const result = await stockService.getStockItemBrands(stockItemId);
        if (!result.success) {
          stockItemBrandsCacheRef.current[stockItemId] = [];
          showCrudErrorRef.current(result.error);
          return [];
        }

        stockItemBrandsCacheRef.current[stockItemId] = result.data;
        return result.data;
      })().finally(() => {
        loadingStockItemBrandIdsRef.current.delete(stockItemId);
        inFlightStockItemBrandRequestsRef.current.delete(stockItemId);
      });

      inFlightStockItemBrandRequestsRef.current.set(stockItemId, request);
      return request;
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async (): Promise<void> => {
      if (!productId) {
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      const [recipesResult, costResult] = await Promise.all([
        stockService.getRecipesByProduct(productId),
        stockService.getProductCost(productId),
      ]);

      if (!isMounted) {
        return;
      }

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
    };

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [productId]);

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

  useEffect(() => {
    void loadSelectedVersionDetail();
  }, [loadSelectedVersionDetail]);

  useEffect(() => {
    if (!ingredientModalOpen) {
      return;
    }

    void ensureStockItemsLoaded();
  }, [ensureStockItemsLoaded, ingredientModalOpen]);

  useEffect(() => {
    if (!ingredientModalOpen || !selectedStockItemId) {
      setBrandOptions([]);
      setBrandsLoading(false);
      return;
    }

    let isMounted = true;

    const loadBrands = async (): Promise<void> => {
      setBrandsLoading(true);
      const result = await loadStockItemBrands(selectedStockItemId);

      if (!isMounted) {
        return;
      }

      setBrandOptions(result);
      const selectedBrandId = ingredientForm.getFieldValue('preferredBrandId');
      if (selectedBrandId && !result.some((brand) => brand.brandId === selectedBrandId)) {
        ingredientForm.setFieldValue('preferredBrandId', null);
      }
      setBrandsLoading(false);
    };

    void loadBrands();

    return () => {
      isMounted = false;
    };
  }, [ingredientForm, ingredientModalOpen, loadStockItemBrands, selectedStockItemId]);

  const getAllowedUnitsByStockItem = useCallback(
    (item?: StockItem): StockPurchaseUnit[] => {
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
    },
    []
  );

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

  const selectedBrandOption = useMemo(() => {
    if (!selectedPreferredBrandId) {
      return null;
    }
    return (
      brandOptions.find((brand) => brand.brandId === selectedPreferredBrandId) ||
      null
    );
  }, [brandOptions, selectedPreferredBrandId]);

  const isStockItemsFetching = stockItemsLoading || stockItemsRefreshing;
  const hasStockItemsLoaded = stockItems !== null;
  const hasAnyStockItems = (stockItems?.length || 0) > 0;
  const hasSelectableStockItems = selectableStockItems.length > 0;
  const allStockItemsAddedToRecipe =
    !editingIngredient &&
    hasStockItemsLoaded &&
    hasAnyStockItems &&
    !hasSelectableStockItems;

  const ingredientStockItemNotFoundContent = useMemo(() => {
    if (isStockItemsFetching) {
      return t('common.status.loading', 'Loading...');
    }

    if (!hasStockItemsLoaded || !hasAnyStockItems) {
      return t(
        'stock.recipe.noStockItemsForIngredient',
        'Chưa có nguyên liệu. Vui lòng tạo nguyên liệu trong Quản lý kho trước.'
      );
    }

    if (allStockItemsAddedToRecipe) {
      return t(
        'stock.recipe.allStockItemsAdded',
        'Tất cả nguyên liệu đã được thêm vào công thức này.'
      );
    }

    return t('stock.recipe.noAvailableStockItems');
  }, [
    allStockItemsAddedToRecipe,
    hasAnyStockItems,
    hasStockItemsLoaded,
    isStockItemsFetching,
    t,
  ]);

  const ingredientCount = versionDetail?.items.length || 0;

  const shouldRefreshCostAfterIngredientMutation = useMemo(() => {
    if (!selectedVersionId) {
      return true;
    }

    if (!cost?.recipeVersionId) {
      return true;
    }

    if (cost.recipeVersionId === selectedVersionId) {
      return true;
    }

    if (selectedRecipe?.isDefault && currentSelectedVersion?.status === 'active') {
      return true;
    }

    return false;
  }, [cost?.recipeVersionId, currentSelectedVersion?.status, selectedRecipe?.isDefault, selectedVersionId]);

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

  const handleCreateDefaultRecipe = useCallback(async () => {
    if (!productId) {
      return;
    }

    setSubmitting(true);
    try {
      const createRecipeResult = await stockService.createRecipe(productId, {
        name: t('stock.recipe.recipeNamePlaceholder', 'Default Recipe'),
        status: 'active',
        isDefault: true,
      });

      if (!createRecipeResult.success) {
        showCrudError(createRecipeResult.error);
        return;
      }

      const createVersionResult = await stockService.createRecipeVersion(
        productId,
        createRecipeResult.data.id,
        {
          status: 'active',
          yieldQuantity: 1,
          yieldUnit: StockPurchaseUnit.PIECE,
        }
      );

      if (!createVersionResult.success) {
        showCrudError(createVersionResult.error);
        await Promise.all([refreshRecipes(), refreshCost()]);
        setSelectedRecipeId(createRecipeResult.data.id);
        return;
      }

      success(
        t('stock.recipe.recipeCreated', 'Recipe created'),
        t(
          'stock.recipe.defaultRecipeQuickCreateMessage',
          'Default recipe and version 1 are ready. Add ingredients now.'
        )
      );

      setSelectedRecipeId(createRecipeResult.data.id);
      setSelectedVersionId(createVersionResult.data.id);
      await Promise.all([refreshRecipes(), refreshCost()]);

      setEditingIngredient(null);
      setBrandOptions([]);
      ingredientForm.resetFields();
      ingredientForm.setFieldsValue({
        quantity: 1,
        unit: StockPurchaseUnit.PIECE,
        wastePercent: 0,
      });
      setIngredientModalOpen(true);

      notifyRecipeChanged('recipe_create');
    } catch (err) {
      showCrudError(err);
    } finally {
      setSubmitting(false);
    }
  }, [
    ingredientForm,
    notifyRecipeChanged,
    productId,
    refreshCost,
    refreshRecipes,
    showCrudError,
    success,
    t,
  ]);

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
          notifyRecipeChanged('recipe_create');
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
          notifyRecipeChanged('recipe_update');
        }

        setRecipeModalOpen(false);
        await Promise.all([refreshRecipes(), refreshCost()]);
      } catch (err) {
        showCrudError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [
      editingRecipe,
      notifyRecipeChanged,
      productId,
      recipeModalMode,
      refreshCost,
      refreshRecipes,
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
      await Promise.all([refreshRecipes(), refreshCost()]);
      notifyRecipeChanged('recipe_set_default');
    },
    [notifyRecipeChanged, productId, refreshCost, refreshRecipes, showCrudError, success, t]
  );

  const handleCreateVersion = useCallback(() => {
    setVersionModalMode('create');
    versionForm.setFieldsValue({
      status: 'draft',
      yieldQuantity: currentSelectedVersion?.yieldQuantity || 1,
      yieldUnit: currentSelectedVersion?.yieldUnit || StockPurchaseUnit.PIECE,
    });
    setVersionModalOpen(true);
  }, [currentSelectedVersion?.yieldQuantity, currentSelectedVersion?.yieldUnit, versionForm]);

  const handleCreateVersionFromCurrent = useCallback(async () => {
    if (!productId || !selectedRecipeId || !currentSelectedVersion) {
      return;
    }

    setSubmitting(true);
    try {
      const createVersionResult = await stockService.createRecipeVersion(
        productId,
        selectedRecipeId,
        {
          status: 'draft',
          yieldQuantity: currentSelectedVersion.yieldQuantity,
          yieldUnit: currentSelectedVersion.yieldUnit,
        }
      );

      if (!createVersionResult.success) {
        showCrudError(createVersionResult.error);
        return;
      }

      const newVersionId = createVersionResult.data.id;

      if (versionDetail?.items.length) {
        const cloneResults = await Promise.all(
          versionDetail.items.map((item) =>
            stockService.createRecipeVersionItem(
              productId,
              selectedRecipeId,
              newVersionId,
              {
                stockItemId: item.stockItemId,
                quantity: item.quantity,
                unit: item.unit,
                wastePercent: item.wastePercent,
                preferredBrandId: item.preferredBrandId,
                note: item.note,
              }
            )
          )
        );

        const failedCloneResult = cloneResults.find((result) => !result.success);
        if (failedCloneResult && !failedCloneResult.success) {
          showCrudError(failedCloneResult.error);
        }
      }

      setSelectedVersionId(newVersionId);
      success(
        t('stock.recipe.versionCreated', 'Recipe version created'),
        t(
          'stock.recipe.versionCloneMessage',
          'A new version has been created from the current recipe version.'
        )
      );

      await Promise.all([refreshRecipes(), refreshCost()]);
      notifyRecipeChanged('version_create');
    } catch (err) {
      showCrudError(err);
    } finally {
      setSubmitting(false);
    }
  }, [
    currentSelectedVersion,
    notifyRecipeChanged,
    productId,
    refreshCost,
    refreshRecipes,
    selectedRecipeId,
    showCrudError,
    success,
    t,
    versionDetail?.items,
  ]);

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
          notifyRecipeChanged('version_create');
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
          notifyRecipeChanged('version_update');
        }

        setVersionModalOpen(false);
        await Promise.all([
          refreshRecipes(),
          selectedRecipe?.isDefault ? refreshCost() : Promise.resolve(),
        ]);

        if (versionModalMode === 'edit') {
          await loadSelectedVersionDetail();
        }
      } catch (err) {
        showCrudError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [
      loadSelectedVersionDetail,
      notifyRecipeChanged,
      productId,
      refreshCost,
      refreshRecipes,
      selectedRecipe?.isDefault,
      selectedRecipeId,
      selectedVersionId,
      showCrudError,
      success,
      t,
      versionModalMode,
    ]
  );

  const handleAddIngredient = useCallback(async () => {
    setEditingIngredient(null);
    setBrandOptions([]);
    ingredientForm.resetFields();
    ingredientForm.setFieldsValue({
      quantity: 1,
      unit: StockPurchaseUnit.PIECE,
      wastePercent: 0,
    });
    setIngredientModalOpen(true);
    await ensureStockItemsLoaded();
  }, [ensureStockItemsLoaded, ingredientForm]);

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
          notifyRecipeChanged('ingredient_update');
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
          notifyRecipeChanged('ingredient_create');
        }

        setIngredientModalOpen(false);
        await Promise.all([
          loadSelectedVersionDetail(),
          refreshRecipes(),
          shouldRefreshCostAfterIngredientMutation ? refreshCost() : Promise.resolve(),
        ]);
      } catch (err) {
        showCrudError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [
      editingIngredient,
      loadSelectedVersionDetail,
      notifyRecipeChanged,
      productId,
      refreshCost,
      refreshRecipes,
      selectedRecipeId,
      selectedVersionId,
      shouldRefreshCostAfterIngredientMutation,
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

      await Promise.all([
        loadSelectedVersionDetail(),
        refreshRecipes(),
        shouldRefreshCostAfterIngredientMutation ? refreshCost() : Promise.resolve(),
      ]);
      notifyRecipeChanged('ingredient_delete');
    },
    [
      loadSelectedVersionDetail,
      notifyRecipeChanged,
      productId,
      refreshCost,
      refreshRecipes,
      selectedRecipeId,
      selectedVersionId,
      shouldRefreshCostAfterIngredientMutation,
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

  const versionColumns = useMemo(
    () => [
      {
        title: t('stock.recipe.version', 'Version'),
        key: 'versionNumber',
        render: (_: unknown, record: RecipeVersion) => (
          <Space>
            <Text strong>{`v${record.versionNumber}`}</Text>
            {record.id === selectedVersionId ? (
              <Tag color="blue">{t('common.status.active', 'Active')}</Tag>
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
        title: t('stock.recipe.yieldQuantity', 'Yield'),
        key: 'yield',
        render: (_: unknown, record: RecipeVersion) =>
          `${record.yieldQuantity} ${record.yieldUnit} (${record.yieldBaseQuantity} ${record.yieldBaseUnit})`,
      },
      {
        title: t('stock.recipe.estimatedCost', 'Estimated Cost'),
        dataIndex: 'estimatedCost',
        key: 'estimatedCost',
        render: (value: number) => formatCurrency(value || 0),
      },
      {
        title: t('common.table.actions'),
        key: 'action',
        render: (_: unknown, record: RecipeVersion) => (
          <Button type="link" onClick={() => setSelectedVersionId(record.id)}>
            {t('stock.recipe.selectVersion', 'Select version')}
          </Button>
        ),
      },
    ],
    [selectedVersionId, t]
  );

  const ingredientColumns = useMemo(
    () => [
      {
        title: t('stock.recipe.stockItem', 'Ingredient'),
        dataIndex: 'stockItemName',
        key: 'stockItemName',
        render: (value: string, item: RecipeVersionItem) => (
          <Space direction="vertical" size={0}>
            <Text strong>{value}</Text>
            {item.unitCostSnapshot <= 0 ? (
              <Text type="warning">
                {t(
                  'stock.recipe.zeroCostWarning',
                  'This ingredient has no brand price yet, cost is temporarily 0.'
                )}
              </Text>
            ) : null}
          </Space>
        ),
      },
      {
        title: t('stock.recipe.quantity', 'Quantity'),
        dataIndex: 'quantity',
        key: 'quantity',
      },
      {
        title: t('stock.recipe.unit', 'Unit'),
        dataIndex: 'unit',
        key: 'unit',
      },
      {
        title: t('stock.recipe.baseQuantity', 'Base Quantity'),
        key: 'baseQuantity',
        render: (_: unknown, item: RecipeVersionItem) => (
          <Text type="secondary">{`${item.baseQuantity} ${item.baseUnit}`}</Text>
        ),
      },
      {
        title: t('stock.recipe.preferredBrand', 'Preferred Brand'),
        dataIndex: 'preferredBrandName',
        key: 'preferredBrandName',
        render: (value: string | null) =>
          value || <Text type="secondary">{t('stock.recipe.noPreference')}</Text>,
      },
      {
        title: t('stock.recipe.wastePercent', 'Waste %'),
        dataIndex: 'wastePercent',
        key: 'wastePercent',
        render: (wastePercent: number) => `${wastePercent}%`,
      },
      {
        title: t('stock.recipe.unitCostSnapshot', 'Unit Cost'),
        dataIndex: 'unitCostSnapshot',
        key: 'unitCostSnapshot',
        render: (value: number) => formatCurrency(value || 0),
      },
      {
        title: t('stock.recipe.totalCostSnapshot', 'Total Cost'),
        dataIndex: 'totalCostSnapshot',
        key: 'totalCostSnapshot',
        render: (value: number) => formatCurrency(value || 0),
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
        {!recipes.length ? (
          <Empty
            description={
              <Space direction="vertical" size={8}>
                <Text>
                  {t(
                    'stock.recipe.emptyStateDefault',
                    'No recipe yet. Create a default recipe and start adding ingredients.'
                  )}
                </Text>
                <Button
                  type="primary"
                  onClick={() => void handleCreateDefaultRecipe()}
                  loading={submitting}
                >
                  {t('stock.recipe.createDefaultRecipe', 'Create default recipe')}
                </Button>
              </Space>
            }
          />
        ) : (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small">
              <Space
                align="start"
                style={{ width: '100%', justifyContent: 'space-between' }}
                wrap
              >
                <Space direction="vertical" size={4}>
                  <Space wrap>
                    <Text strong style={{ fontSize: 16 }}>
                      {selectedRecipe?.name || t('stock.recipe.recipeName', 'Recipe')}
                    </Text>
                    {selectedRecipe?.isDefault ? (
                      <Tag color="gold">{t('stock.recipe.defaultTag', 'Default')}</Tag>
                    ) : null}
                    {selectedRecipe?.status === 'active' ? (
                      <Tag color="green">{t('common.status.active', 'Active')}</Tag>
                    ) : (
                      <Tag>{selectedRecipe?.status || '-'}</Tag>
                    )}
                  </Space>
                  <Text type="secondary">
                    {t(
                      'stock.recipe.summaryHint',
                      'Main recipe summary for bakery operations'
                    )}
                  </Text>
                </Space>

                <Space wrap>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => selectedRecipe && handleEditRecipe(selectedRecipe)}
                    disabled={!selectedRecipe}
                  >
                    {t('stock.recipe.editRecipe', 'Edit recipe')}
                  </Button>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => void handleCreateVersionFromCurrent()}
                    disabled={!currentSelectedVersion}
                    loading={submitting}
                  >
                    {t(
                      'stock.recipe.createVersionFromCurrent',
                      'Create version from current'
                    )}
                  </Button>
                  {selectedRecipe && !selectedRecipe.isDefault ? (
                    <Button
                      icon={<CheckCircleOutlined />}
                      onClick={() => void handleSetDefaultRecipe(selectedRecipe)}
                    >
                      {t('stock.recipe.setDefault', 'Set default')}
                    </Button>
                  ) : null}
                </Space>
              </Space>

              <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={t('stock.recipe.yieldQuantity', 'Yield')}
                    value={currentSelectedVersion?.yieldQuantity || 0}
                    suffix={currentSelectedVersion?.yieldUnit || ''}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={t('stock.recipe.baseYield', 'Yield (base unit)')}
                    value={currentSelectedVersion?.yieldBaseQuantity || 0}
                    suffix={currentSelectedVersion?.yieldBaseUnit || ''}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={t('stock.recipe.estimatedCost', 'Estimated Cost')}
                    value={currentSelectedVersion?.estimatedCost || cost?.totalCost || 0}
                    formatter={(value) => formatCurrency(Number(value) || 0)}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={t('stock.recipe.ingredientsCount', 'Ingredients')}
                    value={ingredientCount}
                  />
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              title={t('stock.recipe.ingredientsTitle', 'Ingredients')}
              extra={
                <Space wrap>
                  <Text strong>{t('stock.recipe.version', 'Version')}:</Text>
                  <Select
                    style={{ minWidth: 220 }}
                    value={selectedVersionId ?? undefined}
                    onChange={(value) => setSelectedVersionId(value)}
                    placeholder={t('stock.recipe.selectVersion', 'Select version')}
                    options={versionOptions.map((version) => ({
                      value: version.id,
                      label: `v${version.versionNumber} - ${version.status}`,
                    }))}
                  />
                  <Button onClick={handleEditVersion} disabled={!versionDetail}>
                    {t('stock.recipe.editVersion', 'Edit version')}
                  </Button>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={handleAddIngredient}
                    disabled={!selectedVersionId}
                  >
                    {t('stock.recipe.addIngredient', 'Add ingredient')}
                  </Button>
                </Space>
              }
            >
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
            </Card>

            <Collapse
              items={[
                {
                  key: 'advanced',
                  label: t(
                    'stock.recipe.advancedVersionManagement',
                    'Advanced recipe/version management'
                  ),
                  children: (
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      <Table
                        columns={recipeColumns}
                        dataSource={sortedRecipes}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />

                      {selectedRecipe ? (
                        <Table
                          columns={versionColumns}
                          dataSource={versionOptions}
                          rowKey="id"
                          pagination={false}
                          size="small"
                        />
                      ) : null}
                    </Space>
                  ),
                },
              ]}
            />
          </Space>
        )}
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
            <InputNumber min={0.001} style={{ width: '100%' }} />
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
              loading={isStockItemsFetching}
              showSearch
              optionFilterProp="children"
              disabled={!!editingIngredient}
              onChange={(value) => {
                ingredientForm.setFieldValue('preferredBrandId', null);
                const item = stockItems?.find((stockItem) => stockItem.id === value);
                const units = getAllowedUnitsByStockItem(item);
                ingredientForm.setFieldValue('unit', units[0]);
              }}
              notFoundContent={ingredientStockItemNotFoundContent}
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

          {selectedBrandOption ? (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message={t('stock.recipe.brandPricePreview', {
                defaultValue:
                  '{{purchaseQuantity}} {{purchaseUnit}} = {{price}} -> {{unitPrice}}/{{baseUnit}}',
                purchaseQuantity: selectedBrandOption.purchaseQuantity,
                purchaseUnit: selectedBrandOption.purchaseUnit,
                price: formatCurrency(selectedBrandOption.priceAfterTax),
                unitPrice: formatCurrency(selectedBrandOption.unitPriceAfterTax),
                baseUnit: selectedIngredientStockItem?.baseUnit || '-',
              })}
            />
          ) : null}

          {selectedStockItemId && !brandsLoading && brandOptions.length === 0 ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message={t(
                'stock.recipe.zeroCostWarning',
                'This ingredient has no brand price yet, cost is temporarily 0.'
              )}
            />
          ) : null}

          <Form.Item name="note" label={t('stock.recipe.notes')}>
            <TextArea rows={3} placeholder={t('stock.recipe.notesPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
