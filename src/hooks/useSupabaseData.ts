
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SupabaseRecipe, MealTypeData } from '@/types/supabase';
import { fetchCategories, fetchMealTypes, fetchRecipes, saveRecipeRating } from '@/services/supabaseQueries';
import { processCategories, processMealTypes, createMealTypesDisplay } from '@/utils/dataProcessors';
import { convertToStandardRecipe } from '@/utils/recipeConverter';
import { getRecipesByMealType, getRecipesByCategory } from '@/services/recipeFilters';

export function useSupabaseData() {
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [mealTypes, setMealTypes] = useState<MealTypeData>({});
  const [recipes, setRecipes] = useState<SupabaseRecipe[]>([]);
  const [mealTypeRecipes, setMealTypeRecipes] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

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
    return getRecipesByMealType(recipes, mealTypeRecipes, mealType);
  };

  const getRecipesByCategoryHandler = (category: string, ingredient?: string, mealType?: string): SupabaseRecipe[] => {
    return getRecipesByCategory(recipes, mealTypeRecipes, categories, category, ingredient, mealType);
  };

  const getRandomRecipe = (): SupabaseRecipe | null => {
    if (recipes.length === 0) return null;
    return recipes[Math.floor(Math.random() * recipes.length)];
  };

  const saveRating = async (recipeName: string, rating: number) => {
    try {
      await saveRecipeRating(recipeName, rating);
      console.log('✅ Értékelés sikeresen mentve:', { recipeName, rating });
      return true;
    } catch (error) {
      console.error('❌ Értékelés mentési hiba:', error);
      return false;
    }
  };

  return {
    categories,
    mealTypes,
    recipes,
    loading,
    getRecipesByMealType: getRecipesByMealTypeHandler,
    getRecipesByCategory: getRecipesByCategoryHandler,
    getRandomRecipe,
    convertToStandardRecipe,
    saveRating,
    refetch: loadData
  };
}
