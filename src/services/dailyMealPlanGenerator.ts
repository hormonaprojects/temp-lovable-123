
import { SupabaseRecipe } from '@/types/supabase';
import { getRecipesByMealType, filterRecipesByMultipleIngredients } from './recipeFilters/index';

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

interface GeneratedRecipe {
  name: string;
  ingredients: string[];
  instructions: string;
  mealType: string;
  category: string;
  ingredient: string;
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const generateDailyMealPlan = async (
  selectedMeals: string[],
  ingredients: SelectedIngredient[],
  recipes: SupabaseRecipe[],
  mealTypeRecipes: Record<string, string[]>,
  convertToStandardRecipe: (recipe: SupabaseRecipe) => any
): Promise<GeneratedRecipe[]> => {
  console.log('🍽️ Napi étrend generálása:', { selectedMeals, ingredients });
  
  const newRecipes: GeneratedRecipe[] = [];
  
  for (const mealType of selectedMeals) {
    console.log(`\n🔍 ${mealType} receptek keresése...`);
    
    // Étkezési típus alapján receptek lekérése a refactorált függvénnyel
    const mealTypeFilteredRecipes = getRecipesByMealType(recipes, mealTypeRecipes, mealType);
    console.log(`📋 ${mealType} összes recepte:`, mealTypeFilteredRecipes.length, 'db');
    
    let filteredRecipes = mealTypeFilteredRecipes;
    
    // Ha vannak kiválasztott alapanyagok, szűrjük a recepteket a refactorált függvénnyel
    if (ingredients.length > 0) {
      console.log(`🎯 Szűrés alapanyagok alapján:`, ingredients.map(ing => ing.ingredient));
      
      // A refactorált filterRecipesByMultipleIngredients függvényt használjuk
      const ingredientNames = ingredients.map(ing => ing.ingredient);
      filteredRecipes = filterRecipesByMultipleIngredients(mealTypeFilteredRecipes, ingredientNames);
    }
    
    console.log(`📊 Szűrés után ${mealType}-hoz: ${filteredRecipes.length} recept`);
    
    if (filteredRecipes.length > 0) {
      // Véletlenszerű recept kiválasztása a szűrt receptekből
      const randomIndex = Math.floor(Math.random() * filteredRecipes.length);
      const selectedSupabaseRecipe = filteredRecipes[randomIndex];
      const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
      
      console.log(`🎲 Kiválasztott recept ${mealType}-hoz: "${selectedSupabaseRecipe['Recept_Neve']}"`);
      
      // Meghatározzuk az alapanyagokat a receptből
      const mainIngredients = [
        selectedSupabaseRecipe['Hozzavalo_1'],
        selectedSupabaseRecipe['Hozzavalo_2'],
        selectedSupabaseRecipe['Hozzavalo_3']
      ].filter(Boolean);
      
      newRecipes.push({
        ...standardRecipe,
        mealType,
        category: ingredients.length > 0 ? "alapanyag alapú" : "automatikus",
        ingredient: ingredients.length > 0 
          ? ingredients.map(ing => ing.ingredient).join(", ") 
          : mainIngredients[0] || "vegyes alapanyagok"
      });
    } else {
      console.log(`❌ NINCS MEGFELELŐ RECEPT ${mealType}-hoz a kiválasztott alapanyagokkal!`);
    }
  }
  
  console.log(`🏁 Végeredmény: ${newRecipes.length} recept generálva`);
  return newRecipes;
};
