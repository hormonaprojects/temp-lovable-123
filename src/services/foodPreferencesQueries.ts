
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
  console.log('🔍 Preferenciák lekérdezése felhasználóhoz:', userId);
  
  const { data, error } = await supabase
    .from('Ételpreferenciák')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('❌ Preferenciák betöltési hiba:', error);
    throw error;
  }

  console.log('✅ Betöltött preferenciák:', data?.length || 0, 'db');
  console.log('📊 Preferenciák részletei:', data?.slice(0, 3));

  // Type assertion to ensure the preference field matches our type
  const preferences = (data || []).map(item => ({
    ...item,
    preference: item.preference as 'like' | 'dislike' | 'neutral'
  }));

  // Debug: statisztikák
  const stats = {
    like: preferences.filter(p => p.preference === 'like').length,
    dislike: preferences.filter(p => p.preference === 'dislike').length,
    neutral: preferences.filter(p => p.preference === 'neutral').length
  };
  console.log('📈 Preferencia statisztikák:', stats);

  return preferences;
};

export const saveUserPreferences = async (userId: string, preferences: Array<{
  category: string;
  ingredient: string;
  preference: 'like' | 'dislike' | 'neutral';
}>): Promise<void> => {
  console.log('💾 Preferenciák mentése:', userId, preferences.length, 'db');
  
  // Töröljük a meglévő preferenciákat
  const { error: deleteError } = await supabase
    .from('Ételpreferenciák')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.error('❌ Korábbi preferenciák törlési hiba:', deleteError);
    throw deleteError;
  }

  // Csak azokat a preferenciákat mentjük, amelyek nem 'neutral' státuszúak
  // A 'neutral' alapértelmezett, így nem kell tárolni az adatbázisban
  const preferencesToInsert = preferences
    .filter(pref => pref.preference !== 'neutral')
    .map(pref => ({
      user_id: userId,
      category: pref.category,
      ingredient: pref.ingredient,
      preference: pref.preference
    }));

  console.log('💾 Ténylegesen mentendő preferenciák (nem semleges):', preferencesToInsert.length, 'db');

  if (preferencesToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('Ételpreferenciák')
      .insert(preferencesToInsert);

    if (insertError) {
      console.error('❌ Preferenciák mentési hiba:', insertError);
      throw insertError;
    }
  }

  console.log('✅ Preferenciák sikeresen mentve');
};

export const checkUserHasPreferences = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('Ételpreferenciák')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (error) {
    console.error('❌ Preferenciák ellenőrzési hiba:', error);
    return false;
  }

  return (data?.length || 0) > 0;
};
