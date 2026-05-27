export type RecipeChangedEventDetail = {
  readonly productId: string;
  readonly source:
    | 'recipe_create'
    | 'recipe_update'
    | 'recipe_set_default'
    | 'version_create'
    | 'version_update'
    | 'ingredient_create'
    | 'ingredient_update'
    | 'ingredient_delete';
};

const RECIPE_CHANGED_EVENT_NAME = 'bakery-cms:recipe-changed';

export const emitRecipeChangedEvent = (detail: RecipeChangedEventDetail): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<RecipeChangedEventDetail>(RECIPE_CHANGED_EVENT_NAME, {
      detail,
    })
  );
};

export const subscribeRecipeChangedEvent = (
  handler: (detail: RecipeChangedEventDetail) => void
): (() => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const listener = (event: Event): void => {
    const customEvent = event as CustomEvent<RecipeChangedEventDetail>;
    if (!customEvent.detail?.productId) {
      return;
    }
    handler(customEvent.detail);
  };

  window.addEventListener(RECIPE_CHANGED_EVENT_NAME, listener as EventListener);

  return () => {
    window.removeEventListener(RECIPE_CHANGED_EVENT_NAME, listener as EventListener);
  };
};
