import { CombinedRecipe } from './database/types';
import { findIngredientByName } from './newIngredientQueries';
import { supabase } from '../integrations/supabase/client';

export const filterRecipesByPreferencesAdapter = async (
  recipes: CombinedRecipe[],
  selectedIngredientNames: string[],
  userId?: string
): Promise<CombinedRecipe[]> => {
  console.log('🔄 ÚJ preferencia adapter szűrés ID alapján');
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
      // A Hozzarendelt_ID lehet több ID is vesszővel elválasztva
      const ids = ingredient.Hozzarendelt_ID.split(',').map(id => id.trim());
      assignedIds.push(...ids);
      console.log(`✅ ${name} -> ID(k): ${ingredient.Hozzarendelt_ID}`);
    } else {
      console.warn(`❌ Nincs ID találat: ${name}`);
    }
  }

  console.log('🔗 Összegyűjtött ID-k:', assignedIds);

  if (assignedIds.length === 0) {
    console.warn('⚠️ Nincs egyetlen ID sem - üres eredmény');
    return [];
  }

  // Most a recept_alapanyag táblából keressük meg, mely receptek tartalmazzák ezeket az ID-kat
  try {
    const recipeIngredients: any[] = [];
    
    // Lekérjük az összes recept_alapanyag bejegyzést és szűrjük őket
    const response = await supabase
      .from('recept_alapanyag')
      .select('Recept_ID, "Élelmiszer ID"');

    if (response.error) {
      console.error('❌ Hiba a recept_alapanyag lekérdezésekor:', response.error);
      return [];
    }

    if (response.data) {
      // Szűrjük azokat, amelyek tartalmazzák valamelyik assignedId-t
      for (const row of response.data) {
        const elelmiszerId = (row as any)['Élelmiszer ID'];
        if (elelmiszerId && assignedIds.includes(elelmiszerId.toString())) {
          recipeIngredients.push(row);
        }
      }
    }

    console.log('🔍 Találat a recept_alapanyag táblában:', recipeIngredients.length, 'db');

    if (recipeIngredients.length === 0) {
      console.warn('⚠️ Nincs találat a recept_alapanyag táblában');
      return [];
    }

    // Egyedi Recept_ID-k összegyűjtése  
    const matchingRecipeIds = [...new Set(recipeIngredients.map(ri => ri.Recept_ID))];
    console.log('🎯 Matching Recept_ID-k:', matchingRecipeIds);

    // Receptek szűrése a matching Recept_ID-k alapján
    const filtered = recipes.filter(recipe => {
      return matchingRecipeIds.includes(recipe.id);
    });

    console.log(`📊 Szűrés eredménye: ${filtered.length}/${recipes.length} recept`);
    
    if (filtered.length > 0) {
      console.log('🍽️ Szűrt receptek:', filtered.map(r => r.név));
    }

    return filtered;

  } catch (error) {
    console.error('❌ Hiba az ID alapú szűrés során:', error);
    return [];
  }
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