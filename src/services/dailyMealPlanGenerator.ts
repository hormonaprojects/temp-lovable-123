
import { SupabaseRecipe } from '@/types/supabase';
import { normalizeText } from '@/utils/textNormalization';

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
  getRecipesByMealType: (mealType: string) => SupabaseRecipe[],
  convertToStandardRecipe: (recipe: SupabaseRecipe) => any
): Promise<GeneratedRecipe[]> => {
  console.log('🍽️ Napi étrend generálása:', { selectedMeals, ingredients });
  
  const newRecipes: GeneratedRecipe[] = [];
  
  for (const mealType of selectedMeals) {
    console.log(`\n🔍 ${mealType} receptek keresése...`);
    
    // Étkezési típus alapján receptek lekérése
    const mealTypeRecipes = getRecipesByMealType(mealType);
    console.log(`📋 ${mealType} összes recepte:`, mealTypeRecipes.length, 'db');
    
    let filteredRecipes = mealTypeRecipes;
    
    // Ha vannak kiválasztott alapanyagok, szűrjük a recepteket
    if (ingredients.length > 0) {
      console.log(`🎯 Szűrés alapanyagok alapján:`, ingredients.map(ing => ing.ingredient));
      
      filteredRecipes = mealTypeRecipes.filter(recipe => {
        const recipeIngredients = getAllRecipeIngredients(recipe);
        
        // Ellenőrizzük, hogy legalább egy kiválasztott alapanyag szerepel-e a receptben
        const hasMatchingIngredient = ingredients.some(selectedIng => 
          hasIngredientMatch(recipeIngredients, selectedIng.ingredient)
        );
        
        if (hasMatchingIngredient) {
          console.log(`✅ Recept ELFOGADVA: "${recipe['Recept_Neve']}" tartalmazza a kiválasztott alapanyagokat`);
        } else {
          console.log(`❌ Recept ELUTASÍTVA: "${recipe['Recept_Neve']}" nem tartalmazza a kiválasztott alapanyagokat`);
        }
        
        return hasMatchingIngredient;
      });
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

const getAllRecipeIngredients = (recipe: SupabaseRecipe): string[] => {
  return [
    recipe['Hozzavalo_1'], recipe['Hozzavalo_2'], recipe['Hozzavalo_3'],
    recipe['Hozzavalo_4'], recipe['Hozzavalo_5'], recipe['Hozzavalo_6'],
    recipe['Hozzavalo_7'], recipe['Hozzavalo_8'], recipe['Hozzavalo_9'],
    recipe['Hozzavalo_10'], recipe['Hozzavalo_11'], recipe['Hozzavalo_12'],
    recipe['Hozzavalo_13'], recipe['Hozzavalo_14'], recipe['Hozzavalo_15'],
    recipe['Hozzavalo_16'], recipe['Hozzavalo_17'], recipe['Hozzavalo_18']
  ].filter(Boolean).map(ing => ing?.toString() || '');
};

const hasIngredientMatch = (recipeIngredients: string[], searchIngredient: string): boolean => {
  const searchNormalized = normalizeText(searchIngredient);
  
  return recipeIngredients.some(recipeIng => {
    const recipeIngNormalized = normalizeText(recipeIng);
    
    // Pontosabb egyezés: a recept hozzávalója tartalmazza a keresett alapanyagot
    const containsIngredient = recipeIngNormalized.includes(searchNormalized);
    const exactMatch = recipeIngNormalized === searchNormalized;
    
    return exactMatch || containsIngredient;
  });
};
