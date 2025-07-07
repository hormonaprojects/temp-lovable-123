import { CombinedRecipe } from './database/types';
import { fetchNewIngredients, findIngredientByName } from './newIngredientQueries';

export const filterRecipesByPreferencesAdapter = async (
  recipes: CombinedRecipe[],
  selectedIngredientNames: string[],
  userId?: string
): Promise<CombinedRecipe[]> => {
  console.log('🔄 ÚJ preferencia adapter szűrés');
  console.log('📊 Receptek száma:', recipes.length);
  console.log('🥕 Kiválasztott alapanyagok:', selectedIngredientNames);

  if (selectedIngredientNames.length === 0) {
    console.log('✅ Nincs szűrés - minden receptet visszaadok');
    return recipes;
  }

  const assignedIds: string[] = [];

  // Név -> Hozzarendelt_ID konverzió
  for (const name of selectedIngredientNames) {
    const ingredient = await findIngredientByName(name);
    
    if (ingredient?.Hozzarendelt_ID) {
      assignedIds.push(ingredient.Hozzarendelt_ID);
      console.log(`✅ ${name} -> ID: ${ingredient.Hozzarendelt_ID}`);
    } else {
      console.warn(`❌ Nincs ID találat: ${name}`);
    }
  }

  console.log('🔗 Összegyűjtött ID-k:', assignedIds);

  if (assignedIds.length === 0) {
    console.warn('⚠️ Nincs egyetlen ID sem - üres eredmény');
    return [];
  }

  // Receptek szűrése ID alapján
  const filtered = recipes.filter(recipe => {
    if (!recipe.Hozzarendelt_ID) {
      console.log(`❌ Recept ${recipe.név} - nincs Hozzarendelt_ID`);
      return false;
    }
    
    const recipeIds = recipe.Hozzarendelt_ID.split(',').map(id => id.trim());
    const hasMatch = assignedIds.some(id => recipeIds.includes(id));
    
    if (hasMatch) {
      console.log(`✅ Recept ${recipe.név} - találat! Recipe IDs:`, recipeIds, 'Keresett IDs:', assignedIds);
    }
    
    return hasMatch;
  });

  console.log(`📊 Szűrés eredménye: ${filtered.length}/${recipes.length} recept`);
  
  if (filtered.length > 0) {
    console.log('🍽️ Szűrt receptek:', filtered.map(r => r.név));
  }

  return filtered;
};

export const filterRecipesByIngredientIds = async (
  recipes: CombinedRecipe[],
  assignedIds: string[]
): Promise<CombinedRecipe[]> => {
  console.log('🔄 Receptek szűrése ID lista alapján:', assignedIds);

  const filtered = recipes.filter(recipe => {
    if (!recipe.Hozzarendelt_ID) return false;
    
    const recipeIds = recipe.Hozzarendelt_ID.split(',').map(id => id.trim());
    return assignedIds.some(id => recipeIds.includes(id));
  });

  console.log(`📊 ID szűrés eredménye: ${filtered.length}/${recipes.length} recept`);
  return filtered;
};