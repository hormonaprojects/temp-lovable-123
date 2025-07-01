
import { CombinedRecipe } from '@/types/newDatabase';
import { UserPreference } from '@/services/preferenceFilters';

export const getRecipesByMealTypeNew = (
  recipes: CombinedRecipe[],
  mealTypeRecipes: Record<string, string[]>,
  mealType: string,
  userPreferences: UserPreference[] = []
): CombinedRecipe[] => {
  console.log('🔍 Receptek keresése meal type alapján (ID-ALAPÚ módszer):', { 
    mealType, 
    totalRecipes: recipes.length,
    recipesWithMealType: recipes.filter(r => r.mealType).length,
    userPreferences: userPreferences.length
  });
  
  // ELSŐ PRIORITÁS: Az új mealType mező alapján szűrünk (ID-alapú kapcsolat)
  const directMealTypeMatches = recipes.filter(recipe => {
    const recipeMealType = recipe.mealType?.toLowerCase();
    const searchMealType = mealType.toLowerCase();
    
    const isMatch = recipeMealType === searchMealType ||
                   (searchMealType === 'tízórai' && recipeMealType === 'tizórai') ||
                   (searchMealType === 'tizórai' && recipeMealType === 'tízórai');
    
    if (isMatch) {
      console.log(`✅ ID-alapú találat: "${recipe.név}" (${recipe.id}) → ${recipeMealType}`);
    }
    
    return isMatch;
  });
  
  console.log(`🎯 Direkt meal type találatok (ID-alapú): ${directMealTypeMatches.length} recept`);
  
  if (directMealTypeMatches.length > 0) {
    console.log('✅ ID-alapú meal type szűrés használva');
    const filteredByPreferences = applyUserPreferences(directMealTypeMatches, userPreferences);
    console.log(`📊 Preferenciák alkalmazása után: ${filteredByPreferences.length} recept`);
    return filteredByPreferences;
  }
  
  // MÁSODIK PRIORITÁS: Fallback a régi név-alapú módszerre
  console.log('⚠️ Nincs ID-alapú meal type találat, fallback a név-alapú módszerre...');
  
  const mealTypeRecipeNames = mealTypeRecipes[mealType] || [];
  console.log(`📋 ${mealType} típusú receptek nevei (név-alapú módszer):`, mealTypeRecipeNames.length, 'db');
  
  if (mealTypeRecipeNames.length === 0) {
    console.warn(`⚠️ Nincs ${mealType} típusú recept sem ID-alapon, sem név alapon`);
    return [];
  }

  // Név-alapú szűrés fallback-ként
  const filteredRecipes = recipes.filter(recipe => {
    const recipeName = recipe.név.toLowerCase();
    const hasMatch = mealTypeRecipeNames.some(mealRecipeName => {
      const mealRecipeNameLower = mealRecipeName.toLowerCase();
      const isMatch = recipeName.includes(mealRecipeNameLower) ||
                     mealRecipeNameLower.includes(recipeName) ||
                     recipeName === mealRecipeNameLower;
      
      if (isMatch) {
        console.log(`✅ Név-alapú találat: "${recipe.név}" (${recipe.id})`);
      }
      
      return isMatch;
    });
    
    return hasMatch;
  });

  console.log(`✅ Talált receptek ${mealType} típushoz (név-alapú fallback):`, filteredRecipes.length);
  
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
            console.log(`❌ "${recipe.név}" (${recipe.id}) kiszűrve: tartalmazza a nem kedvelt "${pref.ingredient}" alapanyagot`);
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
  console.log('🔍 Több alapanyag alapján szűrés (ID-alapú módszer):', requiredIngredients);
  
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
        console.log(`❌ "${recipe.név}" (${recipe.id}) nem tartalmazza: ${requiredIngredient}`);
      }
      
      return hasIngredient;
    });
    
    if (hasAllIngredients) {
      console.log(`✅ "${recipe.név}" (${recipe.id}) tartalmazza az összes szükséges alapanyagot`);
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
  console.log('🔍 Receptek keresése kategória alapján (ID-alapú módszer):', { 
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
        const hasMatch = recipeIngLower.includes(ingredientLower) ||
                        ingredientLower.includes(recipeIngredient.split(' ').pop()?.toLowerCase() || '');
        
        if (hasMatch) {
          console.log(`✅ "${recipe.név}" (${recipe.id}) tartalmazza: ${ingredient}`);
        }
        
        return hasMatch;
      });
      
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
