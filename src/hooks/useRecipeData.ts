
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CombinedRecipe } from '@/types/newDatabase';
import { fetchRecipes } from '@/services/supabaseQueries';
import { getRecipesByMealType, getRecipesByCategory } from '@/services/recipeFilters';
import { convertNewRecipeToStandard } from '@/utils/newRecipeConverter';
import { UserPreference } from '@/services/preferenceFilters';

export function useRecipeData() {
  const [recipes, setRecipes] = useState<CombinedRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipesLoaded, setRecipesLoaded] = useState(false);
  const { toast } = useToast();

  const loadRecipes = useCallback(async () => {
    if (recipesLoaded) return;
    
    setLoading(true);
    try {
      const recipesData = await fetchRecipes();
      setRecipes(recipesData || []);
      setRecipesLoaded(true);
    } catch (error) {
      console.error('Receptek betöltési hiba:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a recepteket.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [recipesLoaded, toast]);

  const getRecipesByMealTypeHandler = useCallback(async (
    mealType: string, 
    mealTypeRecipes: Record<string, string[]>,
    userPreferences: UserPreference[]
  ): Promise<CombinedRecipe[]> => {
    if (!recipesLoaded) {
      await loadRecipes();
    }
    
    if (!recipes.length || !Object.keys(mealTypeRecipes).length) {
      return [];
    }
    
    return getRecipesByMealType(recipes, mealTypeRecipes, mealType, userPreferences);
  }, [recipes, recipesLoaded, loadRecipes]);

  const getRecipesByCategoryHandler = useCallback(async (
    category: string, 
    mealTypeRecipes: Record<string, string[]>,
    categories: Record<string, string[]>,
    userPreferences: UserPreference[],
    ingredient?: string, 
    mealType?: string
  ): Promise<CombinedRecipe[]> => {
    if (!recipesLoaded) {
      await loadRecipes();
    }
    
    if (!recipes.length || !Object.keys(categories).length) {
      return [];
    }
    
    return getRecipesByCategory(recipes, mealTypeRecipes, categories, category, ingredient, mealType, userPreferences);
  }, [recipes, recipesLoaded, loadRecipes]);

  const getRandomRecipe = useCallback(async (): Promise<CombinedRecipe | null> => {
    if (!recipesLoaded) {
      await loadRecipes();
    }
    
    if (recipes.length === 0) return null;
    return recipes[Math.floor(Math.random() * recipes.length)];
  }, [recipes, recipesLoaded, loadRecipes]);

  return {
    recipes,
    loading,
    recipesLoaded,
    loadRecipes,
    getRecipesByMealType: getRecipesByMealTypeHandler,
    getRecipesByCategory: getRecipesByCategoryHandler,
    getRandomRecipe,
    convertToStandardRecipe: convertNewRecipeToStandard
  };
}
