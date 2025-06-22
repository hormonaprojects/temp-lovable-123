
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateDailyMealPlan } from '@/services/dailyMealPlanGenerator';

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

interface UseMealPlanGenerationProps {
  selectedMeals: string[];
  recipes: any[];
  mealTypes: any;
  convertToStandardRecipe: (recipe: any) => any;
}

export function useMealPlanGeneration({
  selectedMeals,
  recipes,
  mealTypes,
  convertToStandardRecipe
}: UseMealPlanGenerationProps) {
  const [generatedRecipes, setGeneratedRecipes] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const { toast } = useToast();

  // EGYSÉGES recept generálási függvény
  const handleGenerateMealPlan = async (ingredients: SelectedIngredient[] = []) => {
    if (selectedMeals.length === 0) {
      toast({
        title: "Hiba",
        description: "Válasszon ki legalább egy étkezési típust!",
        variant: "destructive"
      });
      return;
    }

    console.log('🍽️ EGYSÉGES recept generálás indítása:', { selectedMeals, ingredients });
    setIsGenerating(true);
    setSelectedIngredients(ingredients);
    
    try {
      // Extract meal type recipes from mealTypes object
      const mealTypeRecipes: Record<string, string[]> = {};
      Object.keys(mealTypes).forEach(mealType => {
        mealTypeRecipes[mealType] = mealTypes[mealType] || [];
      });

      console.log('📋 Mealtype receptek:', mealTypeRecipes);

      const newRecipes = await generateDailyMealPlan(
        selectedMeals,
        ingredients,
        recipes,
        mealTypeRecipes,
        convertToStandardRecipe
      );
      
      setGeneratedRecipes(newRecipes);
      
      if (newRecipes.length > 0) {
        const ingredientText = ingredients.length > 0 
          ? ` a kiválasztott alapanyagokkal (${ingredients.map(ing => ing.ingredient).join(", ")})`
          : " preferenciáid alapján";
          
        toast({
          title: "Étrend elkészült!",
          description: `${newRecipes.length} recept sikeresen generálva${ingredientText}.`,
        });
      } else {
        toast({
          title: "Nincs megfelelő recept",
          description: "Nem található elegendő recept a kiválasztott étkezésekhez és alapanyagokhoz. Próbáljon más alapanyagokat vagy étkezési típusokat!",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('❌ Étrend generálási hiba:', error);
      toast({
        title: "Hiba",
        description: "Hiba történt az étrend generálása közben.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGetMultipleCategoryRecipes = async (ingredients: SelectedIngredient[]) => {
    await handleGenerateMealPlan(ingredients);
  };

  const generateDailyMealPlanWithoutIngredients = async () => {
    await handleGenerateMealPlan([]);
  };

  return {
    generatedRecipes,
    isGenerating,
    selectedIngredients,
    handleGenerateMealPlan,
    handleGetMultipleCategoryRecipes,
    generateDailyMealPlanWithoutIngredients
  };
}
