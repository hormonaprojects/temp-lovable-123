
import { useState } from 'react';
import { filterRecipesByMultipleIngredients } from '@/services/recipeFilters';

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

interface MealIngredients {
  [mealType: string]: SelectedIngredient[];
}

interface UseMealPlanGenerationProps {
  selectedMeals: string[];
  getRecipesByMealType: (mealType: string) => any[];
  convertToStandardRecipe: (recipe: any) => any;
}

export function useMealPlanGeneration({
  selectedMeals,
  getRecipesByMealType,
  convertToStandardRecipe
}: UseMealPlanGenerationProps) {
  const [generatedRecipes, setGeneratedRecipes] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);

  const handleGenerateMealPlan = async (mealIngredients: MealIngredients = {}) => {
    if (selectedMeals.length === 0) {
      console.log('❌ Nem választottál ki étkezési típust');
      return;
    }

    if (isGenerating) {
      console.log('🔄 Generálás már folyamatban, kihagyjuk...');
      return;
    }

    console.log('🍽️ Napi étrend generálás indítása:', { selectedMeals, mealIngredients });
    setIsGenerating(true);
    
    // Összesítjük az összes kiválasztott alapanyagot a selectedIngredients state-hez
    const allIngredients = Object.values(mealIngredients).flat();
    setSelectedIngredients(allIngredients);
    
    try {
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
      const newRecipes = [];

      // Minden kiválasztott étkezési típusra generálunk egy receptet
      for (const mealType of selectedMeals) {
        console.log(`\n🔍 Recept generálása: ${mealType}`);
        
        // Az aktuális étkezéshez tartozó alapanyagok
        const mealSpecificIngredients = mealIngredients[mealType] || [];
        console.log(`📋 ${mealType} kiválasztott alapanyagok:`, mealSpecificIngredients);
        
        const mealTypeRecipes = getRecipesByMealType(mealType);
        console.log(`📋 ${mealType} étkezéshez tartozó receptek:`, mealTypeRecipes.length);

        let validRecipes = [];

        if (mealSpecificIngredients.length > 0) {
          // Ha vannak kiválasztott alapanyagok ehhez az étkezéshez, használjuk a moduláris szűrőt
          console.log(`🎯 ALAPANYAG SZŰRÉS ${mealSpecificIngredients.length} alapanyag alapján`);
          
          // Csak az alapanyag neveket gyűjtjük össze
          const ingredientNames = mealSpecificIngredients.map(ing => ing.ingredient);
          console.log(`🔍 Szűrés ezekkel az alapanyagokkal:`, ingredientNames);
          
          // Használjuk a filterRecipesByMultipleIngredients függvényt
          validRecipes = filterRecipesByMultipleIngredients(mealTypeRecipes, ingredientNames);
          
        } else {
          // Ha nincsenek kiválasztott alapanyagok ehhez az étkezéshez, használjuk az összes receptet
          validRecipes = mealTypeRecipes;
          console.log(`🎯 Nincs szűrés, minden recept használható: ${validRecipes.length}`);
        }

        if (validRecipes.length > 0) {
          const randomIndex = Math.floor(Math.random() * validRecipes.length);
          const selectedSupabaseRecipe = validRecipes[randomIndex];
          const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
          
          // Hozzáadjuk az étkezési típust és egyéb metaadatokat
          const recipeWithMeta = {
            ...standardRecipe,
            mealType,
            category: mealSpecificIngredients.length > 0 ? mealSpecificIngredients.map(ing => ing.category).join(", ") : "Minden kategória",
            ingredient: mealSpecificIngredients.length > 0 ? mealSpecificIngredients.map(ing => ing.ingredient).join(", ") : "Minden alapanyag"
          };
          
          newRecipes.push(recipeWithMeta);
          console.log(`✅ SIKERES TALÁLAT ${mealType}-hez: "${standardRecipe.név}"`);
        } else {
          console.log(`❌ NINCS MEGFELELŐ RECEPT ${mealType}-hez a kiválasztott alapanyagokkal`);
          // Továbbra is folytatjuk a többi étkezési típussal
        }
      }

      await minLoadingTime;
      setGeneratedRecipes(newRecipes);
      
      if (newRecipes.length > 0) {
        const totalIngredients = Object.values(mealIngredients).flat().length;
        console.log(`✅ Étrend sikeresen generálva: ${newRecipes.length} recept (${totalIngredients} alapanyag)`);
      } else {
        console.log('❌ Nem található elegendő recept a kiválasztott étkezésekhez és alapanyagokhoz');
      }
      
    } catch (error) {
      console.error('❌ Étrend generálási hiba:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGetMultipleCategoryRecipes = async (mealIngredients: MealIngredients) => {
    console.log('🔄 handleGetMultipleCategoryRecipes hívva (MANUÁLIS gombnyomás):', mealIngredients);
    await handleGenerateMealPlan(mealIngredients);
  };

  return {
    generatedRecipes,
    isGenerating,
    selectedIngredients,
    handleGenerateMealPlan,
    handleGetMultipleCategoryRecipes
  };
}
