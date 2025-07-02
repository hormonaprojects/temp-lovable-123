
import { fetchReceptekV2, fetchReceptAlapanyagV2, fetchAlapanyagok } from './fetchers';
import { processIngredientsForRecipes } from './ingredientProcessor';
import { CombinedRecipe } from './types';

export const fetchCombinedRecipes = async (): Promise<CombinedRecipe[]> => {
  try {
    console.log('🔄 ÚJ adatbázis struktúra betöltése (csak receptek + recept_alapanyag + alapanyag + Étkezések)...');
    
    const [receptek, alapanyagokRaw, alapanyagokMaster, mealTypesData] = await Promise.all([
      fetchReceptekV2(),
      fetchReceptAlapanyagV2(),
      fetchAlapanyagok(),
      // Étkezések tábla egyszer lekérése
      import('@/integrations/supabase/client').then(({ supabase }) => 
        supabase.from('Étkezések').select('*').then(({ data }) => data || [])
      )
    ]);

    console.log('📊 Betöltött adatok:', {
      receptek: receptek.length,
      alapanyagokRaw: alapanyagokRaw.length,
      alapanyagokMaster: alapanyagokMaster.length,
      mealTypesData: mealTypesData.length
    });

    if (receptek.length === 0) {
      console.error('❌ KRITIKUS: Nincs egyetlen recept sem a receptek táblában!');
      return [];
    }

    const alapanyagokByReceptId = processIngredientsForRecipes(alapanyagokRaw, alapanyagokMaster);
    console.log('📊 processIngredientsForRecipes eredménye:', Object.keys(alapanyagokByReceptId).length, 'recept feldolgozva');
    
    // Debug: mutassuk meg néhány recept alapanyagait
    Object.entries(alapanyagokByReceptId).slice(0, 5).forEach(([receptId, ingredients]) => {
      console.log(`🍽️ Debug - Recept ${receptId} alapanyagai:`, ingredients);
    });
    const combinedRecipes: CombinedRecipe[] = [];
    
    console.log('🔄 Receptek feldolgozása meal type-okkal...');
    
    for (const recept of receptek) {
      const receptId = recept['Recept ID'];
      const receptName = recept['Receptnév'] || 'Névtelen recept';
      const hozzavalok = alapanyagokByReceptId[receptId] || [];
      
      console.log(`🔍 Recept ${receptId} (${receptName}) hozzávalói:`, hozzavalok);
      console.log(`📊 Alapanyagok alapján - receptId: ${receptId}, találat: ${hozzavalok.length} db hozzávaló`);
      
      if (hozzavalok.length === 0) {
        console.warn(`⚠️ NINCS HOZZÁVALÓ! Recept ${receptId} (${receptName}) - ellenőrizni kell az alapanyag táblában`);
      }
      
      // Meal types meghatározása az előre betöltött Étkezések tábla alapján
      const mealTypes = determineMealTypesForRecipeFromData(receptName, mealTypesData);
      
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
    }

    console.log('✅ Kombinált receptek létrehozva:', combinedRecipes.length);
    
    return combinedRecipes;
  } catch (error) {
    console.error('❌ Kombinált receptek betöltési hiba:', error);
    throw error;
  }
};

// Meal types meghatározása előre betöltött adatokból
function determineMealTypesForRecipeFromData(recipeName: string, mealTypesData: any[]): string[] {
  const normalizedRecipeName = recipeName.toLowerCase().trim();
  const mealTypes: string[] = [];

  const matchingRows = mealTypesData.filter(row => {
    const rowRecipeName = row['Recept Neve'];
    if (!rowRecipeName) return false;
    
    const normalizedRowName = rowRecipeName.toLowerCase().trim();
    return normalizedRowName === normalizedRecipeName || 
           normalizedRowName.includes(normalizedRecipeName) || 
           normalizedRecipeName.includes(normalizedRowName);
  });

  if (matchingRows.length > 0) {
    matchingRows.forEach(matchingRow => {
      const mealTypeColumns = ['Reggeli', 'Tízórai', 'Ebéd', 'Uzsonna', 'Vacsora', 'Leves', 'Előétel', 'Desszert', 'Köret'];
      
      mealTypeColumns.forEach(mealType => {
        const cellValue = matchingRow[mealType];
        
        if (cellValue && (
          cellValue.toString().toLowerCase().includes('x') || 
          cellValue === '1' || 
          cellValue === 1 ||
          cellValue === 'X' ||
          cellValue === 'x'
        )) {
          const normalizedMealType = mealType.toLowerCase();
          if (!mealTypes.includes(normalizedMealType)) {
            mealTypes.push(normalizedMealType);
          }
        }
      });
    });
  }

  return mealTypes;
}
