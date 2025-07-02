
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
  console.log('🔄 Recept alapanyag lekérése a recept_alapanyag táblából...');
  
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
