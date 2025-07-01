
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

// JAVÍTOTT funkció: Étkezési típusok lekérése és receptekhez rendelése
export const assignMealTypesToRecipes = async (receptek: ReceptekV2[]): Promise<ReceptekV2[]> => {
  console.log('🔄 Étkezési típusok hozzárendelése receptekhez...');
  
  // Lekérjük az Étkezések tábla adatait
  const { data: mealTypesData, error } = await supabase
    .from('Étkezések')
    .select('*');

  if (error) {
    console.error('❌ Étkezések tábla lekérési hiba:', error);
    return receptek;
  }

  console.log('📊 Étkezések tábla adatai:', mealTypesData?.length || 0, 'sor');

  if (!mealTypesData || mealTypesData.length === 0) {
    console.warn('⚠️ Nincs adat az Étkezések táblában');
    return receptek;
  }

  // Minden étkezési típus sorához létrehozunk egy mapping objektumot
  const mealTypeMapping: Record<string, string[]> = {};
  
  mealTypesData.forEach(row => {
    const recipeName = row['Recept Neve'];
    if (recipeName && recipeName.trim() !== '') {
      // Minden étkezési típust ellenőrzünk
      const mealTypes = ['Reggeli', 'Tízórai', 'Tizórai', 'Ebéd', 'Uzsonna', 'Vacsora', 'Leves', 'Előétel', 'Desszert', 'Köret'];
      
      mealTypes.forEach(mealType => {
        const cellValue = row[mealType];
        if (cellValue && (cellValue.toLowerCase().includes('x') || cellValue.toLowerCase().includes('igen'))) {
          const normalizedMealType = mealType.toLowerCase()
            .replace('tizórai', 'tízórai')
            .replace('tízórai', 'tízórai');
          
          if (!mealTypeMapping[normalizedMealType]) {
            mealTypeMapping[normalizedMealType] = [];
          }
          mealTypeMapping[normalizedMealType].push(normalizeText(recipeName));
        }
      });
    }
  });

  console.log('📋 Meal type mapping létrehozva:', Object.keys(mealTypeMapping).length, 'étkezési típus');
  Object.entries(mealTypeMapping).forEach(([mealType, recipes]) => {
    console.log(`  ${mealType}: ${recipes.length} recept`);
  });

  // Frissítjük a recepteket a meal_type mezővel
  const updatedReceptek = receptek.map(recept => {
    const receptName = normalizeText(recept['Receptnév'] || '');
    let assignedMealType = '';

    // Keressük meg, hogy melyik étkezési típushoz tartozik ez a recept
    for (const [mealType, recipeNames] of Object.entries(mealTypeMapping)) {
      const hasMatch = recipeNames.some(normalizedName => {
        // Több típusú egyezés ellenőrzése
        return normalizedName === receptName || // Pontos egyezés
               normalizedName.includes(receptName) || // Tartalmazza
               receptName.includes(normalizedName) || // Fordított tartalmazás
               // Részleges szóegyezés
               normalizedName.split(' ').some(word => 
                 word.length > 3 && receptName.includes(word)
               ) ||
               receptName.split(' ').some(word => 
                 word.length > 3 && normalizedName.includes(word)
               );
      });
      
      if (hasMatch) {
        assignedMealType = mealType;
        console.log(`✅ "${recept['Receptnév']}" → ${assignedMealType}`);
        break;
      }
    }

    if (!assignedMealType) {
      console.log(`⚠️ "${recept['Receptnév']}" nem található az Étkezések táblában`);
    }

    return {
      ...recept,
      meal_type: assignedMealType || null
    };
  });

  const assignedCount = updatedReceptek.filter(r => r.meal_type).length;
  console.log(`📊 Összesen ${assignedCount}/${updatedReceptek.length} recepthez rendelve étkezési típus`);

  return updatedReceptek;
};

export const fetchCombinedRecipes = async (): Promise<CombinedRecipe[]> => {
  try {
    console.log('🔄 Új adatbázis struktúra betöltése...');
    
    const [receptek, alapanyagok] = await Promise.all([
      fetchReceptekV2(),
      fetchReceptAlapanyagV2()
    ]);

    console.log('📊 Betöltött adatok:', {
      receptek: receptek.length,
      alapanyagok: alapanyagok.length
    });

    // KRITIKUS: Csak az új táblák adatait használjuk
    if (receptek.length === 0) {
      console.warn('⚠️ Új táblák üresek!');
      return [];
    }

    // Hozzárendeljük az étkezési típusokat
    const receptekWithMealTypes = await assignMealTypesToRecipes(receptek);

    // JAVÍTOTT: Csoportosítjuk az alapanyagokat recept ID szerint
    console.log('🔄 Alapanyagok csoportosítása Recept_ID szerint...');
    const alapanyagokByReceptId = alapanyagok.reduce((acc, alapanyag) => {
      const receptId = alapanyag['Recept_ID'];
      if (!acc[receptId]) {
        acc[receptId] = [];
      }
      
      // JAVÍTOTT: Pontos alapanyag formázás
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
        console.log(`🧾 Recept ID ${receptId}: ${formattedIngredient.trim()}`);
      }
      
      return acc;
    }, {} as Record<number, string[]>);

    console.log('📊 Alapanyagok csoportosítva:', Object.keys(alapanyagokByReceptId).length, 'recept ID-hoz');
    
    // Statisztika - hány recepthez van alapanyag
    const receptekWithIngredients = Object.keys(alapanyagokByReceptId).length;
    console.log(`📈 ${receptekWithIngredients} recepthez vannak alapanyagok`);

    // JAVÍTOTT: Kombináljuk a recepteket az alapanyagokkal ID alapján
    const combinedRecipes: CombinedRecipe[] = receptekWithMealTypes.map(recept => {
      const receptId = recept['Recept ID'];
      const hozzavalok = alapanyagokByReceptId[receptId] || [];
      
      if (hozzavalok.length === 0) {
        console.warn(`⚠️ Nincs alapanyag a ${receptId} ID-jú recepthez: ${recept['Receptnév']}`);
      } else {
        console.log(`✅ ${receptId} ID-jú recepthez ${hozzavalok.length} alapanyag hozzárendelve`);
      }
      
      return {
        id: receptId,
        név: recept['Receptnév'] || 'Névtelen recept',
        elkészítés: recept['Elkészítése'] || 'Nincs leírás',
        kép: recept['Kép'] || '',
        szénhidrát: recept['Szenhidrat_g'] || 0,
        fehérje: recept['Feherje_g'] || 0,
        zsír: recept['Zsir_g'] || 0,
        hozzávalók: hozzavalok, // ID alapján kapcsolt alapanyagok
        mealType: recept.meal_type || undefined
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
    
    // Részletes alapanyag statisztika
    const ingredientStats = combinedRecipes.reduce((acc, recipe) => {
      acc.total += recipe.hozzávalók.length;
      if (recipe.hozzávalók.length > 0) {
        acc.withIngredients++;
      }
      return acc;
    }, { total: 0, withIngredients: 0 });
    
    console.log('📈 Alapanyag statisztikák:', ingredientStats);
    
    return combinedRecipes;
  } catch (error) {
    console.error('❌ Kombinált receptek betöltési hiba:', error);
    throw error;
  }
};
