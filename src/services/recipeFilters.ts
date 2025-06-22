
import { SupabaseRecipe } from '@/types/supabase';
import { normalizeText } from '@/utils/textNormalization';
import { UserPreference, prioritizeRecipesByPreferences } from './preferenceFilters';

// Étkezési típus alapján receptek lekérése - egyszerű alapvető szűrés
export const getRecipesByMealType = (
  recipes: SupabaseRecipe[], 
  mealTypeRecipes: Record<string, string[]>, 
  mealType: string,
  userPreferences?: UserPreference[]
): SupabaseRecipe[] => {
  console.log(`🔍 getRecipesByMealType hívva: ${mealType}`);
  
  const mealTypeMapping: Record<string, string> = {
    'reggeli': 'Reggeli',
    'tízórai': 'Tízórai',
    'ebéd': 'Ebéd',
    'leves': 'Leves',
    'uzsonna': 'Uzsonna',
    'vacsora': 'Vacsora'
  };
  
  const mealTypeKey = mealTypeMapping[mealType.toLowerCase()] || mealType;
  const recipeNames = mealTypeRecipes[mealTypeKey] || [];
  
  console.log(`🔍 ${mealType} engedélyezett receptnevek (${mealTypeKey}):`, recipeNames);
  
  const foundRecipes = recipes.filter(recipe => 
    recipeNames.some(allowedName => {
      if (!recipe['Recept_Neve'] || !allowedName) return false;
      
      const recipeName = normalizeText(recipe['Recept_Neve']);
      const allowedNameNormalized = normalizeText(allowedName);
      
      return recipeName === allowedNameNormalized ||
             recipeName.includes(allowedNameNormalized) ||
             allowedNameNormalized.includes(recipeName);
    })
  );
  
  console.log(`🔍 ${mealType} talált receptek:`, foundRecipes.length, 'db');
  
  if (userPreferences && userPreferences.length > 0) {
    console.log('🎯 Preferenciák alapján prioritizáljuk a recepteket');
    return prioritizeRecipesByPreferences(foundRecipes, userPreferences);
  }
  
  return foundRecipes;
};

// Alapanyag szűrés - külön függvény az átláthatóságért
export const filterRecipesByIngredient = (
  recipes: SupabaseRecipe[],
  ingredient: string
): SupabaseRecipe[] => {
  console.log(`🎯 Alapanyag szűrés: "${ingredient}"`);
  
  const getAllRecipeIngredients = (recipe: SupabaseRecipe): string[] => {
    return [
      recipe['Hozzavalo_1'], recipe['Hozzavalo_2'], recipe['Hozzavalo_3'],
      recipe['Hozzavalo_4'], recipe['Hozzavalo_5'], recipe['Hozzavalo_6'],
      recipe['Hozzavalo_7'], recipe['Hozzavalo_8'], recipe['Hozzavalo_9'],
      recipe['Hozzavalo_10'], recipe['Hozzavalo_11'], recipe['Hozzavalo_12'],
      recipe['Hozzavalo_13'], recipe['Hozzavalo_14'], recipe['Hozzavalo_15'],
      recipe['Hozzavalo_16'], recipe['Hozzavalo_17'], recipe['Hozzavalo_18']
    ].filter(Boolean).map(ing => ing?.toString() || '');
  };

  const hasIngredientMatch = (recipeIngredients: string[], searchIngredient: string): boolean => {
    const searchNormalized = normalizeText(searchIngredient);
    
    return recipeIngredients.some(recipeIng => {
      const recipeIngNormalized = normalizeText(recipeIng);
      const exactMatch = recipeIngNormalized === searchNormalized;
      const containsIngredient = recipeIngNormalized.includes(searchNormalized);
      
      return exactMatch || containsIngredient;
    });
  };

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

// Kategória alapján szűrés
export const filterRecipesByCategory = (
  recipes: SupabaseRecipe[],
  categories: Record<string, string[]>,
  category: string
): SupabaseRecipe[] => {
  console.log(`🥕 Kategória szűrés: ${category}`);
  
  const categoryIngredients = categories[category] || [];
  console.log(`🥕 Kategória alapanyagok (${category}):`, categoryIngredients);

  if (categoryIngredients.length === 0) {
    console.log('❌ Nincs alapanyag ehhez a kategóriához');
    return [];
  }

  const categoryFilteredRecipes = recipes.filter(recipe => {
    return categoryIngredients.some(categoryIngredient => {
      const filtered = filterRecipesByIngredient([recipe], categoryIngredient);
      return filtered.length > 0;
    });
  });

  console.log(`✅ Kategória szűrés eredménye (${category}):`, categoryFilteredRecipes.length, 'db');
  return categoryFilteredRecipes;
};

// Komplex szűrés kategória + alapanyag + étkezési típus alapján
export const getRecipesByCategory = (
  recipes: SupabaseRecipe[],
  mealTypeRecipes: Record<string, string[]>,
  categories: Record<string, string[]>,
  category: string,
  ingredient?: string,
  mealType?: string,
  userPreferences?: UserPreference[]
): SupabaseRecipe[] => {
  console.log(`🔍 Komplex szűrés - Kategória: ${category}, Alapanyag: ${ingredient}, Étkezési típus: ${mealType}`);
  
  let filteredRecipes = recipes;

  // 1. LÉPÉS: Étkezési típus szűrés (ha van)
  if (mealType) {
    filteredRecipes = getRecipesByMealType(filteredRecipes, mealTypeRecipes, mealType, userPreferences);
    console.log(`📋 Étkezési típus után: ${filteredRecipes.length} recept`);
    
    if (filteredRecipes.length === 0) {
      console.log('❌ Nincs recept ehhez az étkezési típushoz');
      return [];
    }
  }

  // 2. LÉPÉS: Konkrét alapanyag szűrés (ha van)
  if (ingredient) {
    filteredRecipes = filterRecipesByIngredient(filteredRecipes, ingredient);
    console.log(`🎯 Alapanyag szűrés után: ${filteredRecipes.length} recept`);
    
    if (filteredRecipes.length === 0) {
      console.log(`❌ Nincs recept "${ingredient}" alapanyaggal`);
      return [];
    }
  }
  // 3. LÉPÉS: Kategória szűrés (ha nincs konkrét alapanyag)
  else if (category) {
    filteredRecipes = filterRecipesByCategory(filteredRecipes, categories, category);
    console.log(`🥕 Kategória szűrés után: ${filteredRecipes.length} recept`);
    
    if (filteredRecipes.length === 0) {
      console.log(`❌ Nincs recept "${category}" kategóriából`);
      return [];
    }
  }

  console.log(`✅ Végső eredmény: ${filteredRecipes.length} recept`);
  return filteredRecipes;
};
