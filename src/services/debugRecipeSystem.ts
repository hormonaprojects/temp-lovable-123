import { fetchCombinedRecipes } from './database/recipesCombiner';
import { 
  fetchNewIngredients, 
  fetchIngredientCategories,
  filterRecipesByNewIngredientNames,
  findIngredientByName,
  clearCache
} from './preferenceAdapter';

/**
 * TELJES RENDSZER DEBUG ELLENŐRZÉSE
 */
export const debugRecipeSystem = async () => {
  console.log('🐛 ========= RECIPE SYSTEM DEBUG START =========');
  
  try {
    // 1. Receptek ellenőrzése
    console.log('🔍 1. RECEPTEK ELLENŐRZÉSE...');
    const recipes = await fetchCombinedRecipes();
    console.log(`📊 Összes recept: ${recipes.length}`);
    
    // Első 5 recept hozzarendeltId ellenőrzése
    console.log('🔍 Első 5 recept hozzarendeltId ellenőrzése:');
    recipes.slice(0, 5).forEach((recipe, index) => {
      console.log(`  ${index + 1}. "${recipe.név}" - hozzarendeltId: "${recipe.hozzarendeltId}"`);
    });
    
    // Hány receptnek van hozzarendeltId-ja
    const recipesWithIds = recipes.filter(r => r.hozzarendeltId && r.hozzarendeltId.trim() !== '');
    console.log(`✅ Receptek hozzarendeltId-val: ${recipesWithIds.length} / ${recipes.length}`);
    
    // 2. Ingrediensek ellenőrzése
    console.log('\n🔍 2. INGREDIENSEK ELLENŐRZÉSE...');
    const ingredients = await fetchNewIngredients();
    console.log(`📊 Összes ingredient: ${ingredients.length}`);
    
    // Első 5 ingredient ellenőrzése
    console.log('🔍 Első 5 ingredient:');
    ingredients.slice(0, 5).forEach((ingredient, index) => {
      console.log(`  ${index + 1}. "${ingredient.Elelmiszer_nev}" - Hozzarendelt_ID: "${ingredient.Hozzarendelt_ID}"`);
    });
    
    // Hány ingrediensnek van Hozzarendelt_ID-ja
    const ingredientsWithIds = ingredients.filter(ing => ing.Hozzarendelt_ID && ing.Hozzarendelt_ID.trim() !== '');
    console.log(`✅ Ingrediensek Hozzarendelt_ID-val: ${ingredientsWithIds.length} / ${ingredients.length}`);
    
    // 3. Kategóriák ellenőrzése
    console.log('\n🔍 3. KATEGÓRIÁK ELLENŐRZÉSE...');
    const categories = await fetchIngredientCategories();
    console.log(`📊 Összes kategória: ${categories.length}`);
    categories.forEach((cat, index) => {
      const ingredientsInCategory = ingredients.filter(ing => ing.Kategoria_ID === cat.Kategoria_ID);
      console.log(`  ${index + 1}. "${cat.Kategoriak}" (ID: ${cat.Kategoria_ID}) - ${ingredientsInCategory.length} ingredient`);
    });
    
    console.log('🐛 ========= RECIPE SYSTEM DEBUG END =========');
    
    return {
      totalRecipes: recipes.length,
      recipesWithIds: recipesWithIds.length,
      totalIngredients: ingredients.length,
      ingredientsWithIds: ingredientsWithIds.length,
      totalCategories: categories.length
    };
    
  } catch (error) {
    console.error('❌ Debug hiba:', error);
    return null;
  }
};

/**
 * INGREDIENT SZŰRÉS TESZTELÉSE
 */
export const testIngredientFiltering = async (testIngredients: string[] = ['paradicsom', 'hagyma', 'sajt']) => {
  console.log('🧪 ========= INGREDIENT FILTERING TEST START =========');
  console.log(`🎯 Teszt ingrediensek: [${testIngredients.join(', ')}]`);
  
  try {
    // 1. Receptek betöltése
    const recipes = await fetchCombinedRecipes();
    console.log(`📊 Összes recept: ${recipes.length}`);
    
    // 2. Szűrés elvégzése
    console.log('🔄 Szűrés elkezdése...');
    const filteredRecipes = await filterRecipesByNewIngredientNames(recipes, testIngredients);
    console.log(`✅ Szűrt receptek: ${filteredRecipes.length}`);
    
    // 3. Eredmények megjelenítése
    if (filteredRecipes.length > 0) {
      console.log('🍽️ Talált receptek:');
      filteredRecipes.slice(0, 10).forEach((recipe, index) => {
        console.log(`  ${index + 1}. "${recipe.név}" - hozzarendeltId: "${recipe.hozzarendeltId}"`);
      });
    } else {
      console.log('⚠️ Nem találtunk recepteket a megadott ingrediensekkel');
    }
    
    console.log('🧪 ========= INGREDIENT FILTERING TEST END =========');
    
    return {
      totalRecipes: recipes.length,
      filteredRecipes: filteredRecipes.length,
      testIngredients,
      results: filteredRecipes.slice(0, 10).map(r => ({ név: r.név, hozzarendeltId: r.hozzarendeltId }))
    };
    
  } catch (error) {
    console.error('❌ Szűrés teszt hiba:', error);
    return null;
  }
};

