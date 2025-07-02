
import { useBasicData } from './useBasicData';
import { useRecipeData } from './useRecipeData';
import { useUserData } from './useUserData';

export function useLazySupabaseData(userId?: string) {
  const basicData = useBasicData();
  const recipeData = useRecipeData();
  const userData = useUserData(userId);

  return {
    // Basic data
    categories: basicData.categories,
    mealTypes: basicData.mealTypes,
    mealTypeRecipes: basicData.mealTypeRecipes,
    loading: basicData.loading || recipeData.loading,
    isInitialized: basicData.isInitialized,
    loadBasicData: basicData.loadBasicData,

    // Recipe data
    recipes: recipeData.recipes,
    recipesLoaded: recipeData.recipesLoaded,
    loadRecipes: recipeData.loadRecipes,
    getRecipesByMealType: (mealType: string) => 
      recipeData.getRecipesByMealType(mealType, basicData.mealTypeRecipes, userData.userPreferences),
    getRecipesByCategory: (category: string, ingredient?: string, mealType?: string) =>
      recipeData.getRecipesByCategory(category, basicData.mealTypeRecipes, basicData.categories, userData.userPreferences, ingredient, mealType),
    getRandomRecipe: recipeData.getRandomRecipe,
    convertToStandardRecipe: recipeData.convertToStandardRecipe,

    // User data
    userPreferences: userData.userPreferences,
    userFavorites: userData.userFavorites,
    loadUserPreferences: userData.loadUserPreferences,
    loadUserFavorites: userData.loadUserFavorites,
    getFilteredIngredients: (category: string) => userData.getFilteredIngredients(category, basicData.categories),
    getFavoriteForIngredient: userData.getFavoriteForIngredient,
    getPreferenceForIngredient: userData.getPreferenceForIngredient,
    handleFavoriteToggle: userData.handleFavoriteToggle,
    saveRating: userData.saveRating,
    refreshFavorites: userData.refreshFavorites
  };
}
