import Joi from 'joi';
import {
  RecipeStatus,
  RecipeVersionStatus,
  StockPurchaseUnit,
} from '@bakery-cms/common';

const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });

export const productRecipeParamsSchema = Joi.object({
  productId: uuidSchema.required(),
  recipeId: uuidSchema.required(),
});

export const productRecipeVersionParamsSchema = Joi.object({
  productId: uuidSchema.required(),
  recipeId: uuidSchema.required(),
  versionId: uuidSchema.required(),
});

export const productRecipeVersionItemParamsSchema = Joi.object({
  productId: uuidSchema.required(),
  recipeId: uuidSchema.required(),
  versionId: uuidSchema.required(),
  itemId: uuidSchema.required(),
});

export const productIdOnlyParamsSchema = Joi.object({
  productId: uuidSchema.required(),
});

export const createRecipeSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  isDefault: Joi.boolean().optional(),
  status: Joi.string()
    .valid(...Object.values(RecipeStatus))
    .optional(),
  note: Joi.string().trim().allow('', null).optional(),
});

export const updateRecipeSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  isDefault: Joi.boolean().optional(),
  status: Joi.string()
    .valid(...Object.values(RecipeStatus))
    .optional(),
  note: Joi.string().trim().allow('', null).optional(),
}).min(1);

export const createRecipeVersionSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(RecipeVersionStatus))
    .optional(),
  yieldQuantity: Joi.number().positive().precision(3).required(),
  yieldUnit: Joi.string()
    .valid(...Object.values(StockPurchaseUnit))
    .required(),
  effectiveFrom: Joi.date().iso().allow(null).optional(),
});

export const updateRecipeVersionSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(RecipeVersionStatus))
    .optional(),
  yieldQuantity: Joi.number().positive().precision(3).optional(),
  yieldUnit: Joi.string()
    .valid(...Object.values(StockPurchaseUnit))
    .optional(),
  effectiveFrom: Joi.date().iso().allow(null).optional(),
}).min(1);

export const createRecipeVersionItemSchema = Joi.object({
  stockItemId: uuidSchema.required(),
  quantity: Joi.number().positive().precision(3).required(),
  unit: Joi.string()
    .valid(...Object.values(StockPurchaseUnit))
    .required(),
  wastePercent: Joi.number().min(0).max(1000).precision(2).optional(),
  preferredBrandId: uuidSchema.allow(null).optional(),
  note: Joi.string().trim().allow('', null).optional(),
});

export const updateRecipeVersionItemSchema = Joi.object({
  quantity: Joi.number().positive().precision(3).optional(),
  unit: Joi.string()
    .valid(...Object.values(StockPurchaseUnit))
    .optional(),
  wastePercent: Joi.number().min(0).max(1000).precision(2).optional(),
  preferredBrandId: uuidSchema.allow(null).optional(),
  note: Joi.string().trim().allow('', null).optional(),
}).min(1);