/**
 * INGREDIENT NÉV PÁROSÍTÁS ELLENŐRZÉSE
 */
export const debugIngredientNameMatching = async (testNames: string[] = ['paradicsom', 'hagyma', 'sajt', 'tojás', 'liszt']) => {
  console.log('🔍 ========= INGREDIENT NAME MATCHING DEBUG START =========');
  console.log(`🎯 Teszt nevek: [${testNames.join(', ')}]`);
  
  try {
    const ingredients = await fetchNewIngredients();
    
    for (const testName of testNames) {
      console.log(`\n🔍 Keresés: "${testName}"`);
      
      // Pontos egyezés
      const exactMatch = await findIngredientByName(testName);
      if (exactMatch) {
        console.log(`  ✅ PONTOS TALÁLAT: "${exactMatch.Elelmiszer_nev}" -> ID: "${exactMatch.Hozzarendelt_ID}"`);
      } else {
        console.log(`  ❌ Nincs pontos találat`);
        
        // Részleges egyezések keresése
        const partialMatches = ingredients.filter(ing => 
          ing.Elelmiszer_nev.toLowerCase().includes(testName.toLowerCase()) ||
          testName.toLowerCase().includes(ing.Elelmiszer_nev.toLowerCase())
        );
        
        if (partialMatches.length > 0) {
          console.log(`  🔍 Részleges találatok (${partialMatches.length} db):`);
          partialMatches.slice(0, 5).forEach(match => {
            console.log(`    - "${match.Elelmiszer_nev}" -> ID: "${match.Hozzarendelt_ID}"`);
          });
        } else {
          console.log(`  ❌ Nincs részleges találat sem`);
        }
      }
    }
    
    console.log('🔍 ========= INGREDIENT NAME MATCHING DEBUG END =========');
    
  } catch (error) {
    console.error('❌ Név párosítás debug hiba:', error);
  }
};

/**
 * ID ÁTFEDÉSEK ELLENŐRZÉSE
 */
export const debugIdOverlaps = async () => {
  console.log('🔗 ========= ID OVERLAP DEBUG START =========');
  
  try {
    const [recipes, ingredients] = await Promise.all([
      fetchCombinedRecipes(),
      fetchNewIngredients()
    ]);
    
    // Összes recept ID gyűjtése
    const allRecipeIds = new Set<string>();
    recipes.forEach(recipe => {
      if (recipe.hozzarendeltId) {
        const ids = recipe.hozzarendeltId.split(',').map(id => id.trim()).filter(id => id);
        ids.forEach(id => allRecipeIds.add(id));
      }
    });
    
    // Összes ingredient ID gyűjtése
    const allIngredientIds = new Set<string>();
    ingredients.forEach(ing => {
      if (ing.Hozzarendelt_ID && ing.Hozzarendelt_ID.trim()) {
        allIngredientIds.add(ing.Hozzarendelt_ID.trim());
      }
    });
    
    console.log(`📊 Recept ID-k: ${allRecipeIds.size}`);
    console.log(`📊 Ingredient ID-k: ${allIngredientIds.size}`);
    
    // Átfedések keresése
    const overlapping = Array.from(allRecipeIds).filter(id => allIngredientIds.has(id));
    console.log(`🔗 Átfedő ID-k: ${overlapping.length}`);
    
    if (overlapping.length > 0) {
      console.log('✅ Első 10 átfedő ID:');
      overlapping.slice(0, 10).forEach(id => {
        const ingredient = ingredients.find(ing => ing.Hozzarendelt_ID === id);
        console.log(`  - ID: "${id}" -> "${ingredient?.Elelmiszer_nev || 'Unknown'}"`);
      });
    } else {
      console.log('⚠️ Nincs átfedés az ID-k között!');
    }
    
    console.log('🔗 ========= ID OVERLAP DEBUG END =========');
    
    return {
      recipeIds: allRecipeIds.size,
      ingredientIds: allIngredientIds.size,
      overlapping: overlapping.length
    };
    
  } catch (error) {
    console.error('❌ ID átfedés debug hiba:', error);
    return null;
  }
};

/**
 * CACHE TISZTÍTÁS ÉS ÚJRATÖLTÉS
 */
export const debugClearAndReload = async () => {
  console.log('🧹 Cache tisztítás és újratöltés...');
  clearCache();
  
  return await debugRecipeSystem();
};

/**
 * ÖSSZES DEBUG FUTTATÁSA
 */
export const runAllDebugTests = async () => {
  console.log('🚀 ========= FULL DEBUG SUITE START =========');
  
  const results = {
    system: await debugRecipeSystem(),
    filtering: await testIngredientFiltering(),
    nameMatching: await debugIngredientNameMatching(),
    idOverlaps: await debugIdOverlaps()
  };
  
  console.log('🚀 ========= FULL DEBUG SUITE END =========');
  console.log('📋 ÖSSZESÍTŐ:', results);
  
  return results;
};