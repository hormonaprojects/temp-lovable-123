
import { SupabaseRecipe } from '@/types/supabase';
import { normalizeText } from '@/utils/textNormalization';
import { UserPreference, prioritizeRecipesByPreferences } from './preferenceFilters';

export const getRecipesByMealType = (
  recipes: SupabaseRecipe[], 
  mealTypeRecipes: Record<string, string[]>, 
  mealType: string,
  userPreferences?: UserPreference[]
): SupabaseRecipe[] => {
  console.log(`🔍 getRecipesByMealType hívva: ${mealType}`);
  
  // JAVÍTOTT mapping - pontosan az adatbázis oszlopneveket használjuk
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
  
  // Ha vannak preferenciák, prioritizáljuk a recepteket
  if (userPreferences && userPreferences.length > 0) {
    console.log('🎯 Preferenciák alapján prioritizáljuk a recepteket');
    return prioritizeRecipesByPreferences(foundRecipes, userPreferences);
  }
  
  return foundRecipes;
};

export const getRecipesByCategory = (
  recipes: SupabaseRecipe[],
  mealTypeRecipes: Record<string, string[]>,
  categories: Record<string, string[]>,
  category: string,
  ingredient?: string,
  mealType?: string,
  userPreferences?: UserPreference[]
): SupabaseRecipe[] => {
  console.log(`🔍 SZIGORÚ szűrés - Kategória: ${category}, Alapanyag: ${ingredient}, Étkezési típus: ${mealType}`);
  
  if (!mealType) {
    console.log('❌ Nincs étkezési típus megadva');
    return [];
  }

  // JAVÍTOTT mapping - pontosan az adatbázis oszlopneveket használjuk
  const mealTypeMapping: Record<string, string> = {
    'reggeli': 'Reggeli',
    'tízórai': 'Tízórai',
    'ebéd': 'Ebéd',
    'leves': 'Leves',
    'uzsonna': 'Uzsonna',
    'vacsora': 'Vacsora'
  };

  const mealTypeKey = mealTypeMapping[mealType.toLowerCase()] || mealType;

  // 1. LÉPÉS: Étkezési típus alapján szűrés
  const allowedRecipeNames = mealTypeRecipes[mealTypeKey] || [];
  console.log(`📋 Engedélyezett receptek ${mealType}-hoz (${mealTypeKey}):`, allowedRecipeNames);

  if (allowedRecipeNames.length === 0) {
    console.log('❌ Nincs recept ehhez az étkezési típushoz');
    return [];
  }

  // 2. LÉPÉS: Receptek szűrése étkezési típus alapján
  const mealTypeFilteredRecipes = recipes.filter(recipe => {
    if (!recipe['Recept_Neve']) return false;
    
    return allowedRecipeNames.some(allowedName => {
      const recipeName = normalizeText(recipe['Recept_Neve']);
      const allowedNameNormalized = normalizeText(allowedName);
      
      return recipeName === allowedNameNormalized ||
             recipeName.includes(allowedNameNormalized) ||
             allowedNameNormalized.includes(recipeName);
    });
  });

  console.log(`📋 Étkezési típus alapján szűrt receptek:`, mealTypeFilteredRecipes.length);

  // MEGERŐSÍTETT alapanyag ellenőrzés
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

  // MEGERŐSÍTETT alapanyag egyezés ellenőrzés
  const hasExactIngredientMatch = (recipeIngredients: string[], searchIngredient: string): boolean => {
    const searchNormalized = normalizeText(searchIngredient);
    
    return recipeIngredients.some(recipeIng => {
      const recipeIngNormalized = normalizeText(recipeIng);
      
      // Teljes egyezés vagy részleges egyezés mindkét irányban
      const exactMatch = recipeIngNormalized === searchNormalized;
      const partialMatch = recipeIngNormalized.includes(searchNormalized) || 
                          searchNormalized.includes(recipeIngNormalized);
      
      if (exactMatch || partialMatch) {
        console.log(`✅ Alapanyag egyezés: "${recipeIng}" tartalmazza "${searchIngredient}"-t`);
        return true;
      }
      return false;
    });
  };

  // Ha konkrét alapanyag nincs megadva, csak kategória alapján szűrünk
  if (!ingredient) {
    // 3. LÉPÉS: Kategória alapú szűrés
    const categoryIngredients = categories[category] || [];
    console.log(`🥕 Kategória alapanyagok (${category}):`, categoryIngredients);

    if (categoryIngredients.length === 0) {
      console.log('❌ Nincs alapanyag ehhez a kategóriához');
      return [];
    }

    const categoryFilteredRecipes = mealTypeFilteredRecipes.filter(recipe => {
      const allIngredients = getAllRecipeIngredients(recipe);
      
      const hasCategory = categoryIngredients.some(categoryIngredient =>
        hasExactIngredientMatch(allIngredients, categoryIngredient)
      );

      return hasCategory;
    });

    console.log(`✅ Végeredmény (kategória ${category}, ${mealType}):`, categoryFilteredRecipes.length, 'db');
    
    // Ha vannak preferenciák, prioritizáljuk a recepteket
    if (userPreferences && userPreferences.length > 0) {
      console.log('🎯 Preferenciák alapján prioritizáljuk a recepteket');
      return prioritizeRecipesByPreferences(categoryFilteredRecipes, userPreferences);
    }
    
    return categoryFilteredRecipes;
  }

  // 4. LÉPÉS: MEGERŐSÍTETT specifikus alapanyag szűrés
  const finalFilteredRecipes = mealTypeFilteredRecipes.filter(recipe => {
    const allIngredients = getAllRecipeIngredients(recipe);
    const hasSpecificIngredient = hasExactIngredientMatch(allIngredients, ingredient);
    
    if (hasSpecificIngredient) {
      console.log(`✅ Recept TARTALMAZZA "${ingredient}" alapanyagot: ${recipe['Recept_Neve']}`);
    } else {
      console.log(`❌ Recept NEM tartalmazza "${ingredient}" alapanyagot: ${recipe['Recept_Neve']}`);
    }

    return hasSpecificIngredient;
  });

  console.log(`✅ MEGERŐSÍTETT szűrés végeredménye (${ingredient} alapanyag, ${mealType}):`, finalFilteredRecipes.length, 'db');
  
  // Ha vannak preferenciák, prioritizáljuk a recepteket
  if (userPreferences && userPreferences.length > 0) {
    console.log('🎯 Preferenciák alapján prioritizáljuk a recepteket');
    return prioritizeRecipesByPreferences(finalFilteredRecipes, userPreferences);
  }
  
  return finalFilteredRecipes;
};
