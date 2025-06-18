
import { SupabaseRecipe } from '@/types/supabase';

export const convertToStandardRecipe = (supabaseRecipe: SupabaseRecipe) => {
  const ingredients = [
    supabaseRecipe['Hozzavalo_1'], supabaseRecipe['Hozzavalo_2'], supabaseRecipe['Hozzavalo_3'],
    supabaseRecipe['Hozzavalo_4'], supabaseRecipe['Hozzavalo_5'], supabaseRecipe['Hozzavalo_6'],
    supabaseRecipe['Hozzavalo_7'], supabaseRecipe['Hozzavalo_8'], supabaseRecipe['Hozzavalo_9'],
    supabaseRecipe['Hozzavalo_10'], supabaseRecipe['Hozzavalo_11'], supabaseRecipe['Hozzavalo_12'],
    supabaseRecipe['Hozzavalo_13'], supabaseRecipe['Hozzavalo_14'], supabaseRecipe['Hozzavalo_15'],
    supabaseRecipe['Hozzavalo_16'], supabaseRecipe['Hozzavalo_17'], supabaseRecipe['Hozzavalo_18']
  ].filter(Boolean);

  return {
    név: supabaseRecipe['Recept_Neve'] || 'Névtelen recept',
    hozzávalók: ingredients,
    elkészítés: supabaseRecipe['Elkészítés'] || 'Nincs leírás',
    elkészítésiIdő: supabaseRecipe['Elkeszitesi_Ido'] || 'Ismeretlen',
    fehérje: supabaseRecipe['Feherje_g']?.toString() || '0',
    szénhidrát: supabaseRecipe['Szenhidrat_g']?.toString() || '0',
    zsír: supabaseRecipe['Zsir_g']?.toString() || '0',
    képUrl: supabaseRecipe['Kép URL'] || ''
  };
};
