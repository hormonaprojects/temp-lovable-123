
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MealTypeData } from '@/types/supabase';
import { CombinedRecipe } from '@/types/newDatabase';
import { fetchCategories, fetchMealTypes, fetchRecipes, saveRecipeRating } from '@/services/supabaseQueries';
import { processCategories, processMealTypes, createMealTypesDisplay } from '@/utils/dataProcessors';
import { convertNewRecipeToStandard } from '@/utils/newRecipeConverter';
import { getRecipesByMealType, getRecipesByCategory } from '@/services/recipeFilters';
import { getUserPreferences, filterIngredientsByPreferences, UserPreference } from '@/services/preferenceFilters';
import { getUserFavorites, isFavoriteIngredient, UserFavorite, addUserFavorite, removeUserFavorite } from '@/services/userFavorites';

export function useLazySupabaseData(userId?: string) {
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [mealTypes, setMealTypes] = useState<MealTypeData>({});
  const [recipes, setRecipes] = useState<CombinedRecipe[]>([]);
  const [mealTypeRecipes, setMealTypeRecipes] = useState<Record<string, string[]>>({});
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([]);
  const [userFavorites, setUserFavorites] = useState<UserFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [recipesLoaded, setRecipesLoaded] = useState(false);
  const { toast } = useToast();

  // Csak alapvető adatok betöltése (kategóriák, meal types)
  const loadBasicData = useCallback(async () => {
    if (isInitialized) return;
    
    setLoading(true);
    try {
      console.log('🔄 Alapvető adatok betöltése (kategóriák + meal types)...');
      
      const [categoriesData, mealTypesData] = await Promise.all([
        fetchCategories(),
        fetchMealTypes()
      ]);

      const processedCategories = processCategories(categoriesData || []);
      const processedMealTypeRecipes = processMealTypes(mealTypesData || []);
      const processedMealTypes = createMealTypesDisplay(processedMealTypeRecipes);

      setCategories(processedCategories);
      setMealTypes(processedMealTypes);
      setMealTypeRecipes(processedMealTypeRecipes);
      setIsInitialized(true);
      
      console.log('✅ Alapvető adatok betöltve:', {
        categories: Object.keys(processedCategories).length,
        mealTypes: Object.keys(processedMealTypes).length
      });

    } catch (error) {
      console.error('❌ Alapvető adatok betöltési hiba:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni az alapvető adatokat.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [isInitialized, toast]);

  // Receptek betöltése csak amikor szükség van rájuk
  const loadRecipes = useCallback(async () => {
    if (recipesLoaded) return;
    
    setLoading(true);
    try {
      console.log('🔄 Receptek betöltése...');
      
      const recipesData = await fetchRecipes();
      setRecipes(recipesData || []);
      setRecipesLoaded(true);
      
      console.log('✅ Receptek betöltve:', recipesData?.length || 0);

    } catch (error) {
      console.error('❌ Receptek betöltési hiba:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a recepteket.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [recipesLoaded, toast]);

  // User preferenciák betöltése
  const loadUserPreferences = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('🔄 Felhasználói preferenciák betöltése...', userId);
      const preferences = await getUserPreferences(userId);
      setUserPreferences(preferences);
      console.log('✅ Preferenciák betöltve:', preferences.length, 'db');
    } catch (error) {
      console.error('❌ Preferenciák betöltési hiba:', error);
    }
  }, [userId]);

  // User kedvencek betöltése
  const loadUserFavorites = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('🔄 Felhasználói kedvencek betöltése...', userId);
      const favorites = await getUserFavorites(userId);
      setUserFavorites(favorites);
      console.log('✅ Kedvencek betöltve:', favorites.length, 'db');
    } catch (error) {
      console.error('❌ Kedvencek betöltési hiba:', error);
    }
  }, [userId]);

  // Intelligens receptek lekérése - automatikusan betölti a recepteket ha szükség van rájuk
  const getRecipesByMealTypeHandler = useCallback(async (mealType: string): Promise<CombinedRecipe[]> => {
    // Ha nincs betöltve a receptek, betöltjük
    if (!recipesLoaded) {
      await loadRecipes();
    }
    
    if (!recipes.length || !Object.keys(mealTypeRecipes).length) {
      console.log('⚠️ Nincsenek betöltött receptek vagy meal type adatok');
      return [];
    }
    
    console.log('🔍 Receptek lekérése meal type alapján:', mealType, 'összes recept:', recipes.length);
    return getRecipesByMealType(recipes, mealTypeRecipes, mealType, userPreferences);
  }, [recipes, mealTypeRecipes, userPreferences, recipesLoaded, loadRecipes]);

  const getRecipesByCategoryHandler = useCallback(async (category: string, ingredient?: string, mealType?: string): Promise<CombinedRecipe[]> => {
    // Ha nincs betöltve a receptek, betöltjük
    if (!recipesLoaded) {
      await loadRecipes();
    }
    
    if (!recipes.length || !Object.keys(categories).length) {
      console.log('⚠️ Nincsenek betöltött receptek vagy kategória adatok');
      return [];
    }
    
    console.log('🔍 Receptek lekérése kategória alapján:', category, 'ingredient:', ingredient, 'mealType:', mealType);
    return getRecipesByCategory(recipes, mealTypeRecipes, categories, category, ingredient, mealType, userPreferences);
  }, [recipes, categories, mealTypeRecipes, userPreferences, recipesLoaded, loadRecipes]);

  const getFilteredIngredients = useCallback((category: string): string[] => {
    if (!Object.keys(categories).length) {
      return [];
    }
    const allIngredients = categories[category] || [];
    if (userPreferences.length === 0) return allIngredients;
    
    return filterIngredientsByPreferences(allIngredients, category, userPreferences);
  }, [categories, userPreferences]);

  const getRandomRecipe = useCallback(async (): Promise<CombinedRecipe | null> => {
    // Ha nincs betöltve a receptek, betöltjük
    if (!recipesLoaded) {
      await loadRecipes();
    }
    
    if (recipes.length === 0) return null;
    return recipes[Math.floor(Math.random() * recipes.length)];
  }, [recipes, recipesLoaded, loadRecipes]);

  const saveRating = async (recipeName: string, rating: number) => {
    if (!userId) {
      console.error('User ID szükséges az értékelés mentéséhez');
      return false;
    }

    try {
      await saveRecipeRating(recipeName, rating, userId);
      console.log('✅ Értékelés sikeresen mentve:', { recipeName, rating, userId });
      return true;
    } catch (error) {
      console.error('❌ Értékelés mentési hiba:', error);
      return false;
    }
  };

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
      console.error('❌ Kedvenc kezelési hiba:', error);
      return false;
    }
  };

  return {
    categories,
    mealTypes,
    recipes,
    mealTypeRecipes,
    userPreferences,
    loading,
    isInitialized,
    recipesLoaded,
    loadBasicData,
    loadRecipes,
    loadUserPreferences,
    loadUserFavorites,
    getRecipesByMealType: getRecipesByMealTypeHandler,
    getRecipesByCategory: getRecipesByCategoryHandler,
    getFilteredIngredients,
    getRandomRecipe,
    convertToStandardRecipe: convertNewRecipeToStandard,
    saveRating,
    userFavorites,
    getFavoriteForIngredient,
    getPreferenceForIngredient,
    handleFavoriteToggle,
    refreshFavorites: loadUserFavorites
  };
}
