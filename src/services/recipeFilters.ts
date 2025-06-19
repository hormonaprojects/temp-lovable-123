
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
    'tízórai': 'Tízórai',  // JAVÍTVA: pontos mapping
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
    'tízórai': 'Tízórai',  // JAVÍTVA: pontos mapping
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
      const allIngredients = [
        recipe['Hozzavalo_1'], recipe['Hozzavalo_2'], recipe['Hozzavalo_3'],
        recipe['Hozzavalo_4'], recipe['Hozzavalo_5'], recipe['Hozzavalo_6'],
        recipe['Hozzavalo_7'], recipe['Hozzavalo_8'], recipe['Hozzavalo_9'],
        recipe['Hozzavalo_10'], recipe['Hozzavalo_11'], recipe['Hozzavalo_12'],
        recipe['Hozzavalo_13'], recipe['Hozzavalo_14'], recipe['Hozzavalo_15'],
        recipe['Hozzavalo_16'], recipe['Hozzavalo_17'], recipe['Hozzavalo_18']
      ].filter(Boolean);

      const hasCategory = categoryIngredients.some(categoryIngredient =>
        allIngredients.some(ing => 
          ing && (
            normalizeText(ing).includes(normalizeText(categoryIngredient)) ||
            normalizeText(categoryIngredient).includes(normalizeText(ing))
          )
        )
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

  // 4. LÉPÉS: SZIGORÚ specifikus alapanyag szűrés
  const finalFilteredRecipes = mealTypeFilteredRecipes.filter(recipe => {
    const allIngredients = [
      recipe['Hozzavalo_1'], recipe['Hozzavalo_2'], recipe['Hozzavalo_3'],
      recipe['Hozzavalo_4'], recipe['Hozzavalo_5'], recipe['Hozzavalo_6'],
      recipe['Hozzavalo_7'], recipe['Hozzavalo_8'], recipe['Hozzavalo_9'],
      recipe['Hozzavalo_10'], recipe['Hozzavalo_11'], recipe['Hozzavalo_12'],
      recipe['Hozzavalo_13'], recipe['Hozzavalo_14'], recipe['Hozzavalo_15'],
      recipe['Hozzavalo_16'], recipe['Hozzavalo_17'], recipe['Hozzavalo_18']
    ].filter(Boolean);

    const hasSpecificIngredient = allIngredients.some(ing => {
      if (!ing) return false;
      
      const ingredientNormalized = normalizeText(ing);
      const searchIngredientNormalized = normalizeText(ingredient);
      
      return ingredientNormalized.includes(searchIngredientNormalized) || 
             searchIngredientNormalized.includes(ingredientNormalized);
    });

    return hasSpecificIngredient;
  });

  console.log(`✅ SZIGORÚ szűrés végeredménye (${ingredient} alapanyag, ${mealType}):`, finalFilteredRecipes.length, 'db');
  
  // Ha vannak preferenciák, prioritizáljuk a recepteket
  if (userPreferences && userPreferences.length > 0) {
    console.log('🎯 Preferenciák alapján prioritizáljuk a recepteket');
    return prioritizeRecipesByPreferences(finalFilteredRecipes, userPreferences);
  }
  
  return finalFilteredRecipes;
};
