
import { fetchReceptekV2, fetchReceptAlapanyagV2, fetchAlapanyagok } from './fetchers';
import { processIngredientsForRecipes } from './ingredientProcessor';
import { CombinedRecipe } from './types';
import { supabase } from '@/integrations/supabase/client';

// Extract Élelmiszer IDs from recept_alapanyag table for each recipe
const extractElelmiszerIds = async (): Promise<Record<number, string[]>> => {
  console.log('🔄 Élelmiszer ID-k kinyerése recept_alapanyag táblából...');
  
  const { data, error } = await supabase
    .from('recept_alapanyag')
    .select('"Recept_ID", "Élelmiszer ID"');
    
  if (error) {
    console.error('❌ Hiba az Élelmiszer ID-k betöltésekor:', error);
    return {};
  }
  
  const idMap: Record<number, string[]> = {};
  
  data?.forEach(item => {
    const receptId = item.Recept_ID;
    const elelmiszerID = item['Élelmiszer ID'];
    
    if (receptId && elelmiszerID) {
      if (!idMap[receptId]) {
        idMap[receptId] = [];
      }
      idMap[receptId].push(elelmiszerID.toString());
    }
  });
  
  console.log('📊 Élelmiszer ID-k feldolgozva:', Object.keys(idMap).length, 'recept');
  
  // Debug: mutassuk meg néhány recept ID-it
  Object.entries(idMap).slice(0, 5).forEach(([receptId, ids]) => {
    console.log(`🔗 Recept ${receptId} Élelmiszer ID-k:`, ids);
  });
  
  return idMap;
};

export const fetchCombinedRecipes = async (): Promise<CombinedRecipe[]> => {
  try {
    console.log('🔄 ÚJ adatbázis struktúra betöltése (csak receptek + recept_alapanyag + alapanyag + Étkezések)...');
    
    const [receptek, alapanyagokRaw, alapanyagokMaster, mealTypesData, elelmiszerIds] = await Promise.all([
      fetchReceptekV2(),
      fetchReceptAlapanyagV2(),
      fetchAlapanyagok(),
      // Étkezések tábla egyszer lekérése
      import('@/integrations/supabase/client').then(({ supabase }) => 
        supabase.from('Étkezések').select('*').then(({ data }) => data || [])
      ),
      // Élelmiszer ID-k betöltése
      extractElelmiszerIds()
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

    // KRITIKUS DEBUG: Nézzük meg hogy van-e alapanyag egyáltalán
    console.log('🔥 KRITIKUS DEBUG - alapanyagokByReceptId teljes objektum:', alapanyagokByReceptId);
    console.log('🔥 Recept ID-k amikhez van alapanyag:', Object.keys(alapanyagokByReceptId).filter(id => alapanyagokByReceptId[parseInt(id)]?.length > 0));
    console.log('🔥 Recept ID-k amikhez NINCS alapanyag:', Object.keys(alapanyagokByReceptId).filter(id => !alapanyagokByReceptId[parseInt(id)] || alapanyagokByReceptId[parseInt(id)].length === 0));
    const combinedRecipes: CombinedRecipe[] = [];
    
    console.log('🔄 Receptek feldolgozása meal type-okkal...');
    
    // KRITIKUS DEBUG: Ellenőrizzük az első 10 recept ID-ját
    console.log('🔍 KRITIKUS DEBUG - Betöltött receptek első 10 ID-ja:');
    receptek.slice(0, 10).forEach((recept, index) => {
      console.log(`  ${index + 1}. Recept ID: ${recept['Recept ID']}, Név: ${recept['Receptnév']}`);
    });
    
    for (const recept of receptek) {
      const receptId = recept['Recept ID'];
      const receptName = recept['Receptnév'] || 'Névtelen recept';
      const hozzavalok = alapanyagokByReceptId[receptId] || [];
      
      console.log(`🔍 Recept ${receptId} (${receptName}) hozzávalói:`, hozzavalok);
      console.log(`📊 Alapanyagok alapján - receptId: ${receptId}, találat: ${hozzavalok.length} db hozzávaló`);
      
      // KRITIKUS DEBUG: Nézzük meg hogy van-e egyáltalán kulcs az alapanyagok objektumban
      console.log(`🔥 Alapanyag kulcsok keresése - receptId: ${receptId} (típus: ${typeof receptId})`);
      console.log(`🔥 Van-e kulcs? ${alapanyagokByReceptId.hasOwnProperty(receptId)}`);
      
      // Debug: keressük meg a közeli kulcsokat
      const availableKeys = Object.keys(alapanyagokByReceptId).map(k => parseInt(k));
      const isAvailable = availableKeys.includes(receptId);
      console.log(`🔥 Elérhető kulcsok (első 10):`, availableKeys.slice(0, 10));
      console.log(`🔥 A ${receptId} szerepel az elérhető kulcsok között? ${isAvailable}`);
      
      if (hozzavalok.length === 0) {
        console.warn(`⚠️ NINCS HOZZÁVALÓ! Recept ${receptId} (${receptName})`);
        
        // Keressük meg a legközelebbi kulcsokat
        const closestKeys = availableKeys.filter(k => Math.abs(k - receptId) <= 5);
        console.log(`🔍 Közeli kulcsok (±5):`, closestKeys);
      } else {
        console.log(`✅ TALÁLT HOZZÁVALÓK! Recept ${receptId} (${receptName}):`, hozzavalok);
      }
      
      // Meal types meghatározása az előre betöltött Étkezések tábla alapján
      const mealTypes = determineMealTypesForRecipeFromData(receptName, mealTypesData);
      
      // Hozzarendelt_ID előállítása az Élelmiszer ID-kból
      const receptElelmiszerIds = elelmiszerIds[receptId] || [];
      const hozzarendeltId = receptElelmiszerIds.join(',');
      
      console.log(`🔗 Recept ${receptId} (${receptName}) - Hozzarendelt_ID: "${hozzarendeltId}"`);
      const fehérjeValue = recept['Feherje_g'] || 0;
      const szénhidrátValue = recept['Szenhidrat_g'] || 0;
      const zsírValue = recept['Zsir_g'] || 0;
      
      // Kalória számítása: 1g fehérje = 4 kcal, 1g szénhidrát = 4 kcal, 1g zsír = 9 kcal
      const kalóriaValue = Math.round((fehérjeValue * 4) + (szénhidrátValue * 4) + (zsírValue * 9));
      
      combinedRecipes.push({
        id: receptId,
        név: receptName,
        elkészítés: recept['Elkészítése'] || 'Nincs leírás',
        kép: recept['Kép'] || '',
        szénhidrát: szénhidrátValue,
        fehérje: fehérjeValue,
        zsír: zsírValue,
        kalória: kalóriaValue,
        hozzávalók: hozzavalok,
        mealTypes: mealTypes,
        Hozzarendelt_ID: hozzarendeltId
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
