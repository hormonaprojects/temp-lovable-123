
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

  // JAVÍTOTT alapanyag egyezés ellenőrzés - csak akkor fogadja el, ha VALÓBAN tartalmazza
  const hasExactIngredientMatch = (recipeIngredients: string[], searchIngredient: string): boolean => {
    const searchNormalized = normalizeText(searchIngredient);
    console.log(`🔍 Keresett alapanyag (normalizált): "${searchNormalized}"`);
    
    return recipeIngredients.some(recipeIng => {
      const recipeIngNormalized = normalizeText(recipeIng);
      
      // CSAK akkor fogadja el, ha a recept hozzávalója tartalmazza a keresett alapanyagot
      // VAGY ha pontosan egyezik
      const exactMatch = recipeIngNormalized === searchNormalized;
      const containsIngredient = recipeIngNormalized.includes(searchNormalized);
      
      if (exactMatch || containsIngredient) {
        console.log(`✅ TALÁLAT! Recept hozzávaló: "${recipeIng}" tartalmazza "${searchIngredient}"-t`);
        return true;
      } else {
        console.log(`❌ Nincs egyezés: "${recipeIng}" nem tartalmazza "${searchIngredient}"-t`);
        return false;
      }
    });
  };

  // Ha konkrét alapanyag van megadva, KÖTELEZŐ hogy szerepeljen a receptben
  if (ingredient) {
    console.log(`🎯 KÖTELEZŐ alapanyag szűrés: "${ingredient}"`);
    console.log(`📊 Szűrés előtt: ${mealTypeFilteredRecipes.length} recept`);
    
    const ingredientFilteredRecipes = mealTypeFilteredRecipes.filter(recipe => {
      const allIngredients = getAllRecipeIngredients(recipe);
      console.log(`\n🔍 Recept vizsgálata: ${recipe['Recept_Neve']}`);
      console.log(`📝 Hozzávalók:`, allIngredients);
      
      const hasIngredient = hasExactIngredientMatch(allIngredients, ingredient);
      
      if (hasIngredient) {
        console.log(`✅ ✅ ✅ ELFOGADVA: "${recipe['Recept_Neve']}" TARTALMAZZA "${ingredient}" alapanyagot!`);
      } else {
        console.log(`❌ ❌ ❌ ELUTASÍTVA: "${recipe['Recept_Neve']}" NEM tartalmazza "${ingredient}" alapanyagot!`);
      }

      return hasIngredient;
    });

    console.log(`\n🎯 VÉGEREDMÉNY: ${ingredientFilteredRecipes.length}/${mealTypeFilteredRecipes.length} recept maradt "${ingredient}" alapanyaggal`);
    
    if (ingredientFilteredRecipes.length === 0) {
      console.log(`❌ NINCS EGYETLEN RECEPT SEM "${ingredient}" alapanyaggal a "${mealType}" étkezéshez!`);
      console.log(`📋 Ellenőrizd, hogy a "${ingredient}" alapanyag valóban szerepel-e a receptekben!`);
      return [];
    }

    // Kiírjuk a talált receptek neveit
    console.log(`✅ Talált receptek "${ingredient}" alapanyaggal:`, ingredientFilteredRecipes.map(r => r['Recept_Neve']));

    // Ha vannak preferenciák, prioritizáljuk a recepteket
    if (userPreferences && userPreferences.length > 0) {
      console.log('🎯 Preferenciák alapján prioritizáljuk a recepteket');
      return prioritizeRecipesByPreferences(ingredientFilteredRecipes, userPreferences);
    }
    
    return ingredientFilteredRecipes;
  }

  // Ha nincs konkrét alapanyag megadva, csak kategória alapján szűrünk
  if (category) {
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

    console.log(`✅ Kategória szűrés eredménye (${category}, ${mealType}):`, categoryFilteredRecipes.length, 'db');
    
    // Ha vannak preferenciák, prioritizáljuk a recepteket
    if (userPreferences && userPreferences.length > 0) {
      console.log('🎯 Preferenciák alapján prioritizáljuk a recepteket');
      return prioritizeRecipesByPreferences(categoryFilteredRecipes, userPreferences);
    }
    
    return categoryFilteredRecipes;
  }

  // Ha sem kategória, sem alapanyag nincs megadva, csak étkezési típus alapján
  console.log(`✅ Csak étkezési típus alapján: ${mealTypeFilteredRecipes.length} recept`);
  
  // Ha vannak preferenciák, prioritizáljuk a recepteket
  if (userPreferences && userPreferences.length > 0) {
    console.log('🎯 Preferenciák alapján prioritizáljuk a recepteket');
    return prioritizeRecipesByPreferences(mealTypeFilteredRecipes, userPreferences);
  }
  
  return mealTypeFilteredRecipes;
};
