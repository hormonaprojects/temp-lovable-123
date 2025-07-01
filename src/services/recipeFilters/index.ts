


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
  console.log('🔍 getRecipesByMealType called with:', { 
    recipesLength: recipes?.length || 0, 
    mealType, 
    hasHozzavalok: recipes?.length > 0 && 'hozzávalók' in recipes[0]
  });
  
  // Ha az új típusú recepteket kapjuk, használjuk az új függvényt
  if (recipes?.length > 0 && 'hozzávalók' in recipes[0]) {
    console.log('🆕 Using new database structure');
    const { getRecipesByMealTypeNew } = require('./newDatabaseFilters');
    return getRecipesByMealTypeNew(recipes, mealTypeRecipes, mealType, userPreferences);
  }
  // Különben a régi függvényt
  console.log('🔄 Using old database structure');
  const { getRecipesByMealType: oldGetRecipesByMealType } = require('./mealTypeFilters');
  return oldGetRecipesByMealType(recipes, mealTypeRecipes, mealType, userPreferences);
};

export const filterRecipesByMultipleIngredients = (recipes: any, requiredIngredients: string[]) => {
  console.log('🔍 filterRecipesByMultipleIngredients called with:', { 
    recipesLength: recipes?.length || 0, 
    requiredIngredients,
    hasHozzavalok: recipes?.length > 0 && 'hozzávalók' in recipes[0]
  });
  
  // Ha az új típusú recepteket kapjuk, használjuk az új függvényt
  if (recipes?.length > 0 && 'hozzávalók' in recipes[0]) {
    console.log('🆕 Using new database structure for ingredients filtering');
    const { filterRecipesByMultipleIngredientsNew } = require('./newDatabaseFilters');
    return filterRecipesByMultipleIngredientsNew(recipes, requiredIngredients);
  }
  // Különben a régi függvényt
  console.log('🔄 Using old database structure for ingredients filtering');
  const { filterRecipesByMultipleIngredients: oldFilterRecipesByMultipleIngredients } = require('./ingredientFilters');
  return oldFilterRecipesByMultipleIngredients(recipes, requiredIngredients);
};

export const getRecipesByCategory = (recipes: any, mealTypeRecipes: any, categories: any, category: string, ingredient?: string, mealType?: string, userPreferences: any = []) => {
  console.log('🔍 getRecipesByCategory called with:', { 
    recipesLength: recipes?.length || 0, 
    category,
    ingredient,
    mealType,
    hasHozzavalok: recipes?.length > 0 && 'hozzávalók' in recipes[0]
  });
  
  // Ha az új típusú recepteket kapjuk, használjuk az új függvényt
  if (recipes?.length > 0 && 'hozzávalók' in recipes[0]) {
    console.log('🆕 Using new database structure for category filtering');
    const { getRecipesByCategoryNew } = require('./newDatabaseFilters');
    return getRecipesByCategoryNew(recipes, mealTypeRecipes, categories, category, ingredient, mealType, userPreferences);
  }
  
  // Régi adatbázis struktúra esetén implementáljuk a kategória szerinti szűrést
  console.log('🔄 Using old database structure for category filtering');
  
  // Kezdjük a meal type szűréssel ha meg van adva
  let filteredRecipes = recipes;
  if (mealType) {
    filteredRecipes = getRecipesByMealType(recipes, mealTypeRecipes, mealType, userPreferences);
  }
  
  // Ha van kategória és alapanyag, szűrjük tovább
  if (ingredient) {
    const { filterRecipesByIngredient } = require('./ingredientFilters');
    filteredRecipes = filterRecipesByIngredient(filteredRecipes, ingredient);
  }
  
  return filteredRecipes;
};


