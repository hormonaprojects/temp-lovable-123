
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

// Fallback: ha az új táblák üresek, próbáljuk meg a régi adatbázisból betölteni
export const fetchLegacyRecipes = async () => {
  console.log('🔄 Fallback: régi adatbázis lekérése...');
  const { data, error } = await supabase
    .from('Adatbázis')
    .select('*');

  if (error) {
    console.error('❌ Régi adatbázis betöltési hiba:', error);
    throw error;
  }

  console.log('✅ Régi adatbázis betöltve:', data?.length || 0, 'db');
  return data || [];
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

    // KRITIKUS: Csak az új táblák adatait használjuk, nincs fallback
    if (receptek.length === 0) {
      console.warn('⚠️ Új táblák üresek, de NEM használjuk a fallback-et!');
      return [];
    }

    // Csoportosítjuk az alapanyagokat recept ID szerint
    const alapanyagokByReceptId = alapanyagok.reduce((acc, alapanyag) => {
      const receptId = alapanyag['Recept_ID'];
      if (!acc[receptId]) {
        acc[receptId] = [];
      }
      
      // JAVÍTÁS: Pontosan formázott alapanyag string a táblában található adatok alapján
      const mennyiseg = alapanyag['Mennyiség'] || '';
      const mertekegyseg = alapanyag['Mértékegység'] || '';
      const elelmiszer = alapanyag['Élelmiszerek'] || '';
      
      // Debug log az egyes alapanyagokhoz
      console.log(`📝 Alapanyag Recept_ID ${receptId}:`, {
        mennyiseg,
        mertekegyseg,
        elelmiszer
      });
      
      const formattedIngredient = `${mennyiseg} ${mertekegyseg} ${elelmiszer}`.trim();
      if (formattedIngredient && formattedIngredient !== '  ') {
        acc[receptId].push(formattedIngredient);
        console.log(`✅ Hozzáadva: "${formattedIngredient}" a ${receptId} ID-hez`);
      }
      
      return acc;
    }, {} as Record<number, string[]>);

    console.log('📊 Alapanyagok csoportosítva:', Object.keys(alapanyagokByReceptId).length, 'recept ID-hoz');
    
    // Debug log minden recept ID-hez tartozó alapanyagokról
    Object.entries(alapanyagokByReceptId).forEach(([receptId, ingredients]) => {
      console.log(`🔍 Recept ID ${receptId} alapanyagai:`, ingredients);
    });

    // Kombináljuk a recepteket az alapanyagokkal
    const combinedRecipes: CombinedRecipe[] = receptek.map(recept => {
      const receptId = recept['Recept ID'];
      const hozzavalok = alapanyagokByReceptId[receptId] || [];
      
      if (hozzavalok.length === 0) {
        console.warn(`⚠️ Nincs alapanyag a ${receptId} ID-jú recepthez: ${recept['Receptnév']}`);
      } else {
        console.log(`✅ ${receptId} ID-hoz (${recept['Receptnév']}) tartozó alapanyagok:`, hozzavalok);
      }
      
      return {
        id: receptId,
        név: recept['Receptnév'] || 'Névtelen recept',
        elkészítés: recept['Elkészítése'] || 'Nincs leírás',
        kép: recept['Kép'] || '',
        szénhidrát: recept['Szenhidrat_g'] || 0,
        fehérje: recept['Feherje_g'] || 0,
        zsír: recept['Zsir_g'] || 0,
        hozzávalók: hozzavalok
      };
    });

    console.log('✅ Kombinált receptek létrehozva:', combinedRecipes.length);
    console.log('📊 Receptek hozzávalókkal:', combinedRecipes.filter(r => r.hozzávalók.length > 0).length);
    
    // Debug log az első pár recepthez
    combinedRecipes.slice(0, 5).forEach(recipe => {
      console.log(`🔍 ${recipe.név} (ID: ${recipe.id}) hozzávalói:`, recipe.hozzávalók);
    });
    
    return combinedRecipes;
  } catch (error) {
    console.error('❌ Kombinált receptek betöltési hiba:', error);
    throw error;
  }
};
