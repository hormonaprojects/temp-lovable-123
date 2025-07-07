import { supabase } from '@/integrations/supabase/client';
import { CombinedRecipe } from './database/types';
import { UserPreference } from './preferenceFilters';

// ÚJ INTERFÉSZEK
export interface NewIngredient {
  id: string;
  Elelmiszer_nev: string;
  Hozzarendelt_ID: string;
  Kategoria_ID: number;
  Kep?: string;
}

export interface IngredientCategory {
  Kategoria_ID: number;
  Kategoriak: string;
}

export interface UserIngredientPreference {
  ingredient: string;
  category: string;
  preference: 'like' | 'dislike' | 'neutral';
  favorite: boolean;
}

// CACHE az élelmiszer adatokhoz
let ingredientsCache: NewIngredient[] | null = null;
let categoriesCache: IngredientCategory[] | null = null;

// FŐBB FUNKCIÓK

/**
 * Betölti az összes élelmiszer adatot cache-szel
 */
export const fetchNewIngredients = async (): Promise<NewIngredient[]> => {
  if (ingredientsCache) {
    console.log('📋 Élelmiszer cache használat:', ingredientsCache.length, 'elem');
    return ingredientsCache;
  }

  try {
    console.log('🔄 Élelmiszer adatok betöltése...');
    const { data, error } = await supabase
      .from('elelmiszer_kep')
      .select('*')
      .order('Elelmiszer_nev', { ascending: true });

    if (error) {
      console.error('❌ Élelmiszer adatok betöltési hiba:', error);
      return [];
    }

    // Adattranszformáció
    ingredientsCache = (data || []).map(item => ({
      id: item.Elelmiszer_nev, // Használjuk a nevet ID-ként
      Elelmiszer_nev: item.Elelmiszer_nev,
      Hozzarendelt_ID: item.Hozzarendelt_ID || '',
      Kategoria_ID: item.Kategoria_ID || 0,
      Kep: item.Kep || ''
    }));

    console.log('✅ Élelmiszer adatok betöltve:', ingredientsCache.length, 'elem');
    return ingredientsCache;
  } catch (error) {
    console.error('❌ Élelmiszer adatok betöltési hiba:', error);
    return [];
  }
};

/**
 * Betölti az élelmiszer kategóriákat cache-szel
 */
export const fetchIngredientCategories = async (): Promise<IngredientCategory[]> => {
  if (categoriesCache) {
    console.log('📋 Kategória cache használat:', categoriesCache.length, 'elem');
    return categoriesCache;
  }

  try {
    console.log('🔄 Kategória adatok betöltése...');
    const { data, error } = await supabase
      .from('elelmiszer_kategoriak')
      .select('*')
      .order('Kategoriak', { ascending: true });

    if (error) {
      console.error('❌ Kategória adatok betöltési hiba:', error);
      return [];
    }

    categoriesCache = data || [];
    console.log('✅ Kategória adatok betöltve:', categoriesCache.length, 'elem');
    return categoriesCache;
  } catch (error) {
    console.error('❌ Kategória adatok betöltési hiba:', error);
    return [];
  }
};

/**
 * Megkeresi az élelmiszer adatot a Hozzarendelt_ID alapján
 */
export const findIngredientByAssignedId = async (assignedId: string): Promise<NewIngredient | null> => {
  const ingredients = await fetchNewIngredients();
  return ingredients.find(ingredient => ingredient.Hozzarendelt_ID === assignedId) || null;
};

/**
 * Megkeresi az élelmiszer adatot név alapján
 */
export const findIngredientByName = async (name: string): Promise<NewIngredient | null> => {
  const ingredients = await fetchNewIngredients();
  return ingredients.find(ingredient => 
    ingredient.Elelmiszer_nev.toLowerCase().trim() === name.toLowerCase().trim()
  ) || null;
};

/**
 * KRITIKUS SZŰRÉSI LOGIKA: Receptek szűrése élelmiszer nevek alapján
 * 1. Felhasználó kiválasztja: ["paradicsom", "hagyma"]
 * 2. elelmiszer_kep táblában keresés: "paradicsom" -> Hozzarendelt_ID: "123"
 * 3. Recepteknél: recipe.hozzarendeltId = "123,456,789"
 * 4. Találat: "123" benne van -> recept megjelenítése
 */
