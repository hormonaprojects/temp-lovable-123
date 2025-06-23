
import { useState } from 'react';
import { Recipe } from '@/types/recipe';

interface MultiDayMealPlan {
  day: number;
  date: string;
  meals: {
    [mealType: string]: Recipe | null;
  };
}

interface UseMultiDayPlanGenerationProps {
  getRecipesByMealType: (mealType: string) => any[];
  convertToStandardRecipe: (recipe: any) => Recipe;
}

export function useMultiDayPlanGeneration({
  getRecipesByMealType,
  convertToStandardRecipe
}: UseMultiDayPlanGenerationProps) {
  const [multiDayPlan, setMultiDayPlan] = useState<MultiDayMealPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMultiDayPlan = async (days: number): Promise<MultiDayMealPlan[]> => {
    if (days <= 0) {
      console.log('❌ Érvénytelen napok száma:', days);
      return [];
    }

    console.log(`🍽️ ${days} napos étrend generálás indítása`);
    setIsGenerating(true);
    
    try {
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
      const mealTypesArray = ['reggeli', 'ebéd', 'vacsora'];
      const newPlan: MultiDayMealPlan[] = [];
      
      for (let day = 1; day <= days; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day - 1);
        const formattedDate = date.toLocaleDateString('hu-HU');
        
        console.log(`📅 ${day}. nap generálása (${formattedDate})`);
        
        const dayPlan: MultiDayMealPlan = {
          day,
          date: formattedDate,
          meals: {}
        };
        
        // Minden étkezési típusra generálunk egy receptet
        for (const mealType of mealTypesArray) {
          console.log(`🔍 ${mealType} recept keresése...`);
          
          const foundRecipes = getRecipesByMealType(mealType);
          console.log(`📋 ${mealType} - ${foundRecipes.length} recept található`);
          
          if (foundRecipes.length > 0) {
            const randomIndex = Math.floor(Math.random() * foundRecipes.length);
            const selectedSupabaseRecipe = foundRecipes[randomIndex];
            const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
            dayPlan.meals[mealType] = standardRecipe;
            
            console.log(`✅ ${mealType}: "${standardRecipe.név}" kiválasztva`);
          } else {
            dayPlan.meals[mealType] = null;
            console.log(`❌ ${mealType}: Nincs elérhető recept`);
          }
        }
        
        newPlan.push(dayPlan);
      }
      
      await minLoadingTime;
      setMultiDayPlan(newPlan);
      
      console.log(`✅ ${days} napos étrend sikeresen generálva!`);
      return newPlan;
      
    } catch (error) {
      console.error('❌ Hiba a többnapos étrend generálásakor:', error);
      return [];
    } finally {
      setIsGenerating(false);
    }
  };

  const clearPlan = () => {
    setMultiDayPlan([]);
    console.log('🗑️ Többnapos étrend törölve');
  };

  return {
    multiDayPlan,
    isGenerating,
    generateMultiDayPlan,
    clearPlan
  };
}
