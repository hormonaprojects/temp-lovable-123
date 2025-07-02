
import { supabase } from '@/integrations/supabase/client';
import { ReceptekV2, ReceptAlapanyagV2, CombinedRecipe } from '@/types/newDatabase';

// Alapanyag tábla típusa
interface Alapanyag {
  ID: number;
  Elelmiszer: string;
  'Fehérje/100g': string;
  'Szénhidrát/100g': string;
  'Zsir/100g': string;
  'Kaloria/100g': string;
}

export const fetchReceptekV2 = async (): Promise<ReceptekV2[]> => {
  console.log('🔄 Receptek lekérése az új receptek táblából...');
  
  const { data, error } = await supabase
    .from('receptek')
    .select('*');

  if (error) {
    console.error('❌ receptek tábla lekérési hiba:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.warn('⚠️ Nincs adat a receptek táblában!');
    return [];
  }

  console.log('✅ Receptek betöltve:', data.length, 'db');
  console.log('📋 Első recept példa:', data[0]);
  
  return data;
};

export const fetchReceptAlapanyagV2 = async (): Promise<ReceptAlapanyagV2[]> => {
  console.log('🔄 Recept alapanyag lekérése az új recept_alapanyag táblából...');
  
  const { data, error } = await supabase
    .from('recept_alapanyag')
    .select('*');

  if (error) {
    console.error('❌ recept_alapanyag tábla lekérési hiba:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.warn('⚠️ Nincs adat a recept_alapanyag táblában!');
    return [];
  }

  console.log('✅ Recept alapanyag betöltve:', data.length, 'db');
  console.log('📋 Első alapanyag példa:', data[0]);
  
  return data;
};

// Alapanyagok lekérése
export const fetchAlapanyagok = async (): Promise<Alapanyag[]> => {
  console.log('🔄 Alapanyagok lekérése...');
  
  const { data, error } = await supabase
    .from('alapanyag')
    .select('*');

  if (error) {
    console.error('❌ alapanyag tábla lekérési hiba:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.warn('⚠️ Nincs adat az alapanyag táblában!');
    return [];
  }

  console.log('✅ Alapanyagok betöltve:', data.length, 'db');
  console.log('📋 Első alapanyag példa:', data[0]);
  
  return data;
};

// Javított szöveg normalizálási függvény
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

// Meal types meghatározása az Étkezések tábla alapján RECEPTNÉV szerint
const determineMealTypesForRecipe = async (recipeName: string): Promise<string[]> => {
  console.log('🔍 Meal types meghatározása recepthez:', recipeName);
  
  const { data: mealTypesData, error } = await supabase
    .from('Étkezések')
    .select('*');

  if (error) {
    console.error('❌ Étkezések tábla lekérési hiba:', error);
    return [];
  }

  if (!mealTypesData || mealTypesData.length === 0) {
    console.warn('⚠️ Étkezések tábla üres!');
    return [];
  }

  console.log('📊 Étkezések tábla adatok:', mealTypesData.length, 'sor');

  const normalizedRecipeName = normalizeText(recipeName);
  const mealTypes: string[] = [];

  // Pontosabb név-egyeztetés több módon
  const matchingRows = mealTypesData.filter(row => {
    const rowRecipeName = row['Recept Neve'];
    if (!rowRecipeName) return false;
    
    const normalizedRowName = normalizeText(rowRecipeName);
    
    // Többféle egyezés lehetősége
    const exactMatch = normalizedRowName === normalizedRecipeName;
    const recipeContainsRow = normalizedRecipeName.includes(normalizedRowName) && normalizedRowName.length > 3;
    const rowContainsRecipe = normalizedRowName.includes(normalizedRecipeName) && normalizedRecipeName.length > 3;
    
    // Szóköz nélküli összehasonlítás is
    const recipeNoSpaces = normalizedRecipeName.replace(/\s/g, '');
    const rowNoSpaces = normalizedRowName.replace(/\s/g, '');
    const noSpaceMatch = recipeNoSpaces === rowNoSpaces;
    
    return exactMatch || recipeContainsRow || rowContainsRecipe || noSpaceMatch;
  });

  console.log(`🔍 "${recipeName}" egyezések az Étkezések táblában:`, matchingRows.length);

  if (matchingRows.length > 0) {
    // Több egyezés esetén az összeset feldolgozzuk
    matchingRows.forEach(matchingRow => {
      console.log(`✅ Találat: "${recipeName}" → "${matchingRow['Recept Neve']}"`);
      
      // Ellenőrizzük az összes étkezési típust
      const mealTypeColumns = ['Reggeli', 'Tízórai', 'Ebéd', 'Uzsonna', 'Vacsora', 'Leves', 'Előétel', 'Desszert', 'Köret'];
      
      mealTypeColumns.forEach(mealType => {
        const cellValue = matchingRow[mealType];
        
        // Jobban toleráns értékellenőrzés
        if (cellValue && (
          cellValue.toString().toLowerCase().includes('x') || 
          cellValue.toString().toLowerCase().includes('igen') || 
          cellValue.toString().toLowerCase().includes('yes') || 
          cellValue === '1' || 
          cellValue === 1 ||
          cellValue === 'X' ||
          cellValue === 'x' ||
          cellValue === true ||
          cellValue === 'true'
        )) {
          const normalizedMealType = mealType.toLowerCase();
          if (!mealTypes.includes(normalizedMealType)) {
            mealTypes.push(normalizedMealType);
            console.log(`✅ "${recipeName}" → "${normalizedMealType}" (érték: ${cellValue})`);
          }
        }
      });
    });
  } else {
    console.log(`⚠️ "${recipeName}" nem található az Étkezések táblában`);
    // Debug: Mutassuk meg az első 5 recept nevet az Étkezések táblából
    console.log('📋 Első 5 recept az Étkezések táblából:', 
      mealTypesData.slice(0, 5).map(row => `"${row['Recept Neve']}"`));
  }

  return mealTypes;
};

export const fetchCombinedRecipes = async (): Promise<CombinedRecipe[]> => {
  try {
    console.log('🔄 ÚJ adatbázis struktúra betöltése (receptek + recept_alapanyag + alapanyag + Étkezések)...');
    
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

    if (receptek.length === 0) {
      console.warn('⚠️ Receptek tábla üres!');
      return [];
    }

    if (alapanyagokRaw.length === 0) {
      console.warn('⚠️ Recept_alapanyag tábla üres!');
      return [];
    }

    if (alapanyagokMaster.length === 0) {
      console.warn('⚠️ Alapanyag tábla üres!');
      return [];
    }

    // Alapanyag lookup map készítése ID alapján
    const alapanyagMap = new Map<string, Alapanyag>();
    alapanyagokMaster.forEach(alapanyag => {
      alapanyagMap.set(alapanyag.ID.toString(), alapanyag);
    });

    console.log('📋 Alapanyag map mérete:', alapanyagMap.size);

    // Debug: Nézzük meg a receptek ID-jeit és alapanyag Recept_ID-ket
    console.log('📋 Recept ID-k (első 5):', receptek.slice(0, 5).map(r => r['Recept ID']));
    console.log('📋 Recept nevek (első 5):', receptek.slice(0, 5).map(r => r['Receptnév']));
    console.log('📋 Alapanyag Recept_ID-k (első 10):', [...new Set(alapanyagokRaw.slice(0, 10).map(a => a['Recept_ID']))]);

    // Csoportosítjuk az alapanyagokat recept ID szerint
    console.log('🔄 Alapanyagok csoportosítása Recept_ID szerint...');
    const alapanyagokByReceptId = alapanyagokRaw.reduce((acc, alapanyag) => {
      const receptId = alapanyag['Recept_ID'];
      if (!receptId) {
        console.warn('⚠️ Alapanyag Recept_ID nélkül:', alapanyag);
        return acc;
      }
      
      if (!acc[receptId]) {
        acc[receptId] = [];
      }
      
      // Alapanyag részletek lekérése az alapanyag táblából
      const elelmiszerID = alapanyag['Élelmiszer ID'];
      const elelmiszerNev = alapanyag['Élelmiszerek'];
      const mennyiseg = alapanyag['Mennyiség'] || '';
      const mertekegyseg = alapanyag['Mértékegység'] || '';
      
      // Ha van Élelmiszer ID, használjuk az alapanyag táblából az adatokat
      let finalElelmiszerNev = elelmiszerNev;
      if (elelmiszerID && alapanyagMap.has(elelmiszerID.toString())) {
        const masterAlapanyag = alapanyagMap.get(elelmiszerID.toString())!;
        finalElelmiszerNev = masterAlapanyag.Elelmiszer || elelmiszerNev;
        console.log(`🔗 Alapanyag összekapcsolva: ID ${elelmiszerID} → "${finalElelmiszerNev}"`);
      }
      
      // Építsük fel a formázott alapanyag stringet
      let formattedIngredient = '';
      if (mennyiseg) {
        formattedIngredient += mennyiseg;
      }
      if (mertekegyseg) {
        formattedIngredient += (formattedIngredient ? ' ' : '') + mertekegyseg;
      }
      if (finalElelmiszerNev) {
        formattedIngredient += (formattedIngredient ? ' ' : '') + finalElelmiszerNev;
      }
      
      if (formattedIngredient.trim()) {
        acc[receptId].push(formattedIngredient.trim());
      }
      
      return acc;
    }, {} as Record<number, string[]>);

    console.log('📊 Alapanyagok csoportosítva:', Object.keys(alapanyagokByReceptId).length, 'recept ID-hoz');
    
    // Mutassuk meg néhány példát
    Object.entries(alapanyagokByReceptId).slice(0, 3).forEach(([receptId, ingredients]) => {
      console.log(`📋 Recept ID ${receptId}: ${ingredients.length} alapanyag - ${ingredients.slice(0, 2).join(', ')}${ingredients.length > 2 ? '...' : ''}`);
    });

    // Kombináljuk a recepteket az alapanyagokkal és meal type-okkal
    const combinedRecipes: CombinedRecipe[] = [];
    
    console.log('🔄 Receptek feldolgozása meal type-okkal...');
    
    for (const recept of receptek) {
      const receptId = recept['Recept ID'];
      const receptName = recept['Receptnév'] || 'Névtelen recept';
      const hozzavalok = alapanyagokByReceptId[receptId] || [];
      
      console.log(`🔍 Recept feldolgozása: "${receptName}" (ID: ${receptId}) - ${hozzavalok.length} alapanyag`);
      
      // Meal types meghatározása az Étkezések tábla alapján RECEPTNÉV szerint
      const mealTypes = await determineMealTypesForRecipe(receptName);
      
      if (hozzavalok.length === 0) {
        console.warn(`⚠️ Nincs alapanyag a ${receptId} ID-jú recepthez: ${receptName}`);
      }
      
      // Minden receptet hozzáadunk, függetlenül attól, hogy van-e meal type-ja
      // Ha nincs meal type, akkor üres tömböt kap
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
    
    // Debug: Első néhány recept részletei
    console.log('📋 Első 3 recept részletei:');
    combinedRecipes.slice(0, 3).forEach(recipe => {
      console.log(`- ${recipe.név}: ${recipe.hozzávalók.length} alapanyag, ${recipe.mealTypes.length} meal type (${recipe.mealTypes.join(', ')})`);
      if (recipe.hozzávalók.length > 0) {
        console.log(`  Alapanyagok: ${recipe.hozzávalók.slice(0, 3).join(', ')}${recipe.hozzávalók.length > 3 ? '...' : ''}`);
      }
    });
    
    return combinedRecipes;
  } catch (error) {
    console.error('❌ Kombinált receptek betöltési hiba (ÚJ struktúra):', error);
    throw error;
  }
};
