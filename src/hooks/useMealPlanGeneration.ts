
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SelectedIngredient {
  category: string;
  ingredient: string;
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
  const { toast } = useToast();

  // PONTOSAN ugyanaz a logika, mint a SingleRecipeApp-ban
  const getAllRecipeIngredients = (recipe: any): string[] => {
    return [
      recipe['Hozzavalo_1'], recipe['Hozzavalo_2'], recipe['Hozzavalo_3'],
      recipe['Hozzavalo_4'], recipe['Hozzavalo_5'], recipe['Hozzavalo_6'],
      recipe['Hozzavalo_7'], recipe['Hozzavalo_8'], recipe['Hozzavalo_9'],
      recipe['Hozzavalo_10'], recipe['Hozzavalo_11'], recipe['Hozzavalo_12'],
      recipe['Hozzavalo_13'], recipe['Hozzavalo_14'], recipe['Hozzavalo_15'],
      recipe['Hozzavalo_16'], recipe['Hozzavalo_17'], recipe['Hozzavalo_18']
    ].filter(Boolean).map(ing => ing?.toString() || '');
  };

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();
  };

  const hasIngredient = (recipeIngredients: string[], searchIngredient: string): boolean => {
    const searchNormalized = normalizeText(searchIngredient);
    return recipeIngredients.some(recipeIng => {
      const recipeIngNormalized = normalizeText(recipeIng);
      return recipeIngNormalized.includes(searchNormalized) || searchNormalized.includes(recipeIngNormalized);
    });
  };

  const handleGenerateMealPlan = async (ingredients: SelectedIngredient[] = []) => {
    if (selectedMeals.length === 0) {
      toast({
        title: "Hiba",
        description: "Válasszon ki legalább egy étkezési típust!",
        variant: "destructive"
      });
      return;
    }

    if (isGenerating) {
      console.log('🔄 Generálás már folyamatban, kihagyjuk...');
      return;
    }

    console.log('🍽️ Napi étrend generálás indítása:', { selectedMeals, ingredients });
    setIsGenerating(true);
    setSelectedIngredients(ingredients);
    
    try {
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
      const newRecipes = [];

      // Minden kiválasztott étkezési típusra generálunk egy receptet
      for (const mealType of selectedMeals) {
        console.log(`🔍 Recept generálása: ${mealType}`);
        
        // Ugyanaz a logika, mint a SingleRecipeApp-ban
        const mealTypeRecipes = getRecipesByMealType(mealType);
        console.log(`📋 ${mealType} étkezéshez tartozó receptek:`, mealTypeRecipes.length);

        let validRecipes = [];

        if (ingredients.length > 0) {
          // Ha vannak kiválasztott alapanyagok, szűrjük őket
          validRecipes = mealTypeRecipes.filter(recipe => {
            const recipeIngredients = getAllRecipeIngredients(recipe);
            console.log(`\n🔍 Recept vizsgálata: ${recipe['Recept_Neve']}`);
            
            // Ellenőrizzük, hogy MINDEN kiválasztott alapanyag szerepel-e a receptben
            const hasAllIngredients = ingredients.every(selectedIng => {
              const found = hasIngredient(recipeIngredients, selectedIng.ingredient);
              console.log(`${found ? '✅' : '❌'} "${selectedIng.ingredient}" ${found ? 'MEGTALÁLVA' : 'HIÁNYZIK'}`);
              return found;
            });
            
            if (hasAllIngredients) {
              console.log(`✅ ✅ ✅ ELFOGADVA: "${recipe['Recept_Neve']}" TARTALMAZZA az ÖSSZES alapanyagot!`);
            } else {
              console.log(`❌ ❌ ❌ ELUTASÍTVA: "${recipe['Recept_Neve']}" NEM tartalmazza az összes alapanyagot!`);
            }
            
            return hasAllIngredients;
          });
        } else {
          // Ha nincsenek kiválasztott alapanyagok, használjuk az összes receptet
          validRecipes = mealTypeRecipes;
        }

        if (validRecipes.length > 0) {
          const randomIndex = Math.floor(Math.random() * validRecipes.length);
          const selectedSupabaseRecipe = validRecipes[randomIndex];
          const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
          
          // Hozzáadjuk az étkezési típust és egyéb metaadatokat
          const recipeWithMeta = {
            ...standardRecipe,
            mealType,
            category: ingredients.length > 0 ? ingredients.map(ing => ing.category).join(", ") : "Minden kategória",
            ingredient: ingredients.length > 0 ? ingredients.map(ing => ing.ingredient).join(", ") : "Minden alapanyag"
          };
          
          newRecipes.push(recipeWithMeta);
          console.log(`✅ SIKERES TALÁLAT ${mealType}-hez: "${standardRecipe.név}"`);
        } else {
          console.log(`❌ NINCS MEGFELELŐ RECEPT ${mealType}-hez`);
          // Továbbra is folytatjuk a többi étkezési típussal
        }
      }

      await minLoadingTime;
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
    console.log('🔄 handleGetMultipleCategoryRecipes hívva:', ingredients);
    await handleGenerateMealPlan(ingredients);
  };

  const generateDailyMealPlanWithoutIngredients = async () => {
    console.log('🔄 generateDailyMealPlanWithoutIngredients hívva');
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
