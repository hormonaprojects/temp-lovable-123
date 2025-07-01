
// Új moduláris filter rendszer exportjai
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

// Új adatbázis struktúra exportjai
export {
  getRecipesByMealTypeNew,
  filterRecipesByMultipleIngredientsNew,
  getRecipesByCategoryNew
} from './newDatabaseFilters';

// MINDENT az új adatbázis struktúrán keresztül irányítunk
export const getRecipesByMealType = (recipes: any, mealTypeRecipes: any, mealType: string, userPreferences: any = []) => {
  console.log('🔍 getRecipesByMealType - MINDIG az új adatbázis struktúrát használjuk');
  const { getRecipesByMealTypeNew } = require('./newDatabaseFilters');
  return getRecipesByMealTypeNew(recipes, mealTypeRecipes, mealType, userPreferences);
};

export const filterRecipesByMultipleIngredients = (recipes: any, requiredIngredients: string[]) => {
  console.log('🔍 filterRecipesByMultipleIngredients - MINDIG az új adatbázis struktúrát használjuk');
  const { filterRecipesByMultipleIngredientsNew } = require('./newDatabaseFilters');
  return filterRecipesByMultipleIngredientsNew(recipes, requiredIngredients);
};

export const getRecipesByCategory = (recipes: any, mealTypeRecipes: any, categories: any, category: string, ingredient?: string, mealType?: string, userPreferences: any = []) => {
  console.log('🔍 getRecipesByCategory - MINDIG az új adatbázis struktúrát használjuk');
  const { getRecipesByCategoryNew } = require('./newDatabaseFilters');
  return getRecipesByCategoryNew(recipes, mealTypeRecipes, categories, category, ingredient, mealType, userPreferences);
};
