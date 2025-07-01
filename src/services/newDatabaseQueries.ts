
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

    // Ha az új táblák üresek, fallback a régi adatbázisra
    if (receptek.length === 0) {
      console.warn('⚠️ Új táblák üresek, fallback a régi adatbázisra...');
      const legacyData = await fetchLegacyRecipes();
      
      // Konvertáljuk a régi formátumot az új formátumra
      return legacyData.map((recipe, index) => ({
        id: index + 1,
        név: recipe.Recept_Neve || 'Névtelen recept',
        elkészítés: recipe.Elkészítés || 'Nincs leírás',
        kép: recipe['Kép URL'] || '',
        szénhidrát: recipe.Szenhidrat_g || 0,
        fehérje: recipe.Feherje_g || 0,
        zsír: recipe.Zsir_g || 0,
        hozzávalók: [
          recipe.Hozzavalo_1,
          recipe.Hozzavalo_2,
          recipe.Hozzavalo_3,
          recipe.Hozzavalo_4,
          recipe.Hozzavalo_5,
          recipe.Hozzavalo_6,
          recipe.Hozzavalo_7,
          recipe.Hozzavalo_8,
          recipe.Hozzavalo_9,
          recipe.Hozzavalo_10,
          recipe.Hozzavalo_11,
          recipe.Hozzavalo_12,
          recipe.Hozzavalo_13,
          recipe.Hozzavalo_14,
          recipe.Hozzavalo_15,
          recipe.Hozzavalo_16,
          recipe.Hozzavalo_17,
          recipe.Hozzavalo_18
        ].filter(ingredient => ingredient && ingredient.trim() !== '')
      }));
    }

    // Csoportosítjuk az alapanyagokat recept ID szerint
    const alapanyagokByReceptId = alapanyagok.reduce((acc, alapanyag) => {
      const receptId = alapanyag['Recept_ID'];
      if (!acc[receptId]) {
        acc[receptId] = [];
      }
      
      // Formázott alapanyag string: "Mennyiség Mértékegység Élelmiszer"
      const mennyiseg = alapanyag['Mennyiség'] || '';
      const mertekegyseg = alapanyag['Mértékegység'] || '';
      const elelmiszer = alapanyag['Élelmiszerek'] || '';
      
      const formattedIngredient = `${mennyiseg} ${mertekegyseg} ${elelmiszer}`.trim();
      if (formattedIngredient) {
        acc[receptId].push(formattedIngredient);
      }
      
      return acc;
    }, {} as Record<number, string[]>);

    console.log('📊 Alapanyagok csoportosítva:', Object.keys(alapanyagokByReceptId).length, 'recept ID-hoz');

    // Kombináljuk a recepteket az alapanyagokkal
    const combinedRecipes: CombinedRecipe[] = receptek.map(recept => {
      const receptId = recept['Recept ID'];
      const hozzavalok = alapanyagokByReceptId[receptId] || [];
      
      if (hozzavalok.length === 0) {
        console.warn(`⚠️ Nincs alapanyag a ${receptId} ID-jú recepthez: ${recept['Receptnév']}`);
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
    
    return combinedRecipes;
  } catch (error) {
    console.error('❌ Kombinált receptek betöltési hiba:', error);
    throw error;
  }
};
