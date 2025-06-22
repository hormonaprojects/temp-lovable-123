import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SupabaseRecipe, MealTypeData } from '@/types/supabase';
import { fetchCategories, fetchMealTypes, fetchRecipes, saveRecipeRating } from '@/services/supabaseQueries';
import { processCategories, processMealTypes, createMealTypesDisplay } from '@/utils/dataProcessors';
import { convertToStandardRecipe } from '@/utils/recipeConverter';
import { getRecipesByMealType, getRecipesByCategory } from '@/services/recipeFilters';
import { getUserPreferences, filterIngredientsByPreferences, UserPreference } from '@/services/preferenceFilters';
import { getUserFavorites, isFavoriteIngredient, UserFavorite, addUserFavorite, removeUserFavorite } from '@/services/userFavorites';

export function useSupabaseData(userId?: string) {
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [mealTypes, setMealTypes] = useState<MealTypeData>({});
  const [recipes, setRecipes] = useState<SupabaseRecipe[]>([]);
  const [mealTypeRecipes, setMealTypeRecipes] = useState<Record<string, string[]>>({});
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [userFavorites, setUserFavorites] = useState<UserFavorite[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (userId) {
      loadUserPreferences();
      loadUserFavorites();
    }
  }, [userId]);

  const loadUserFavorites = async () => {
    if (!userId) return;
    
    try {
      console.log('🔄 Felhasználói kedvencek betöltése...', userId);
      const favorites = await getUserFavorites(userId);
      setUserFavorites(favorites);
      console.log('✅ Kedvencek betöltve:', favorites.length, 'db');
    } catch (error) {
      console.error('❌ Kedvencek betöltési hiba:', error);
    }
  };

  const loadUserPreferences = async () => {
    if (!userId) return;
    
    try {
      console.log('🔄 Felhasználói preferenciák betöltése...', userId);
      const preferences = await getUserPreferences(userId);
      setUserPreferences(preferences);
      console.log('✅ Preferenciák betöltve:', preferences.length, 'db');
    } catch (error) {
      console.error('❌ Preferenciák betöltési hiba:', error);
    }
  };

  const loadData = async () => {
    try {
      console.log('🔄 Valódi adatok betöltése Supabase-ből...');
      
      // Adatok betöltése
      const [categoriesData, mealTypesData, recipesData] = await Promise.all([
        fetchCategories(),
        fetchMealTypes(),
        fetchRecipes()
      ]);

      console.log('📊 Nyers adatok betöltve:', {
        categories: categoriesData?.length || 0,
        mealTypes: mealTypesData?.length || 0,
        recipes: recipesData?.length || 0
      });

      // Adatok feldolgozása
      const processedCategories = processCategories(categoriesData || []);
      const processedMealTypeRecipes = processMealTypes(mealTypesData || []);
      const processedMealTypes = createMealTypesDisplay(processedMealTypeRecipes);

      console.log('📊 Feldolgozott kategóriák:', processedCategories);

      setCategories(processedCategories);
      setMealTypes(processedMealTypes);
      setMealTypeRecipes(processedMealTypeRecipes);
      setRecipes(recipesData || []);
      
      console.log('✅ Adatok sikeresen betöltve:', {
        categories: Object.keys(processedCategories).length,
        mealTypes: Object.keys(processedMealTypes).length,
        totalRecipesInMealTypes: Object.values(processedMealTypes).reduce((acc, recipes) => acc + recipes.length, 0),
        recipes: recipesData?.length || 0
      });

    } catch (error) {
      console.error('❌ Adatok betöltési hiba:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni az adatokat az adatbázisból.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRecipesByMealTypeHandler = (mealType: string): SupabaseRecipe[] => {
    return getRecipesByMealType(recipes, mealTypeRecipes, mealType, userPreferences);
  };

  const getRecipesByCategoryHandler = (category: string, ingredient?: string, mealType?: string): SupabaseRecipe[] => {
    return getRecipesByCategory(recipes, mealTypeRecipes, categories, category, ingredient, mealType, userPreferences);
  };

  const getFilteredIngredients = (category: string): string[] => {
    const allIngredients = categories[category] || [];
    if (userPreferences.length === 0) return allIngredients;
    
    return filterIngredientsByPreferences(allIngredients, category, userPreferences);
  };

  const getRandomRecipe = (): SupabaseRecipe | null => {
    if (recipes.length === 0) return null;
    return recipes[Math.floor(Math.random() * recipes.length)];
  };

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

  const getFavoriteForIngredient = (ingredient: string, category?: string): boolean => {
    if (!category) {
      // Ha nincs kategória megadva, ellenőrizzük az összes kategóriában
      return userFavorites.some(fav => fav.ingredient === ingredient);
    }
    return isFavoriteIngredient(ingredient, category, userFavorites);
  };

  const handleFavoriteToggle = async (ingredient: string, category: string, isFavorite: boolean) => {
    if (!userId) return false;

    try {
      if (isFavorite) {
        const success = await addUserFavorite(userId, category, ingredient);
        if (success) {
          await loadUserFavorites(); // Frissítjük a listát
        }
        return success;
      } else {
        const success = await removeUserFavorite(userId, category, ingredient);
        if (success) {
          await loadUserFavorites(); // Frissítjük a listát
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
    userPreferences,
    loading,
    getRecipesByMealType: getRecipesByMealTypeHandler,
    getRecipesByCategory: getRecipesByCategoryHandler,
    getFilteredIngredients,
    getRandomRecipe,
    convertToStandardRecipe,
    saveRating,
    refetch: loadData,
    refreshPreferences: loadUserPreferences,
    userFavorites,
    getFavoriteForIngredient,
    handleFavoriteToggle,
    refreshFavorites: loadUserFavorites
  };
}
