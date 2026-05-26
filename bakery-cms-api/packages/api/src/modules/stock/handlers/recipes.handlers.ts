import { NextFunction, Request, Response } from 'express';
import { RecipeService } from '../services/recipes.services';
import {
  CreateRecipeDto,
  CreateRecipeVersionDto,
  CreateRecipeVersionItemDto,
  UpdateRecipeDto,
  UpdateRecipeVersionDto,
  UpdateRecipeVersionItemDto,
} from '../dto/recipes.dto';

export interface RecipeHandlers {
  handleGetProductRecipes(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleCreateRecipe(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleUpdateRecipe(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleSetDefaultRecipe(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleCreateRecipeVersion(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetRecipeVersionDetail(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleUpdateRecipeVersion(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleAddRecipeVersionItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleUpdateRecipeVersionItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleDeleteRecipeVersionItem(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export const createRecipeHandlers = (service: RecipeService): RecipeHandlers => {
  const handleGetProductRecipes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await service.getProductRecipes(req.params['productId']!);
      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  const handleCreateRecipe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as CreateRecipeDto;
      const result = await service.createRecipe(req.params['productId']!, dto);
      if (result.isErr()) {
        return next(result.error);
      }

      res.status(201).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  const handleUpdateRecipe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as UpdateRecipeDto;
      const result = await service.updateRecipe(
        req.params['productId']!,
        req.params['recipeId']!,
        dto
      );
      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  const handleSetDefaultRecipe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await service.setDefaultRecipe(
        req.params['productId']!,
        req.params['recipeId']!
      );
      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  const handleCreateRecipeVersion = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as CreateRecipeVersionDto;
      const result = await service.createRecipeVersion(
        req.params['productId']!,
        req.params['recipeId']!,
        dto
      );
      if (result.isErr()) {
        return next(result.error);
      }

      res.status(201).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  const handleGetRecipeVersionDetail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await service.getRecipeVersionDetail(
        req.params['productId']!,
        req.params['recipeId']!,
        req.params['versionId']!
      );
      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  const handleUpdateRecipeVersion = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as UpdateRecipeVersionDto;
      const result = await service.updateRecipeVersion(
        req.params['productId']!,
        req.params['recipeId']!,
        req.params['versionId']!,
        dto
      );
      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  const handleAddRecipeVersionItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as CreateRecipeVersionItemDto;
      const result = await service.addRecipeVersionItem(
        req.params['productId']!,
        req.params['recipeId']!,
        req.params['versionId']!,
        dto
      );
      if (result.isErr()) {
        return next(result.error);
      }

      res.status(201).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  const handleUpdateRecipeVersionItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as UpdateRecipeVersionItemDto;
      const result = await service.updateRecipeVersionItem(
        req.params['productId']!,
        req.params['recipeId']!,
        req.params['versionId']!,
        req.params['itemId']!,
        dto
      );
      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  const handleDeleteRecipeVersionItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await service.deleteRecipeVersionItem(
        req.params['productId']!,
        req.params['recipeId']!,
        req.params['versionId']!,
        req.params['itemId']!
      );
      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        message: 'Recipe version item deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    handleGetProductRecipes,
    handleCreateRecipe,
    handleUpdateRecipe,
    handleSetDefaultRecipe,
    handleCreateRecipeVersion,
    handleGetRecipeVersionDetail,
    handleUpdateRecipeVersion,
    handleAddRecipeVersionItem,
    handleUpdateRecipeVersionItem,
    handleDeleteRecipeVersionItem,
  };
};
