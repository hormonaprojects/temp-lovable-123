
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

// Meal type mapping létrehozás az Étkezések tábla alapján
const createMealTypeMapping = async (): Promise<Record<string, string[]>> => {
  console.log('🔄 Étkezések tábla lekérése meal type mapping-hez...');
  
  const { data: mealTypesData, error } = await supabase
    .from('Étkezések')
    .select('*');

  if (error) {
    console.error('❌ Étkezések tábla lekérési hiba:', error);
    return {};
  }

  console.log('📊 Étkezések tábla adatai:', mealTypesData?.length || 0, 'sor');

  if (!mealTypesData || mealTypesData.length === 0) {
    console.warn('⚠️ Nincs adat az Étkezések táblában');
    return {};
  }

  const mealTypeMapping: Record<string, string[]> = {};
  
  mealTypesData.forEach(row => {
    const recipeName = row['Recept Neve'];
    if (recipeName && recipeName.trim() !== '') {
      // Minden étkezési típust ellenőrzünk
      const mealTypes = ['Reggeli', 'Tízórai', 'Ebéd', 'Uzsonna', 'Vacsora', 'Leves', 'Előétel', 'Desszert', 'Köret'];
      
      mealTypes.forEach(mealType => {
        const cellValue = row[mealType];
        if (cellValue && (cellValue.toLowerCase().includes('x') || cellValue.toLowerCase().includes('igen') || cellValue === '1')) {
          const normalizedMealType = mealType.toLowerCase()
            .replace('tízórai', 'tízórai'); // Keep consistent naming
          
          if (!mealTypeMapping[normalizedMealType]) {
            mealTypeMapping[normalizedMealType] = [];
          }
          mealTypeMapping[normalizedMealType].push(normalizeText(recipeName));
          console.log(`📋 "${recipeName}" hozzáadva "${normalizedMealType}" típushoz`);
        }
      });
    }
  });

  console.log('📋 Meal type mapping létrehozva:', Object.keys(mealTypeMapping).length, 'étkezési típus');
  Object.entries(mealTypeMapping).forEach(([mealType, recipes]) => {
    console.log(`  ${mealType}: ${recipes.length} recept`);
  });

  return mealTypeMapping;
};

// Recept meal type hozzárendelés a mapping alapján
const assignMealTypeToRecipe = (recipeName: string, mealTypeMapping: Record<string, string[]>): string | null => {
  const normalizedRecipeName = normalizeText(recipeName);
  
  for (const [mealType, recipeNames] of Object.entries(mealTypeMapping)) {
    const hasMatch = recipeNames.some(normalizedName => {
      // Pontosabb egyezés ellenőrzése
      const exactMatch = normalizedName === normalizedRecipeName;
      const containsMatch = normalizedName.includes(normalizedRecipeName) || normalizedRecipeName.includes(normalizedName);
      
      // Szó-alapú egyezés
      const recipeWords = normalizedRecipeName.split(' ').filter(word => word.length > 2);
      const nameWords = normalizedName.split(' ').filter(word => word.length > 2);
      
      const wordMatch = recipeWords.length > 0 && nameWords.length > 0 && 
        recipeWords.some(word => nameWords.some(nameWord => 
          word.includes(nameWord) || nameWord.includes(word)
        ));
      
      if (exactMatch || containsMatch || wordMatch) {
        console.log(`✅ "${recipeName}" → ${mealType} (egyezés: ${exactMatch ? 'pontos' : containsMatch ? 'tartalmaz' : 'szó-alapú'})`);
        return true;
      }
      
      return false;
    });
    
    if (hasMatch) {
      return mealType;
    }
  }

  console.log(`⚠️ "${recipeName}" nem található az Étkezések táblában`);
  return null;
};

export const fetchCombinedRecipes = async (): Promise<CombinedRecipe[]> => {
  try {
    console.log('🔄 Új adatbázis struktúra betöltése...');
    
    const [receptek, alapanyagok, mealTypeMapping] = await Promise.all([
      fetchReceptekV2(),
      fetchReceptAlapanyagV2(),
      createMealTypeMapping()
    ]);

    console.log('📊 Betöltött adatok:', {
      receptek: receptek.length,
      alapanyagok: alapanyagok.length,
      mealTypeMapping: Object.keys(mealTypeMapping).length
    });

    if (receptek.length === 0) {
      console.warn('⚠️ Új táblák üresek!');
      return [];
    }

    // Csoportosítjuk az alapanyagokat recept ID szerint
    console.log('🔄 Alapanyagok csoportosítása Recept_ID szerint...');
    const alapanyagokByReceptId = alapanyagok.reduce((acc, alapanyag) => {
      const receptId = alapanyag['Recept_ID'];
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
    const combinedRecipes: CombinedRecipe[] = receptek.map(recept => {
      const receptId = recept['Recept ID'];
      const receptName = recept['Receptnév'] || 'Névtelen recept';
      const hozzavalok = alapanyagokByReceptId[receptId] || [];
      
      // Meal type hozzárendelés az Étkezések tábla alapján
      const assignedMealType = assignMealTypeToRecipe(receptName, mealTypeMapping);
      
      if (hozzavalok.length === 0) {
        console.warn(`⚠️ Nincs alapanyag a ${receptId} ID-jú recepthez: ${receptName}`);
      } else {
        console.log(`✅ ${receptId} ID-jú recepthez ${hozzavalok.length} alapanyag hozzárendelve`);
      }
      
      return {
        id: receptId,
        név: receptName,
        elkészítés: recept['Elkészítése'] || 'Nincs leírás',
        kép: recept['Kép'] || '',
        szénhidrát: recept['Szenhidrat_g'] || 0,
        fehérje: recept['Feherje_g'] || 0,
        zsír: recept['Zsir_g'] || 0,
        hozzávalók: hozzavalok,
        mealType: assignedMealType || undefined
      };
    });

    console.log('✅ Kombinált receptek létrehozva:', combinedRecipes.length);
    console.log('📊 Receptek hozzávalókkal:', combinedRecipes.filter(r => r.hozzávalók.length > 0).length);
    console.log('📊 Receptek étkezési típussal:', combinedRecipes.filter(r => r.mealType).length);
    
    // Részletes meal type statisztika
    const mealTypeStats = combinedRecipes.reduce((acc, recipe) => {
      if (recipe.mealType) {
        acc[recipe.mealType] = (acc[recipe.mealType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📈 Meal type statisztikák:', mealTypeStats);
    
    return combinedRecipes;
  } catch (error) {
    console.error('❌ Kombinált receptek betöltési hiba:', error);
    throw error;
  }
};
