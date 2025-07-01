
import { supabase } from '@/integrations/supabase/client';
import { ReceptekV2, ReceptAlapanyagV2, CombinedRecipe } from '@/types/newDatabase';

export const fetchReceptekV2 = async (): Promise<ReceptekV2[]> => {
  console.log('🔄 ReceptekV2 lekérése...');
  const { data, error } = await supabase
    .from('receptekv2')
    .select('*');

  if (error) {
    console.error('❌ ReceptekV2 betöltési hiba:', error);
    throw error;
  }

  console.log('✅ ReceptekV2 betöltve:', data?.length || 0, 'db');
  return data || [];
};

export const fetchReceptAlapanyagV2 = async (): Promise<ReceptAlapanyagV2[]> => {
  console.log('🔄 Recept alapanyag lekérése...');
  const { data, error } = await supabase
    .from('recept_alapanyagv2')
    .select('*');

  if (error) {
    console.error('❌ Recept alapanyag betöltési hiba:', error);
    throw error;
  }

  console.log('✅ Recept alapanyag betöltve:', data?.length || 0, 'db');
  return data || [];
};

// Szöveg normalizálási függvény a jobb egyezéshez
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[áàâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ő]/g, 'o')
    .replace(/[ű]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
};

// Meal types meghatározása az Étkezések tábla alapján - JAVÍTOTT VERZIÓ
const determineMealTypesForRecipe = async (recipeName: string): Promise<string[]> => {
  console.log('🔍 Meal types meghatározása recepthez:', recipeName);
  
  const { data: mealTypesData, error } = await supabase
    .from('Étkezések')
    .select('*');

  if (error) {
    console.error('❌ Étkezések tábla lekérési hiba:', error);
    return [];
  }

  const normalizedRecipeName = normalizeText(recipeName);
  const mealTypes: string[] = [];

  // Keressük meg a recept nevét az Étkezések táblában - JAVÍTOTT LOGIKA
  const matchingRow = mealTypesData?.find(row => {
    const rowRecipeName = row['Recept Neve'];
    if (!rowRecipeName) return false;
    
    const normalizedRowName = normalizeText(rowRecipeName);
    
    // Pontosabb egyezés ellenőrzése
    const exactMatch = normalizedRowName === normalizedRecipeName;
    const containsMatch = normalizedRowName.includes(normalizedRecipeName) || 
                         normalizedRecipeName.includes(normalizedRowName);
    
    // Szó-alapú egyezés - még pontosabb
    const recipeWords = normalizedRecipeName.split(' ').filter(word => word.length > 2);
    const nameWords = normalizedRowName.split(' ').filter(word => word.length > 2);
    
    const wordMatch = recipeWords.length > 0 && nameWords.length > 0 && 
      recipeWords.some(word => nameWords.some(nameWord => 
        word.includes(nameWord) || nameWord.includes(word) ||
        (word.length > 3 && nameWord.length > 3 && Math.abs(word.length - nameWord.length) <= 2)
      ));
    
    return exactMatch || containsMatch || wordMatch;
  });

  if (matchingRow) {
    console.log(`✅ Találat az Étkezések táblában: "${recipeName}" → "${matchingRow['Recept Neve']}"`);
    
    // Ellenőrizzük az összes étkezési típust
    const mealTypeColumns = ['Reggeli', 'Tízórai', 'Ebéd', 'Uzsonna', 'Vacsora', 'Leves', 'Előétel', 'Desszert', 'Köret'];
    
    mealTypeColumns.forEach(mealType => {
      const cellValue = matchingRow[mealType];
      if (cellValue && (
        cellValue.toLowerCase().includes('x') || 
        cellValue.toLowerCase().includes('igen') || 
        cellValue === '1' || 
        cellValue === 1 ||
        cellValue === 'X' ||
        cellValue === 'x'
      )) {
        const normalizedMealType = mealType.toLowerCase();
        mealTypes.push(normalizedMealType);
        console.log(`✅ "${recipeName}" hozzáadva "${normalizedMealType}" típushoz (érték: ${cellValue})`);
      }
    });
  } else {
    console.log(`⚠️ "${recipeName}" nem található az Étkezések táblában`);
  }

  return mealTypes;
};

