
import { useState } from 'react';
import { Recipe } from "@/types/recipe";
import { CombinedRecipe } from "@/types/newDatabase";

interface MealIngredients {
  [mealType: string]: Array<{
    category: string;
    ingredient: string;
  }>;
}

interface SearchParams {
  category: string;
  ingredient: string;
  mealType: string;
}

export function useRecipeGeneration() {
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams>({ 
    category: "", 
    ingredient: "", 
    mealType: "" 
  });

  const generateRecipe = async (
    mealType: string,
    getRecipesByMealType: (mealType: string) => Promise<CombinedRecipe[]>,
    convertToStandardRecipe: (recipe: CombinedRecipe) => Recipe
  ) => {
    if (!mealType) return;
    
    setIsLoading(true);
    setCurrentRecipe(null);
    
    try {
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1000));
      
      const foundRecipes = await getRecipesByMealType(mealType);
      await minLoadingTime;

      if (foundRecipes.length > 0) {
        const randomIndex = Math.floor(Math.random() * foundRecipes.length);
        const selectedSupabaseRecipe = foundRecipes[randomIndex];
        const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
        
        setCurrentRecipe(standardRecipe);
        setLastSearchParams({ category: "", ingredient: "", mealType });
      }
    } catch (error) {
      console.error('Hiba a recept generálásakor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateRecipe = async (
    selectedMealType: string,
    getRecipesByMealType: (mealType: string) => Promise<CombinedRecipe[]>,
    getRecipesByCategory: (category: string, ingredient?: string, mealType?: string) => Promise<CombinedRecipe[]>,
    convertToStandardRecipe: (recipe: CombinedRecipe) => Recipe
  ) => {
    if (!selectedMealType) return;
    
    setIsLoading(true);
    setCurrentRecipe(null);
    
    try {
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500));
      
      let foundRecipes = [];
      
      if (lastSearchParams.category && lastSearchParams.ingredient) {
        foundRecipes = await getRecipesByCategory(lastSearchParams.category, lastSearchParams.ingredient, selectedMealType);
      } else if (lastSearchParams.category) {
        foundRecipes = await getRecipesByCategory(lastSearchParams.category, undefined, selectedMealType);
      } else {
        foundRecipes = await getRecipesByMealType(selectedMealType);
      }

      await minLoadingTime;

      if (foundRecipes.length > 0) {
        const randomIndex = Math.floor(Math.random() * foundRecipes.length);
        const selectedSupabaseRecipe = foundRecipes[randomIndex];
        const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
        
        setCurrentRecipe(standardRecipe);
      }
    } catch (error) {
      console.error('Hiba az újrageneráláskor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetRecipe = () => {
    setCurrentRecipe(null);
    setLastSearchParams({ category: "", ingredient: "", mealType: "" });
  };

  return {
    currentRecipe,
    isLoading,
    lastSearchParams,
    setLastSearchParams,
    generateRecipe,
    regenerateRecipe,
    resetRecipe
  };
}
