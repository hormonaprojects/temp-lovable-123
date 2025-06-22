
import { supabase } from '@/integrations/supabase/client';

export interface UserFavorite {
  id: string;
  user_id: string;
  category: string;
  ingredient: string;
}

export const getUserFavorites = async (userId: string): Promise<UserFavorite[]> => {
  const { data, error } = await supabase
    .from('Ételpreferenciák')
    .select('*')
    .eq('user_id', userId)
    .eq('preference', 'like'); // Get only liked ingredients that could be favorites

  if (error) {
    console.error('❌ Kedvencek betöltési hiba:', error);
    return [];
  }

  // For now, we'll consider 'like' preferences as potential favorites
  // In a real implementation, you might want a separate favorites table
  return (data || []).map(item => ({
    id: item.id,
    user_id: item.user_id,
    category: item.category,
    ingredient: item.ingredient
  }));
};

export const isFavoriteIngredient = (
  ingredient: string, 
  category: string, 
  favorites: UserFavorite[]
): boolean => {
  return favorites.some(fav => 
    fav.ingredient === ingredient && fav.category === category
  );
};
