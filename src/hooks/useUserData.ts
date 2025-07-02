
import { useState, useCallback } from 'react';
import { getUserPreferences, filterIngredientsByPreferences, UserPreference } from '@/services/preferenceFilters';
import { getUserFavorites, isFavoriteIngredient, UserFavorite, addUserFavorite, removeUserFavorite } from '@/services/userFavorites';
import { saveRecipeRating } from '@/services/supabaseQueries';

export function useUserData(userId?: string) {
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([]);
  const [userFavorites, setUserFavorites] = useState<UserFavorite[]>([]);

  const loadUserPreferences = useCallback(async () => {
    if (!userId) return;
    
    try {
      const preferences = await getUserPreferences(userId);
      setUserPreferences(preferences);
    } catch (error) {
      console.error('Preferenciák betöltési hiba:', error);
    }
  }, [userId]);

  const loadUserFavorites = useCallback(async () => {
    if (!userId) return;
    
    try {
      const favorites = await getUserFavorites(userId);
      setUserFavorites(favorites);
    } catch (error) {
      console.error('Kedvencek betöltési hiba:', error);
    }
  }, [userId]);

  const getFilteredIngredients = useCallback((category: string, categories: Record<string, string[]>): string[] => {
    if (!Object.keys(categories).length) {
      return [];
    }
    const allIngredients = categories[category] || [];
    if (userPreferences.length === 0) return allIngredients;
    
    return filterIngredientsByPreferences(allIngredients, category, userPreferences);
  }, [userPreferences]);

  const getFavoriteForIngredient = useCallback((ingredient: string, category?: string): boolean => {
    if (!userFavorites.length) return false;
    if (!category) {
      return userFavorites.some(fav => fav.ingredient === ingredient);
    }
    return isFavoriteIngredient(ingredient, category, userFavorites);
  }, [userFavorites]);

  const getPreferenceForIngredient = useCallback((ingredient: string, category?: string): 'like' | 'dislike' | 'neutral' => {
    if (!userPreferences.length || !category) return 'neutral';
    
    const preference = userPreferences.find(
      pref => pref.ingredient === ingredient && pref.category === category
    );
    
    return preference ? preference.preference as 'like' | 'dislike' | 'neutral' : 'neutral';
  }, [userPreferences]);

  const handleFavoriteToggle = async (ingredient: string, category: string, isFavorite: boolean) => {
    if (!userId) return false;

    try {
      if (isFavorite) {
        const success = await addUserFavorite(userId, category, ingredient);
        if (success) {
          await loadUserFavorites();
        }
        return success;
      } else {
        const success = await removeUserFavorite(userId, category, ingredient);
        if (success) {
          await loadUserFavorites();
        }
        return success;
      }
    } catch (error) {
      console.error('Kedvenc kezelési hiba:', error);
      return false;
    }
  };

  const saveRating = async (recipeName: string, rating: number) => {
    if (!userId) {
      console.error('User ID szükséges az értékelés mentéséhez');
      return false;
    }

    try {
      await saveRecipeRating(recipeName, rating, userId);
      return true;
    } catch (error) {
      console.error('Értékelés mentési hiba:', error);
      return false;
    }
  };

  return {
    userPreferences,
    userFavorites,
    loadUserPreferences,
    loadUserFavorites,
    getFilteredIngredients,
    getFavoriteForIngredient,
    getPreferenceForIngredient,
    handleFavoriteToggle,
    saveRating,
    refreshFavorites: loadUserFavorites
  };
}
