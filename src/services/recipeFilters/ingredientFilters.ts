
import { SupabaseRecipe } from '@/types/supabase';
import { normalizeText } from '@/utils/textNormalization';

// Alapanyagok kinyerése egy receptből
export const getAllRecipeIngredients = (recipe: SupabaseRecipe): string[] => {
  return [
    recipe['Hozzavalo_1'], recipe['Hozzavalo_2'], recipe['Hozzavalo_3'],
    recipe['Hozzavalo_4'], recipe['Hozzavalo_5'], recipe['Hozzavalo_6'],
    recipe['Hozzavalo_7'], recipe['Hozzavalo_8'], recipe['Hozzavalo_9'],
    recipe['Hozzavalo_10'], recipe['Hozzavalo_11'], recipe['Hozzavalo_12'],
    recipe['Hozzavalo_13'], recipe['Hozzavalo_14'], recipe['Hozzavalo_15'],
    recipe['Hozzavalo_16'], recipe['Hozzavalo_17'], recipe['Hozzavalo_18']
  ].filter(Boolean).map(ing => ing?.toString() || '');
};

// Ellenőrzi, hogy egy recept tartalmaz-e egy adott alapanyagot
export const hasIngredientMatch = (recipeIngredients: string[], searchIngredient: string): boolean => {
  const searchNormalized = normalizeText(searchIngredient);
  
  return recipeIngredients.some(recipeIng => {
    const recipeIngNormalized = normalizeText(recipeIng);
    const exactMatch = recipeIngNormalized === searchNormalized;
    const containsIngredient = recipeIngNormalized.includes(searchNormalized);
    
    return exactMatch || containsIngredient;
  });
};

// Alapanyag szűrés - külön függvény az átláthatóságért
export const filterRecipesByIngredient = (
  recipes: SupabaseRecipe[],
  ingredient: string
): SupabaseRecipe[] => {
  console.log(`🎯 Alapanyag szűrés: "${ingredient}"`);

  const filteredRecipes = recipes.filter(recipe => {
    const allIngredients = getAllRecipeIngredients(recipe);
    const hasIngredient = hasIngredientMatch(allIngredients, ingredient);
    
    if (hasIngredient) {
      console.log(`✅ ELFOGADVA: "${recipe['Recept_Neve']}" tartalmazza "${ingredient}"-t`);
    } else {
      console.log(`❌ ELUTASÍTVA: "${recipe['Recept_Neve']}" nem tartalmazza "${ingredient}"-t`);
    }
    
    return hasIngredient;
  });
  
  console.log(`🎯 Alapanyag szűrés eredménye: ${filteredRecipes.length}/${recipes.length} recept`);
  return filteredRecipes;
};

// Több alapanyag szűrés - minden alapanyagnak szerepelnie kell
export const filterRecipesByMultipleIngredients = (
  recipes: SupabaseRecipe[],
  ingredients: string[]
): SupabaseRecipe[] => {
  console.log(`🎯 Több alapanyag szűrés:`, ingredients);

  const filteredRecipes = recipes.filter(recipe => {
    const recipeIngredients = getAllRecipeIngredients(recipe);
    
    // Ellenőrizzük, hogy MINDEN kiválasztott alapanyag szerepel-e a receptben
    const hasAllIngredients = ingredients.every(selectedIngredient => {
      const found = hasIngredientMatch(recipeIngredients, selectedIngredient);
      console.log(`${found ? '✅' : '❌'} "${selectedIngredient}" ${found ? 'MEGTALÁLVA' : 'HIÁNYZIK'} - ${recipe['Recept_Neve']}`);
      return found;
    });
    
    if (hasAllIngredients) {
      console.log(`✅ ✅ ✅ ELFOGADVA: "${recipe['Recept_Neve']}" TARTALMAZZA az ÖSSZES alapanyagot!`);
    } else {
      console.log(`❌ ❌ ❌ ELUTASÍTVA: "${recipe['Recept_Neve']}" NEM tartalmazza az összes alapanyagot!`);
    }
    
    return hasAllIngredients;
  });
  
  console.log(`🎯 Több alapanyag szűrés eredménye: ${filteredRecipes.length}/${recipes.length} recept`);
  return filteredRecipes;
};
