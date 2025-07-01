
import { CombinedRecipe } from '@/types/newDatabase';
import { UserPreference } from '@/services/preferenceFilters';

export const getRecipesByMealTypeNew = (
  recipes: CombinedRecipe[],
  mealTypeRecipes: Record<string, string[]>,
  mealType: string,
  userPreferences: UserPreference[] = []
): CombinedRecipe[] => {
  console.log('🔍 Receptek keresése kombinált módszerrel:', { 
    mealType, 
    totalRecipes: recipes.length,
    availableMealTypes: Object.keys(mealTypeRecipes)
  });
  
  const mealTypeRecipeNames = mealTypeRecipes[mealType] || [];
  console.log(`📋 ${mealType} típusú receptek nevei:`, mealTypeRecipeNames.length, 'db');
  
  if (mealTypeRecipeNames.length === 0) {
    console.warn(`⚠️ Nincs ${mealType} típusú recept a mealTypeRecipes-ben`);
    
    // Fallback: keressünk a recept nevekben közvetlenül
    const directMatches = recipes.filter(recipe => {
      const recipeName = recipe.név.toLowerCase();
      const mealTypeLower = mealType.toLowerCase();
      
      // Egyszerű szöveg alapú keresés
      const hasDirectMatch = recipeName.includes(mealTypeLower) ||
                           (mealTypeLower === 'reggeli' && (recipeName.includes('reggeli') || recipeName.includes('breakfast'))) ||
                           (mealTypeLower === 'ebéd' && (recipeName.includes('ebéd') || recipeName.includes('lunch'))) ||
                           (mealTypeLower === 'vacsora' && (recipeName.includes('vacsora') || recipeName.includes('dinner'))) ||
                           (mealTypeLower === 'tízórai' && (recipeName.includes('tízórai') || recipeName.includes('snack'))) ||
                           (mealTypeLower === 'uzsonna' && (recipeName.includes('uzsonna') || recipeName.includes('snack')));
      
      return hasDirectMatch;
    });
    
    console.log(`🔍 Fallback keresés eredménye: ${directMatches.length} recept`);
    
    if (directMatches.length > 0) {
      return applyUserPreferences(directMatches, userPreferences);
    }
    
    // Ha még mindig nincs találat, adjunk vissza random recepteket
    console.log('🎲 Nincs specifikus találat, random receptek visszaadása...');
    const randomRecipes = recipes.slice(0, Math.min(5, recipes.length));
    return applyUserPreferences(randomRecipes, userPreferences);
  }

  // Normál szűrés a meal type alapján
  const filteredRecipes = recipes.filter(recipe => {
    const recipeName = recipe.név.toLowerCase();
    const hasMatch = mealTypeRecipeNames.some(mealRecipeName => {
      const mealRecipeNameLower = mealRecipeName.toLowerCase();
      return recipeName.includes(mealRecipeNameLower) ||
             mealRecipeNameLower.includes(recipeName) ||
             recipeName === mealRecipeNameLower;
    });
    
    return hasMatch;
  });

  console.log(`✅ Talált receptek ${mealType} típushoz:`, filteredRecipes.length);
  
  return applyUserPreferences(filteredRecipes, userPreferences);
};

const applyUserPreferences = (recipes: CombinedRecipe[], userPreferences: UserPreference[]): CombinedRecipe[] => {
  if (userPreferences.length === 0) {
    return recipes;
  }

  const preferenceFilteredRecipes = recipes.filter(recipe => {
    // Ellenőrizzük, hogy a recept tartalmaz-e dislike-olt alapanyagot
    const hasDislikedIngredient = recipe.hozzávalók.some(ingredient => {
      return userPreferences.some(pref => 
        pref.preference === 'dislike' && 
        ingredient.toLowerCase().includes(pref.ingredient.toLowerCase())
      );
    });
    
    if (hasDislikedIngredient) {
      console.log(`❌ "${recipe.név}" kiszűrve preferenciák miatt`);
    }
    
    return !hasDislikedIngredient;
  });
  
  console.log(`🎯 Preferenciák alkalmazása után: ${preferenceFilteredRecipes.length} recept`);
  return preferenceFilteredRecipes;
};

export const filterRecipesByMultipleIngredientsNew = (
  recipes: CombinedRecipe[],
  requiredIngredients: string[]
): CombinedRecipe[] => {
  console.log('🔍 Több alapanyag alapján szűrés (kombinált módszer):', requiredIngredients);
  
  if (requiredIngredients.length === 0) {
    console.log('⚠️ Nincs megadva alapanyag, minden recept visszaküldése');
    return recipes;
  }
  
  return recipes.filter(recipe => {
    const recipeIngredients = recipe.hozzávalók.map(ing => ing.toLowerCase());
    
    // Minden szükséges alapanyagnak szerepelnie kell a receptben
    const hasAllIngredients = requiredIngredients.every(requiredIngredient => {
      const requiredLower = requiredIngredient.toLowerCase();
      const hasIngredient = recipeIngredients.some(recipeIngredient => 
        recipeIngredient.includes(requiredLower) ||
        requiredLower.includes(recipeIngredient.split(' ').pop() || '') // Utolsó szó keresése
      );
      
      if (!hasIngredient) {
        console.log(`❌ "${recipe.név}" nem tartalmazza: ${requiredIngredient}`);
      }
      
      return hasIngredient;
    });
    
    if (hasAllIngredients) {
      console.log(`✅ "${recipe.név}" tartalmazza az összes szükséges alapanyagot`);
    }
    
    return hasAllIngredients;
  });
};

export const getRecipesByCategoryNew = (
  recipes: CombinedRecipe[],
  mealTypeRecipes: Record<string, string[]>,
  categories: Record<string, string[]>,
  category: string,
  ingredient?: string,
  mealType?: string,
  userPreferences: UserPreference[] = []
): CombinedRecipe[] => {
  console.log('🔍 Receptek keresése kategória alapján (kombinált módszer):', { 
    category, 
    ingredient, 
    mealType,
    totalRecipes: recipes.length
  });
  
  let filteredRecipes = [...recipes];
  
  // Szűrés meal type alapján ha meg van adva
  if (mealType) {
    console.log(`🎯 Szűrés meal type alapján: ${mealType}`);
    filteredRecipes = getRecipesByMealTypeNew(filteredRecipes, mealTypeRecipes, mealType, userPreferences);
  }
  
  // Szűrés alapanyag alapján ha meg van adva
  if (ingredient) {
    console.log(`🎯 Szűrés alapanyag alapján: ${ingredient}`);
    filteredRecipes = filteredRecipes.filter(recipe => {
      const hasIngredient = recipe.hozzávalók.some(recipeIngredient => {
        const recipeIngLower = recipeIngredient.toLowerCase();
        const ingredientLower = ingredient.toLowerCase();
        return recipeIngLower.includes(ingredientLower) ||
               ingredientLower.includes(recipeIngredient.split(' ').pop()?.toLowerCase() || '');
      });
      
      if (hasIngredient) {
        console.log(`✅ "${recipe.név}" tartalmazza: ${ingredient}`);
      }
      
      return hasIngredient;
    });
  }
  
  console.log(`✅ Kategória szűrés eredménye: ${filteredRecipes.length} recept`);
  return filteredRecipes;
};
