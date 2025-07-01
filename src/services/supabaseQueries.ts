
import { supabase } from '@/integrations/supabase/client';
import { fetchCombinedRecipes } from './newDatabaseQueries';

export const fetchCategories = async () => {
  console.log('🔄 Kategóriák betöltése új táblából...');
  const { data, error } = await supabase
    .from('Ételkategóriák_Új')
    .select('*');

  if (error) {
    console.error('❌ Kategóriák betöltési hiba:', error);
    throw error;
  }

  console.log('✅ Kategóriák betöltve:', data?.length || 0, 'db');
  return data;
};

export const fetchMealTypes = async () => {
  console.log('🔄 Étkezések betöltése...');
  const { data, error } = await supabase
    .from('Étkezések')
    .select('*');

  if (error) {
    console.error('❌ Étkezések betöltési hiba:', error);
    throw error;
  }

  console.log('✅ Étkezések betöltve:', data?.length || 0, 'db');
  return data;
};

// KRITIKUS: Minden recept lekérés KIZÁRÓLAG az új adatbázis struktúrát használja
export const fetchRecipes = async () => {
  console.log('🔄 Receptek betöltése KIZÁRÓLAG az új táblákból...');
  return await fetchCombinedRecipes();
};

export const saveRecipeRating = async (recipeName: string, rating: number, userId: string) => {
  const { error } = await supabase
    .from('Értékelések')
    .insert({
      'Recept neve': recipeName,
      'Értékelés': rating.toString(),
      'Dátum': new Date().toISOString(),
      'user_id': userId
    });

  if (error) {
    console.error('Értékelés mentési hiba:', error);
    throw error;
  }

  return true;
};
