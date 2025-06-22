
import { SupabaseRecipe } from '@/types/supabase';
import { filterRecipesByIngredient } from './ingredientFilters';

// Kategória alapján szűrés
export const filterRecipesByCategory = (
  recipes: SupabaseRecipe[],
  categories: Record<string, string[]>,
  category: string
): SupabaseRecipe[] => {
  console.log(`🥕 Kategória szűrés: ${category}`);
  
  const categoryIngredients = categories[category] || [];
  console.log(`🥕 Kategória alapanyagok (${category}):`, categoryIngredients);

  if (categoryIngredients.length === 0) {
    console.log('❌ Nincs alapanyag ehhez a kategóriához');
    return [];
  }

  const categoryFilteredRecipes = recipes.filter(recipe => {
    return categoryIngredients.some(categoryIngredient => {
      const filtered = filterRecipesByIngredient([recipe], categoryIngredient);
      return filtered.length > 0;
    });
  });

  console.log(`✅ Kategória szűrés eredménye (${category}):`, categoryFilteredRecipes.length, 'db');
  return categoryFilteredRecipes;
};
