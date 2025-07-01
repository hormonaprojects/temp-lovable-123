
import { CombinedRecipe } from '@/types/newDatabase';
import { UserPreference } from '@/services/preferenceFilters';

export const getRecipesByMealTypeNew = (
  recipes: CombinedRecipe[],
  mealTypeRecipes: Record<string, string[]>,
  mealType: string,
  userPreferences: UserPreference[] = []
): CombinedRecipe[] => {
  console.log('🔍 Receptek keresése új adatbázisból:', { mealType, totalRecipes: recipes.length });
  
  const mealTypeRecipeNames = mealTypeRecipes[mealType] || [];
  console.log(`📋 ${mealType} típusú receptek nevei:`, mealTypeRecipeNames);
  
  if (mealTypeRecipeNames.length === 0) {
    console.log(`❌ Nincs ${mealType} típusú recept a mealTypeRecipes-ben`);
    return [];
  }

  // Szűrjük a recepteket a meal type alapján
  const filteredRecipes = recipes.filter(recipe => {
    const recipeName = recipe.név.toLowerCase();
    const hasMatch = mealTypeRecipeNames.some(mealRecipeName => 
      recipeName.includes(mealRecipeName.toLowerCase()) ||
      mealRecipeName.toLowerCase().includes(recipeName)
    );
    
    if (hasMatch) {
      console.log(`✅ "${recipe.név}" megfelel a ${mealType} típusnak`);
    }
    
    return hasMatch;
  });

  console.log(`✅ Talált receptek ${mealType} típushoz:`, filteredRecipes.length);
  
  // Ha vannak felhasználói preferenciák, alkalmazzuk azokat
  if (userPreferences.length > 0) {
    const preferenceFilteredRecipes = filteredRecipes.filter(recipe => {
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
  }

  return filteredRecipes;
};

export const filterRecipesByMultipleIngredientsNew = (
  recipes: CombinedRecipe[],
  requiredIngredients: string[]
): CombinedRecipe[] => {
  console.log('🔍 Több alapanyag alapján szűrés (új adatbázis):', requiredIngredients);
  
  if (requiredIngredients.length === 0) {
    console.log('⚠️ Nincs megadva alapanyag, minden recept visszaküldése');
    return recipes;
  }
  
  return recipes.filter(recipe => {
    const recipeIngredients = recipe.hozzávalók.map(ing => ing.toLowerCase());
    
    // Minden szükséges alapanyagnak szerepelnie kell a receptben
    const hasAllIngredients = requiredIngredients.every(requiredIngredient => {
      const hasIngredient = recipeIngredients.some(recipeIngredient => 
        recipeIngredient.includes(requiredIngredient.toLowerCase()) ||
        requiredIngredient.toLowerCase().includes(recipeIngredient)
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
  console.log('🔍 Receptek keresése kategória alapján (új adatbázis):', { category, ingredient, mealType });
  
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
      const hasIngredient = recipe.hozzávalók.some(recipeIngredient => 
        recipeIngredient.toLowerCase().includes(ingredient.toLowerCase()) ||
        ingredient.toLowerCase().includes(recipeIngredient.toLowerCase())
      );
      
      if (hasIngredient) {
        console.log(`✅ "${recipe.név}" tartalmazza: ${ingredient}`);
      }
      
      return hasIngredient;
    });
  }
  
  console.log(`✅ Kategória szűrés eredménye: ${filteredRecipes.length} recept`);
  return filteredRecipes;
};
