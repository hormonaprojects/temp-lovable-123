
import { CombinedRecipe } from '@/types/newDatabase';
import { UserPreference } from '@/services/preferenceFilters';

export const getRecipesByMealTypeNew = (
  recipes: CombinedRecipe[],
  mealTypeRecipes: Record<string, string[]>,
  mealType: string,
  userPreferences: UserPreference[] = []
): CombinedRecipe[] => {
  console.log('🔍 Receptek keresése meal type alapján (JAVÍTOTT módszer):', { 
    mealType, 
    totalRecipes: recipes.length,
    recipesWithMealType: recipes.filter(r => r.mealType).length,
    userPreferences: userPreferences.length
  });
  
  // ELŐSZÖR: Az új mealType mező alapján szűrünk
  const directMealTypeMatches = recipes.filter(recipe => {
    const recipeMealType = recipe.mealType?.toLowerCase();
    const searchMealType = mealType.toLowerCase();
    
    return recipeMealType === searchMealType ||
           (searchMealType === 'tízórai' && recipeMealType === 'tizórai') ||
           (searchMealType === 'tizórai' && recipeMealType === 'tízórai');
  });
  
  console.log(`🎯 Direkt meal type találatok: ${directMealTypeMatches.length} recept`);
  
  if (directMealTypeMatches.length > 0) {
    console.log('✅ Meal type alapú szűrés használva');
    const filteredByPreferences = applyUserPreferences(directMealTypeMatches, userPreferences);
    console.log(`📊 Preferenciák alkalmazása után: ${filteredByPreferences.length} recept`);
    return filteredByPreferences;
  }
  
  // MÁSODSORBAN: Fallback a régi módszerre
  console.log('⚠️ Nincs direkt meal type találat, fallback a régi módszerre...');
  
  const mealTypeRecipeNames = mealTypeRecipes[mealType] || [];
  console.log(`📋 ${mealType} típusú receptek nevei (régi módszer):`, mealTypeRecipeNames.length, 'db');
  
  if (mealTypeRecipeNames.length === 0) {
    console.warn(`⚠️ Nincs ${mealType} típusú recept a mealTypeRecipes-ben`);
    return [];
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
  
  const filteredByPreferences = applyUserPreferences(filteredRecipes, userPreferences);
  console.log(`📊 Preferenciák alkalmazása után: ${filteredByPreferences.length} recept`);
  return filteredByPreferences;
};

const applyUserPreferences = (recipes: CombinedRecipe[], userPreferences: UserPreference[]): CombinedRecipe[] => {
  if (userPreferences.length === 0) {
    console.log('📝 Nincsenek felhasználói preferenciák, minden recept megtartva');
    return recipes;
  }

  console.log('🔍 Preferenciák alkalmazása:', userPreferences.length, 'preferencia');
  
  const preferenceFilteredRecipes = recipes.filter(recipe => {
    // Ellenőrizzük, hogy a recept tartalmaz-e dislike-olt alapanyagot
    const hasDislikedIngredient = recipe.hozzávalók.some(ingredient => {
      const ingredientLower = ingredient.toLowerCase();
      return userPreferences.some(pref => {
        if (pref.preference === 'dislike') {
          const prefIngredientLower = pref.ingredient.toLowerCase();
          const hasMatch = ingredientLower.includes(prefIngredientLower) ||
                          prefIngredientLower.includes(ingredientLower);
          
          if (hasMatch) {
            console.log(`❌ "${recipe.név}" kiszűrve: tartalmazza a nem kedvelt "${pref.ingredient}" alapanyagot`);
            return true;
          }
        }
        return false;
      });
    });
    
    return !hasDislikedIngredient;
  });
  
  console.log(`🎯 Preferenciák alkalmazása után: ${preferenceFilteredRecipes.length}/${recipes.length} recept maradt`);
  
  // Preferált receptek előre sorolása
  const sortedRecipes = preferenceFilteredRecipes.sort((a, b) => {
    const aLikedIngredients = a.hozzávalók.filter(ingredient => {
      const ingredientLower = ingredient.toLowerCase();
      return userPreferences.some(pref => 
        pref.preference === 'like' && 
        (ingredientLower.includes(pref.ingredient.toLowerCase()) ||
         pref.ingredient.toLowerCase().includes(ingredientLower))
      );
    }).length;
    
    const bLikedIngredients = b.hozzávalók.filter(ingredient => {
      const ingredientLower = ingredient.toLowerCase();
      return userPreferences.some(pref => 
        pref.preference === 'like' && 
        (ingredientLower.includes(pref.ingredient.toLowerCase()) ||
         pref.ingredient.toLowerCase().includes(ingredientLower))
      );
    }).length;
    
    return bLikedIngredients - aLikedIngredients; // Több kedvelt alapanyag = előrébb
  });
  
  return sortedRecipes;
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
    totalRecipes: recipes.length,
    userPreferences: userPreferences.length
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
  
  // Ha nem volt meal type szűrés, alkalmazzuk a preferenciákat itt
  if (!mealType && userPreferences.length > 0) {
    filteredRecipes = applyUserPreferences(filteredRecipes, userPreferences);
  }
  
  console.log(`✅ Kategória szűrés eredménye: ${filteredRecipes.length} recept`);
  return filteredRecipes;
};
