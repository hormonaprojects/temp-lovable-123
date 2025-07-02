
import { supabase } from '@/integrations/supabase/client';
import { ReceptekV2, ReceptAlapanyagV2, Alapanyag } from './types';

export const fetchReceptekV2 = async (): Promise<ReceptekV2[]> => {
  console.log('🔄 Receptek lekérése a receptek táblából...');
  
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
  console.log('🔄 Recept alapanyag lekérése a recept_alapanyag táblából (paginálással)...');
  
  const pageSize = 1000;
  let allData: ReceptAlapanyagV2[] = [];
  let from = 0;
  let hasMoreData = true;

  while (hasMoreData) {
    const to = from + pageSize - 1;
    console.log(`📄 Oldal betöltése: ${from}-${to}`);
    
    const { data, error } = await supabase
      .from('recept_alapanyag')
      .select('*')
      .order('Recept_ID', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('❌ recept_alapanyag tábla lekérési hiba:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      hasMoreData = false;
      break;
    }

    allData = allData.concat(data);
    console.log(`✅ Oldal betöltve: ${data.length} rekord (összes: ${allData.length})`);

    // Ha kevesebb mint pageSize rekordot kaptunk, ez volt az utolsó oldal
    if (data.length < pageSize) {
      hasMoreData = false;
    } else {
      from += pageSize;
    }
  }

  if (allData.length === 0) {
    console.warn('⚠️ Nincs adat a recept_alapanyag táblában!');
    return [];
  }

  console.log('✅ Összes recept alapanyag betöltve:', allData.length, 'db');
  console.log('📋 Első alapanyag példa:', allData[0]);
  
  return allData;
};

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
