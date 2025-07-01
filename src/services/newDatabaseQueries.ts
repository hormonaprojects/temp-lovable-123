
import { supabase } from '@/integrations/supabase/client';
import { ReceptekV2, ReceptAlapanyagV2, CombinedRecipe } from '@/types/newDatabase';

export const fetchReceptekV2 = async (): Promise<ReceptekV2[]> => {
  const { data, error } = await supabase
    .from('receptekv2')
    .select('*');

  if (error) {
    console.error('ReceptekV2 betöltési hiba:', error);
    throw error;
  }

  return data || [];
};

export const fetchReceptAlapanyagV2 = async (): Promise<ReceptAlapanyagV2[]> => {
  const { data, error } = await supabase
    .from('recept_alapanyagv2')
    .select('*');

  if (error) {
    console.error('Recept alapanyag betöltési hiba:', error);
    throw error;
  }

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
      acc[receptId].push(formattedIngredient);
      
      return acc;
    }, {} as Record<number, string[]>);

    // Kombináljuk a recepteket az alapanyagokkal
    const combinedRecipes: CombinedRecipe[] = receptek.map(recept => ({
      id: recept['Recept ID'],
      név: recept['Receptnév'] || 'Névtelen recept',
      elkészítés: recept['Elkészítése'] || 'Nincs leírás',
      kép: recept['Kép'] || '',
      szénhidrát: recept['Szenhidrat_g'] || 0,
      fehérje: recept['Feherje_g'] || 0,
      zsír: recept['Zsir_g'] || 0,
      hozzávalók: alapanyagokByReceptId[recept['Recept ID']] || []
    }));

    console.log('✅ Kombinált receptek létrehozva:', combinedRecipes.length);
    
    return combinedRecipes;
  } catch (error) {
    console.error('❌ Kombinált receptek betöltési hiba:', error);
    throw error;
  }
};