export const fetchCombinedRecipes = async (): Promise<CombinedRecipe[]> => {
  try {
    console.log('🔄 ÚJ adatbázis struktúra betöltése (receptekv2 + recept_alapanyagv2 + Étkezések)...');
    
    const [receptek, alapanyagok] = await Promise.all([
      fetchReceptekV2(),
      fetchReceptAlapanyagV2()
    ]);

    console.log('📊 Betöltött adatok:', {
      receptek: receptek.length,
      alapanyagok: alapanyagok.length
    });

    if (receptek.length === 0) {
      console.warn('⚠️ ReceptekV2 tábla üres!');
      return [];
    }

    // Csoportosítjuk az alapanyagokat recept ID szerint
    console.log('🔄 Alapanyagok csoportosítása RECEPT_ID szerint...');
    const alapanyagokByReceptId = alapanyagok.reduce((acc, alapanyag) => {
      const receptId = alapanyag['Recept_ID'];
      if (!receptId) {
        console.warn('⚠️ Alapanyag Recept_ID nélkül:', alapanyag);
        return acc;
      }
      
      if (!acc[receptId]) {
        acc[receptId] = [];
      }
      
      // Pontos alapanyag formázás
      const mennyiseg = alapanyag['Mennyiség'] || '';
      const mertekegyseg = alapanyag['Mértékegység'] || '';
      const elelmiszer = alapanyag['Élelmiszerek'] || '';
      
      // Építsük fel a formázott alapanyag stringet
      let formattedIngredient = '';
      if (mennyiseg) {
        formattedIngredient += mennyiseg;
      }
      if (mertekegyseg) {
        formattedIngredient += (formattedIngredient ? ' ' : '') + mertekegyseg;
      }
      if (elelmiszer) {
        formattedIngredient += (formattedIngredient ? ' ' : '') + elelmiszer;
      }
      
      if (formattedIngredient.trim()) {
        acc[receptId].push(formattedIngredient.trim());
      }
      
      return acc;
    }, {} as Record<number, string[]>);

    console.log('📊 Alapanyagok csoportosítva:', Object.keys(alapanyagokByReceptId).length, 'recept ID-hoz');

    // Kombináljuk a recepteket az alapanyagokkal és meal type-okkal
    const combinedRecipes: CombinedRecipe[] = [];
    
    for (const recept of receptek) {
      const receptId = recept['Recept ID'];
      const receptName = recept['Receptnév'] || 'Névtelen recept';
      const hozzavalok = alapanyagokByReceptId[receptId] || [];
      
      // Meal types meghatározása az Étkezések tábla alapján RECEPTNÉV szerint
      const mealTypes = await determineMealTypesForRecipe(receptName);
      
      if (hozzavalok.length === 0) {
        console.warn(`⚠️ Nincs alapanyag a ${receptId} ID-jú recepthez: ${receptName}`);
      } else {
        console.log(`✅ ${receptId} ID-jú recepthez (${receptName}) ${hozzavalok.length} alapanyag hozzárendelve`);
      }
      
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

    console.log('✅ Kombinált receptek létrehozva ÚJ struktúrából:', combinedRecipes.length);
    console.log('📊 Receptek hozzávalókkal:', combinedRecipes.filter(r => r.hozzávalók.length > 0).length);
    console.log('📊 Receptek étkezési típussal:', combinedRecipes.filter(r => r.mealTypes.length > 0).length);
    
    // Részletes meal type statisztika
    const mealTypeStats = combinedRecipes.reduce((acc, recipe) => {
      recipe.mealTypes.forEach(mealType => {
        acc[mealType] = (acc[mealType] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📈 Meal type statisztikák (ÚJ struktúra):', mealTypeStats);
    
    return combinedRecipes;
  } catch (error) {
    console.error('❌ Kombinált receptek betöltési hiba (ÚJ struktúra):', error);
    throw error;
  }
};