export const filterRecipesByNewIngredientNames = async (
  recipes: CombinedRecipe[],
  selectedIngredientNames: string[]
): Promise<CombinedRecipe[]> => {
  console.log('🔄 ÚJ szűrés indítása ingredient nevekkel...');
  console.log('📋 Kiválasztott ingrediensek:', selectedIngredientNames);
  console.log('📊 Receptek száma:', recipes.length);

  if (selectedIngredientNames.length === 0) {
    console.log('📝 Nincs kiválasztott ingredient, minden receptet visszaadunk');
    return recipes;
  }

  // 1. Betöltjük az élelmiszer adatokat
  const ingredients = await fetchNewIngredients();
  
  // 2. Megkeressük a kiválasztott ingrediensek Hozzarendelt_ID-jait
  const selectedIds: string[] = [];
  
  for (const ingredientName of selectedIngredientNames) {
    const ingredient = ingredients.find(ing => 
      ing.Elelmiszer_nev.toLowerCase().trim() === ingredientName.toLowerCase().trim()
    );
    
    if (ingredient && ingredient.Hozzarendelt_ID) {
      selectedIds.push(ingredient.Hozzarendelt_ID);
      console.log(`🔍 "${ingredientName}" -> ID: ${ingredient.Hozzarendelt_ID}`);
    } else {
      console.warn(`⚠️ Nem található ingredient: "${ingredientName}"`);
    }
  }

  console.log('🆔 Kiválasztott ID-k:', selectedIds);

  if (selectedIds.length === 0) {
    console.log('⚠️ Nincs érvényes ID, minden receptet visszaadunk');
    return recipes;
  }

  // 3. Szűrjük a recepteket
  const filteredRecipes = recipes.filter(recipe => {
    if (!recipe.hozzarendeltId) {
      return false;
    }
    
    // Vesszővel elválasztott ID-k szétbontása
    const recipeIds = recipe.hozzarendeltId.split(',').map(id => id.trim()).filter(id => id);
    
    // Ellenőrizzük, hogy legalább egy kiválasztott ID benne van-e
    const hasMatch = selectedIds.some(selectedId => recipeIds.includes(selectedId));
    
    if (hasMatch) {
      console.log(`✅ Recept "${recipe.név}" MATCH - IDs: [${recipeIds.join(', ')}]`);
    }
    
    return hasMatch;
  });

  console.log('✅ Szűrt receptek száma:', filteredRecipes.length);
  return filteredRecipes;
};

/**
 * Receptek szűrése NewIngredient objektumok alapján
 */
export const filterRecipesByNewIngredients = async (
  recipes: CombinedRecipe[],
  selectedIngredients: NewIngredient[]
): Promise<CombinedRecipe[]> => {
  console.log('🔄 ÚJ szűrés indítása ingredient objektumokkal...');
  
  const ingredientNames = selectedIngredients.map(ing => ing.Elelmiszer_nev);
  return await filterRecipesByNewIngredientNames(recipes, ingredientNames);
};

/**
 * Régi preferenciák átalakítása az új rendszerre
 */
export const convertToNewUserPreferences = async (
  oldPreferences: UserPreference[]
): Promise<UserIngredientPreference[]> => {
  console.log('🔄 Régi preferenciák átalakítása...');
  console.log('📋 Régi preferenciák száma:', oldPreferences.length);

  const ingredients = await fetchNewIngredients();
  const converted: UserIngredientPreference[] = [];

  for (const oldPref of oldPreferences) {
    // Megkeressük az új rendszerben
    const ingredient = ingredients.find(ing => 
      ing.Elelmiszer_nev.toLowerCase().trim() === oldPref.ingredient.toLowerCase().trim()
    );

    if (ingredient) {
      converted.push({
        ingredient: ingredient.Elelmiszer_nev,
        category: oldPref.category,
        preference: oldPref.preference,
        favorite: false // Alapértelmezett
      });
    } else {
      console.warn(`⚠️ Nem található új ingredient: "${oldPref.ingredient}"`);
    }
  }

  console.log('✅ Átalakított preferenciák száma:', converted.length);
  return converted;
};

/**
 * WRAPPER funkció: Receptek szűrése preferenciák alapján
 * Ez a main entry point az új szűrési logikához
 */
export const filterRecipesByPreferencesAdapter = async (
  recipes: CombinedRecipe[],
  userPreferences: UserPreference[]
): Promise<CombinedRecipe[]> => {
  console.log('🎯 ADAPTER: Preferencia alapú szűrés kezdődik...');
  console.log('📊 Input receptek:', recipes.length);
  console.log('📋 User preferenciák:', userPreferences.length);

  // Szűrjük a "like" preferenciákat
  const likedIngredients = userPreferences
    .filter(pref => pref.preference === 'like')
    .map(pref => pref.ingredient);

  console.log('💚 Kedvelt ingrediensek:', likedIngredients);

  if (likedIngredients.length === 0) {
    console.log('📝 Nincs kedvelt ingredient, minden receptet visszaadunk');
    return recipes;
  }

  // ÚJ ID-alapú szűrés használata
  const filteredRecipes = await filterRecipesByNewIngredientNames(recipes, likedIngredients);
  
  console.log('✅ ADAPTER eredmény:', filteredRecipes.length, 'recept');
  return filteredRecipes;
};

/**
 * Cache tisztítása (fejlesztéshez/teszteléshez)
 */
export const clearCache = () => {
  console.log('🧹 Cache tisztítása...');
  ingredientsCache = null;
  categoriesCache = null;
};