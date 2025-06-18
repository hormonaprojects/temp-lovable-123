
import { supabase } from '@/integrations/supabase/client';

export interface FoodPreference {
  id: string;
  user_id: string;
  category: string;
  ingredient: string;
  preference: 'like' | 'dislike' | 'neutral';
  created_at: string;
  updated_at: string;
}

export const fetchUserPreferences = async (userId: string): Promise<FoodPreference[]> => {
  const { data, error } = await supabase
    .from('Ételpreferenciák')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Preferenciák betöltési hiba:', error);
    throw error;
  }

  // Type assertion to ensure the preference field matches our type
  return (data || []).map(item => ({
    ...item,
    preference: item.preference as 'like' | 'dislike' | 'neutral'
  }));
};

export const saveUserPreferences = async (userId: string, preferences: Array<{
  category: string;
  ingredient: string;
  preference: 'like' | 'dislike' | 'neutral';
}>): Promise<void> => {
  // Töröljük a meglévő preferenciákat
  const { error: deleteError } = await supabase
    .from('Ételpreferenciák')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Korábbi preferenciák törlési hiba:', deleteError);
    throw deleteError;
  }

  // Beszúrjuk az új preferenciákat
  const preferencesToInsert = preferences.map(pref => ({
    user_id: userId,
    category: pref.category,
    ingredient: pref.ingredient,
    preference: pref.preference
  }));

  const { error: insertError } = await supabase
    .from('Ételpreferenciák')
    .insert(preferencesToInsert);

  if (insertError) {
    console.error('Preferenciák mentési hiba:', insertError);
    throw insertError;
  }
};

export const checkUserHasPreferences = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('Ételpreferenciák')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (error) {
    console.error('Preferenciák ellenőrzési hiba:', error);
    return false;
  }

  return (data?.length || 0) > 0;
};
