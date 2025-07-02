
import { fetchReceptekV2, fetchReceptAlapanyagV2, fetchAlapanyagok } from './fetchers';
import { processIngredientsForRecipes } from './ingredientProcessor';
import { determineMealTypesForRecipe } from './mealTypeProcessor';
import { CombinedRecipe } from './types';

export const fetchCombinedRecipes = async (): Promise<CombinedRecipe[]> => {
  try {
    console.log('🔄 ÚJ adatbázis struktúra betöltése (csak receptek + recept_alapanyag + alapanyag + Étkezések)...');
    
    const [receptek, alapanyagokRaw, alapanyagokMaster] = await Promise.all([
      fetchReceptekV2(),
      fetchReceptAlapanyagV2(),
      fetchAlapanyagok()
    ]);

    console.log('📊 Betöltött adatok:', {
      receptek: receptek.length,
      alapanyagokRaw: alapanyagokRaw.length,
      alapanyagokMaster: alapanyagokMaster.length
    });

    // Ha nincs elég adat, ne folytassuk
    if (receptek.length === 0) {
      console.error('❌ KRITIKUS: Nincs egyetlen recept sem a receptek táblában!');
      return [];
    }

    const alapanyagokByReceptId = processIngredientsForRecipes(alapanyagokRaw, alapanyagokMaster);

    // Kombináljuk a recepteket az alapanyagokkal és meal type-okkal
    const combinedRecipes: CombinedRecipe[] = [];
    
    console.log('🔄 Receptek feldolgozása meal type-okkal...');
    
    for (const recept of receptek) {
      const receptId = recept['Recept ID'];
      const receptName = recept['Receptnév'] || 'Névtelen recept';
      const hozzavalok = alapanyagokByReceptId[receptId] || [];
      
      console.log(`🔍 Recept feldolgozása: "${receptName}" (ID: ${receptId})`);
      
      // Meal types meghatározása az Étkezések tábla alapján RECEPTNÉV szerint
      const mealTypes = await determineMealTypesForRecipe(receptName);
      
      // Minden receptet hozzáadunk
      combinedRecipes.push({
        id: receptId,
        név: receptName,
        elkészítés: recept['Elkészítése'] || 'Nincs leírás',
        kép: recept['Kép'] || '',
        szénhidrát: recept['Szenhidrat_g'] || 0,
        fehérje: recept['Feherje_g'] || 0,
        zsír: recept['Zsir_g'] || 0,
        hozzávalók: hozzavalok,
        mealTypes: mealTypes
      });
      
      if (mealTypes.length > 0) {
        console.log(`✅ Recept hozzáadva meal type-okkal: "${receptName}" - meal types: ${mealTypes.join(', ')}`);
      } else {
        console.log(`⚠️ Recept hozzáadva meal type nélkül: "${receptName}"`);
      }
    }

    console.log('✅ Kombinált receptek létrehozva:', combinedRecipes.length);
    console.log('📊 Receptek étkezési típussal:', combinedRecipes.filter(r => r.mealTypes.length > 0).length);
    
    // Meal type statisztika
    const mealTypeStats = combinedRecipes.reduce((acc, recipe) => {
      recipe.mealTypes.forEach(mealType => {
        acc[mealType] = (acc[mealType] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📈 Meal type statisztikák:', mealTypeStats);
    
    return combinedRecipes;
  } catch (error) {
    console.error('❌ Kombinált receptek betöltési hiba:', error);
    throw error;
  }
};
