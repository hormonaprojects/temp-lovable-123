

export {
  getRecipesByMealType as oldGetRecipesByMealType
} from './mealTypeFilters';

export {
  filterRecipesByIngredient,
  filterRecipesByMultipleIngredients as oldFilterRecipesByMultipleIngredients,
  getAllRecipeIngredients,
  hasIngredientMatch
} from './ingredientFilters';

export {
  filterRecipesByCategory
} from './categoryFilters';

// Új exportok az új adatbázis struktúrához
export {
  getRecipesByMealTypeNew,
  filterRecipesByMultipleIngredientsNew,
  getRecipesByCategoryNew
} from './newDatabaseFilters';

// Átmeneti kompatibilitás érdekében átirányítjuk a hívásokat
export const getRecipesByMealType = (recipes: any, mealTypeRecipes: any, mealType: string, userPreferences: any = []) => {
  // Ha az új típusú recepteket kapjuk, használjuk az új függvényt
  if (recipes.length > 0 && 'hozzávalók' in recipes[0]) {
    const { getRecipesByMealTypeNew } = require('./newDatabaseFilters');
    return getRecipesByMealTypeNew(recipes, mealTypeRecipes, mealType, userPreferences);
  }
  // Különben a régi függvényt
  const { getRecipesByMealType: oldGetRecipesByMealType } = require('./mealTypeFilters');
  return oldGetRecipesByMealType(recipes, mealTypeRecipes, mealType, userPreferences);
};

export const filterRecipesByMultipleIngredients = (recipes: any, requiredIngredients: string[]) => {
  // Ha az új típusú recepteket kapjuk, használjuk az új függvényt
  if (recipes.length > 0 && 'hozzávalók' in recipes[0]) {
    const { filterRecipesByMultipleIngredientsNew } = require('./newDatabaseFilters');
    return filterRecipesByMultipleIngredientsNew(recipes, requiredIngredients);
  }
  // Különben a régi függvényt
  const { filterRecipesByMultipleIngredients: oldFilterRecipesByMultipleIngredients } = require('./ingredientFilters');
  return oldFilterRecipesByMultipleIngredients(recipes, requiredIngredients);
};

export const getRecipesByCategory = (recipes: any, mealTypeRecipes: any, categories: any, category: string, ingredient?: string, mealType?: string, userPreferences: any = []) => {
  // Ha az új típusú recepteket kapjuk, használjuk az új függvényt
  if (recipes.length > 0 && 'hozzávalók' in recipes[0]) {
    const { getRecipesByCategoryNew } = require('./newDatabaseFilters');
    return getRecipesByCategoryNew(recipes, mealTypeRecipes, categories, category, ingredient, mealType, userPreferences);
  }
  // Különben a régi függvényt - ezt implementálni kell
  console.log('Old getRecipesByCategory called - this needs to be implemented');
  return [];
};

