
import { SupabaseRecipe } from '@/types/supabase';
import { UserPreference } from '../preferenceFilters';
import { getRecipesByMealType } from './mealTypeFilters';
import { filterRecipesByIngredient, filterRecipesByMultipleIngredients, getAllRecipeIngredients, hasIngredientMatch } from './ingredientFilters';
import { filterRecipesByCategory } from './categoryFilters';

// Re-export all filter functions from their respective modules
export { 
  getAllRecipeIngredients,
  hasIngredientMatch,
  filterRecipesByIngredient,
  filterRecipesByMultipleIngredients
} from './ingredientFilters';

export { getRecipesByMealType } from './mealTypeFilters';
export { filterRecipesByCategory } from './categoryFilters';

// Komplex szűrés kategória + alapanyag + étkezési típus alapján
export const getRecipesByCategory = (
  recipes: SupabaseRecipe[],
  mealTypeRecipes: Record<string, string[]>,
  categories: Record<string, string[]>,
  category: string,
  ingredient?: string,
  mealType?: string,
  userPreferences?: UserPreference[]
): SupabaseRecipe[] => {
  console.log(`🔍 Komplex szűrés - Kategória: ${category}, Alapanyag: ${ingredient}, Étkezési típus: ${mealType}`);
  
  let filteredRecipes = recipes;

  // 1. LÉPÉS: Étkezési típus szűrés (ha van)
  if (mealType) {
    filteredRecipes = getRecipesByMealType(filteredRecipes, mealTypeRecipes, mealType, userPreferences);
    console.log(`📋 Étkezési típus után: ${filteredRecipes.length} recept`);
    
    if (filteredRecipes.length === 0) {
      console.log('❌ Nincs recept ehhez az étkezési típushoz');
      return [];
    }
  }

  // 2. LÉPÉS: Konkrét alapanyag szűrés (ha van)
  if (ingredient) {
    filteredRecipes = filterRecipesByIngredient(filteredRecipes, ingredient);
    console.log(`🎯 Alapanyag szűrés után: ${filteredRecipes.length} recept`);
    
    if (filteredRecipes.length === 0) {
      console.log(`❌ Nincs recept "${ingredient}" alapanyaggal`);
      return [];
    }
  }
  // 3. LÉPÉS: Kategória szűrés (ha nincs konkrét alapanyag)
  else if (category) {
    filteredRecipes = filterRecipesByCategory(filteredRecipes, categories, category);
    console.log(`🥕 Kategória szűrés után: ${filteredRecipes.length} recept`);
    
    if (filteredRecipes.length === 0) {
      console.log(`❌ Nincs recept "${category}" kategóriából`);
      return [];
    }
  }

  console.log(`✅ Végső eredmény: ${filteredRecipes.length} recept`);
  return filteredRecipes;
};
