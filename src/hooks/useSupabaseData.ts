
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupabaseRecipe {
  'Recept_Neve': string;
  'Elkészítés': string;
  'Elkeszitesi_Ido': string;
  'Feherje_g': number;
  'Szenhidrat_g': number;
  'Zsir_g': number;
  'Kép URL': string;
  'Hozzavalo_1': string;
  'Hozzavalo_2': string;
  'Hozzavalo_3': string;
  'Hozzavalo_4': string;
  'Hozzavalo_5': string;
  'Hozzavalo_6': string;
  'Hozzavalo_7': string;
  'Hozzavalo_8': string;
  'Hozzavalo_9': string;
  'Hozzavalo_10': string;
  'Hozzavalo_11': string;
  'Hozzavalo_12': string;
  'Hozzavalo_13': string;
  'Hozzavalo_14': string;
  'Hozzavalo_15': string;
  'Hozzavalo_16': string;
  'Hozzavalo_17': string;
  'Hozzavalo_18': string;
}

export interface MealTypeData {
  [key: string]: string[];
}

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
      
      // Ételkategóriák betöltése
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('Ételkategóriák')
        .select('*');

      if (categoriesError) {
        console.error('Kategóriák betöltési hiba:', categoriesError);
        throw categoriesError;
      }

      // Étkezések betöltése
      const { data: mealTypesData, error: mealTypesError } = await supabase
        .from('Étkezések')
        .select('*');

      if (mealTypesError) {
        console.error('Étkezések betöltési hiba:', mealTypesError);
        throw mealTypesError;
      }

      // Receptek betöltése
      const { data: recipesData, error: recipesError } = await supabase
        .from('Adatbázis')
        .select('*');

      if (recipesError) {
        console.error('Receptek betöltési hiba:', recipesError);
        throw recipesError;
      }

      console.log('📊 Nyers adatok betöltve:', {
        categories: categoriesData?.length || 0,
        mealTypes: mealTypesData?.length || 0,
        recipes: recipesData?.length || 0
      });

      // Kategóriák feldolgozása - minden oszlop értékeit vesszővel elválasztva
      const processedCategories: Record<string, string[]> = {};
      if (categoriesData && categoriesData.length > 0) {
        const categoryRow = categoriesData[0];
        Object.entries(categoryRow).forEach(([key, value]) => {
          if (value && typeof value === 'string' && value.trim()) {
            const items = value.split(',')
              .map(item => item.trim())
              .filter(item => item && item !== '' && item !== 'EMPTY');
            if (items.length > 0) {
              processedCategories[key] = items;
            }
          }
        });
      }

      console.log('📊 Feldolgozott kategóriák:', processedCategories);

      // Étkezések feldolgozása - minden receptnév összegyűjtése étkezési típusonként
      const allowedMealTypes = ['reggeli', 'tízórai', 'ebéd', 'leves', 'uzsonna', 'vacsora'];
      const processedMealTypeRecipes: Record<string, string[]> = {};
      
      if (mealTypesData && mealTypesData.length > 0) {
        // Minden sor feldolgozása az Étkezések táblából
        mealTypesData.forEach(row => {
          allowedMealTypes.forEach(mealType => {
            // Oszlop név normalizálása (pl. "Tízórai" -> "tízórai")
            const columnName = Object.keys(row).find(key => 
              key.toLowerCase() === mealType.toLowerCase() ||
              key.toLowerCase().replace('í', 'i') === mealType.toLowerCase().replace('í', 'i')
            );
            
            if (columnName && row[columnName]) {
              const recipeName = row[columnName];
              if (typeof recipeName === 'string' && recipeName.trim() && recipeName !== 'EMPTY') {
                if (!processedMealTypeRecipes[mealType]) {
                  processedMealTypeRecipes[mealType] = [];
                }
                if (!processedMealTypeRecipes[mealType].includes(recipeName)) {
                  processedMealTypeRecipes[mealType].push(recipeName);
                }
              }
            }
          });
        });
      }

      console.log('🍽️ Feldolgozott étkezési típusok receptekkel:', processedMealTypeRecipes);

      // Meal types objektum létrehozása - receptek számával
      const processedMealTypes: MealTypeData = {};
      allowedMealTypes.forEach(mealType => {
        if (processedMealTypeRecipes[mealType] && processedMealTypeRecipes[mealType].length > 0) {
          processedMealTypes[mealType] = processedMealTypeRecipes[mealType];
        }
      });

      console.log('✅ Végső meal types receptszámokkal:', processedMealTypes);

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

  const getRecipesByMealType = (mealType: string): SupabaseRecipe[] => {
    const recipeNames = mealTypeRecipes[mealType.toLowerCase()] || [];
    const foundRecipes = recipes.filter(recipe => 
      recipeNames.includes(recipe['Recept_Neve'])
    );
    console.log(`🔍 ${mealType} receptek:`, foundRecipes.length, 'db');
    return foundRecipes;
  };

  const getRecipesByCategory = (category: string, ingredient?: string): SupabaseRecipe[] => {
    const categoryIngredients = categories[category] || [];
    console.log(`🔍 Kategória alapanyagok (${category}):`, categoryIngredients);
    
    const foundRecipes = recipes.filter(recipe => {
      // Összes hozzávaló összegyűjtése a receptből
      const allIngredients = [
        recipe['Hozzavalo_1'], recipe['Hozzavalo_2'], recipe['Hozzavalo_3'],
        recipe['Hozzavalo_4'], recipe['Hozzavalo_5'], recipe['Hozzavalo_6'],
        recipe['Hozzavalo_7'], recipe['Hozzavalo_8'], recipe['Hozzavalo_9'],
        recipe['Hozzavalo_10'], recipe['Hozzavalo_11'], recipe['Hozzavalo_12'],
        recipe['Hozzavalo_13'], recipe['Hozzavalo_14'], recipe['Hozzavalo_15'],
        recipe['Hozzavalo_16'], recipe['Hozzavalo_17'], recipe['Hozzavalo_18']
      ].filter(Boolean);

      // Ha konkrét hozzávaló van megadva
      if (ingredient) {
        return allIngredients.some(ing => 
          ing && ing.toLowerCase().includes(ingredient.toLowerCase())
        );
      }

      // Ha csak kategória van megadva, akkor a kategória bármely hozzávalójával
      return categoryIngredients.some(categoryIngredient =>
        allIngredients.some(ing => 
          ing && ing.toLowerCase().includes(categoryIngredient.toLowerCase())
        )
      );
    });

    console.log(`🔍 Kategória receptek (${category}, ${ingredient || 'összes'}):`, foundRecipes.length, 'db');
    return foundRecipes;
  };

  const getRandomRecipe = (): SupabaseRecipe | null => {
    if (recipes.length === 0) return null;
    return recipes[Math.floor(Math.random() * recipes.length)];
  };

  const saveRating = async (recipeName: string, rating: number) => {
    try {
      const { error } = await supabase
        .from('Értékelések')
        .insert({
          'Recept neve': recipeName,
          'Értékelés': rating.toString(),
          'Dátum': new Date().toISOString()
        });

      if (error) {
        console.error('Értékelés mentési hiba:', error);
        throw error;
      }

      console.log('✅ Értékelés sikeresen mentve:', { recipeName, rating });
      return true;
    } catch (error) {
      console.error('❌ Értékelés mentési hiba:', error);
      return false;
    }
  };

  const convertToStandardRecipe = (supabaseRecipe: SupabaseRecipe) => {
    const ingredients = [
      supabaseRecipe['Hozzavalo_1'], supabaseRecipe['Hozzavalo_2'], supabaseRecipe['Hozzavalo_3'],
      supabaseRecipe['Hozzavalo_4'], supabaseRecipe['Hozzavalo_5'], supabaseRecipe['Hozzavalo_6'],
      supabaseRecipe['Hozzavalo_7'], supabaseRecipe['Hozzavalo_8'], supabaseRecipe['Hozzavalo_9'],
      supabaseRecipe['Hozzavalo_10'], supabaseRecipe['Hozzavalo_11'], supabaseRecipe['Hozzavalo_12'],
      supabaseRecipe['Hozzavalo_13'], supabaseRecipe['Hozzavalo_14'], supabaseRecipe['Hozzavalo_15'],
      supabaseRecipe['Hozzavalo_16'], supabaseRecipe['Hozzavalo_17'], supabaseRecipe['Hozzavalo_18']
    ].filter(Boolean);

    return {
      név: supabaseRecipe['Recept_Neve'] || 'Névtelen recept',
      hozzávalók: ingredients,
      elkészítés: supabaseRecipe['Elkészítés'] || 'Nincs leírás',
      elkészítésiIdő: supabaseRecipe['Elkeszitesi_Ido'] || 'Ismeretlen',
      fehérje: supabaseRecipe['Feherje_g']?.toString() || '0',
      szénhidrát: supabaseRecipe['Szenhidrat_g']?.toString() || '0',
      zsír: supabaseRecipe['Zsir_g']?.toString() || '0',
      képUrl: supabaseRecipe['Kép URL'] || ''
    };
  };

  return {
    categories,
    mealTypes,
    recipes,
    loading,
    getRecipesByMealType,
    getRecipesByCategory,
    getRandomRecipe,
    convertToStandardRecipe,
    saveRating,
    refetch: loadData
  };
}
