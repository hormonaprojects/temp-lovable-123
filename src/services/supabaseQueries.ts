import { supabase } from '@/integrations/supabase/client';

export const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('Ételkategóriák_Új')
    .select('*');

  if (error) {
    console.error('Kategóriák betöltési hiba:', error);
    throw error;
  }

  return data;
};

export const fetchMealTypes = async () => {
  const { data, error } = await supabase
    .from('Étkezések')
    .select('*');

  if (error) {
    console.error('Étkezések betöltési hiba:', error);
    throw error;
  }

  return data;
};

export const fetchRecipes = async () => {
  const { data, error } = await supabase
    .from('Adatbázis')
    .select('*');

  if (error) {
    console.error('Receptek betöltési hiba:', error);
    throw error;
  }

  return data;
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
