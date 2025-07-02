
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MealTypeData } from '@/types/supabase';
import { fetchCategories, fetchMealTypes } from '@/services/supabaseQueries';
import { processCategories, processMealTypes, createMealTypesDisplay } from '@/utils/dataProcessors';

export function useBasicData() {
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [mealTypes, setMealTypes] = useState<MealTypeData>({});
  const [mealTypeRecipes, setMealTypeRecipes] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  const loadBasicData = useCallback(async () => {
    if (isInitialized) return;
    
    setLoading(true);
    try {
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

    } catch (error) {
      console.error('Alapvető adatok betöltési hiba:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni az alapvető adatokat.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [isInitialized, toast]);

  return {
    categories,
    mealTypes,
    mealTypeRecipes,
    loading,
    isInitialized,
    loadBasicData
  };
}
