
import { useState } from 'react';

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

  // ELTÁVOLÍTOTTAM az összes useEffect-et hogy megakadályozzam az automatikus generálást
  
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
      // SZIGORÚBB keresés: csak akkor fogadjuk el, ha ténylegesen tartalmazza
      return recipeIngNormalized.includes(searchNormalized);
    });
  };

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
          // Ha vannak kiválasztott alapanyagok ehhez az étkezéshez, SZIGORÚAN szűrjük őket
          console.log(`🎯 SZIGORÚ szűrés ${mealSpecificIngredients.length} alapanyag alapján`);
          
          validRecipes = mealTypeRecipes.filter(recipe => {
            const recipeIngredients = getAllRecipeIngredients(recipe);
            console.log(`\n🔍 Recept vizsgálata: "${recipe['Recept_Neve']}"`);
            console.log(`📝 Recept alapanyagai:`, recipeIngredients);
            
            // Ellenőrizzük, hogy MINDEN kiválasztott alapanyag szerepel-e a receptben
            const hasAllIngredients = mealSpecificIngredients.every(selectedIng => {
              const found = hasIngredient(recipeIngredients, selectedIng.ingredient);
              console.log(`${found ? '✅' : '❌'} "${selectedIng.ingredient}" ${found ? 'MEGTALÁLVA' : 'HIÁNYZIK'} - ${recipe['Recept_Neve']}`);
              return found;
            });
            
            if (hasAllIngredients) {
              console.log(`✅ ✅ ✅ ELFOGADVA (${mealType}): "${recipe['Recept_Neve']}" TARTALMAZZA az ÖSSZES alapanyagot!`);
            } else {
              console.log(`❌ ❌ ❌ ELUTASÍTVA (${mealType}): "${recipe['Recept_Neve']}" NEM tartalmazza az összes alapanyagot!`);
            }
            
            return hasAllIngredients;
          });
          
          console.log(`🎯 SZIGORÚ szűrés után ${validRecipes.length} recept maradt`);
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
