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

// Javított normalizációs függvény az ékezetek kezelésére
const normalizeText = (text: string): string => {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ű/g, 'u')
    .replace(/ő/g, 'o')
    .trim();
};

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

      // Kategóriák feldolgozása
      const processedCategories: Record<string, string[]> = {};
      if (categoriesData && categoriesData.length > 0) {
        categoriesData.forEach(categoryRow => {
          Object.entries(categoryRow).forEach(([key, value]) => {
            if (value && typeof value === 'string' && value.trim()) {
              const items = value.split(',')
                .map(item => item.trim())
                .filter(item => item && item !== '' && item !== 'EMPTY' && item !== 'NULL');
              
              if (items.length > 0) {
                if (!processedCategories[key]) {
                  processedCategories[key] = [];
                }
                items.forEach(item => {
                  if (!processedCategories[key].includes(item)) {
                    processedCategories[key].push(item);
                  }
                });
              }
            }
          });
        });
      }

      console.log('📊 Feldolgozott kategóriák:', processedCategories);

      // Étkezések feldolgozása - javított mapping ékezetekkel
      const mealTypeMapping = {
        'reggeli': 'reggeli',
        'tízórai': 'tízórai', // Javítva: "tizórai" helyett "tízórai"
        'ebéd': 'ebed',
        'leves': 'leves',
        'uzsonna': 'uzsonna',
        'vacsora': 'vacsora'
      };

      const processedMealTypeRecipes: Record<string, string[]> = {};
      
      console.log('🔍 ÉTKEZÉS DEBUG - Nyers mealTypesData:', mealTypesData);
      
      if (mealTypesData && mealTypesData.length > 0) {
        mealTypesData.forEach((row, index) => {
          console.log(`🔍 ÉTKEZÉS DEBUG - Sor ${index}:`, row);
          
          Object.keys(mealTypeMapping).forEach(displayMealType => {
            const internalKey = mealTypeMapping[displayMealType as keyof typeof mealTypeMapping];
            
            // Keressük meg a megfelelő oszlopot - javított keresés
            let columnName = Object.keys(row).find(key => {
              const normalizedKey = normalizeText(key);
              const normalizedSearchKey = normalizeText(displayMealType);
              console.log(`🔍 Oszlop keresés: "${key}" (${normalizedKey}) vs "${displayMealType}" (${normalizedSearchKey})`);
              return normalizedKey === normalizedSearchKey;
            });

            console.log(`🔍 ${displayMealType} DEBUG - Keresett oszlop: ${columnName}, érték: ${row[columnName || '']}`);
            
            if (columnName && row[columnName]) {
              const cellValue = row[columnName];
              if (typeof cellValue === 'string' && cellValue.trim() && 
                  cellValue !== 'EMPTY' && cellValue !== 'NULL') {
                
                // Ha X van a cellában, akkor a recept nevét a "Recept Neve" oszlopból vesszük
                if (cellValue.trim().toUpperCase() === 'X' && row['Recept Neve']) {
                  const recipeName = row['Recept Neve'];
                  if (!processedMealTypeRecipes[internalKey]) {
                    processedMealTypeRecipes[internalKey] = [];
                  }
                  if (!processedMealTypeRecipes[internalKey].includes(recipeName)) {
                    processedMealTypeRecipes[internalKey].push(recipeName);
                    console.log(`🔍 ${displayMealType} DEBUG - Hozzáadva recept: ${recipeName}`);
                  }
                }
              }
            }
          });
        });
      }

      console.log('🍽️ Feldolgozott étkezési típusok receptekkel:', processedMealTypeRecipes);

      // Meal types objektum létrehozása - display nevek
      const processedMealTypes: MealTypeData = {};
      Object.keys(mealTypeMapping).forEach(displayName => {
        const internalKey = mealTypeMapping[displayName as keyof typeof mealTypeMapping];
        if (processedMealTypeRecipes[internalKey] && processedMealTypeRecipes[internalKey].length > 0) {
          processedMealTypes[displayName] = processedMealTypeRecipes[internalKey];
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
    console.log(`🔍 getRecipesByMealType hívva: ${mealType}`);
    
    // Javított mapping a megfelelő belső kulcsra
    const mealTypeMapping: Record<string, string> = {
      'reggeli': 'reggeli',
      'tízórai': 'tízórai', // Javítva
      'ebéd': 'ebed',
      'leves': 'leves',
      'uzsonna': 'uzsonna',
      'vacsora': 'vacsora'
    };
    
    const mealTypeKey = mealTypeMapping[mealType.toLowerCase()] || mealType.toLowerCase();
    const recipeNames = mealTypeRecipes[mealTypeKey] || [];
    
    console.log(`🔍 ${mealType} engedélyezett receptnevek (${mealTypeKey}):`, recipeNames);
    
    const foundRecipes = recipes.filter(recipe => 
      recipeNames.some(allowedName => {
        if (!recipe['Recept_Neve'] || !allowedName) return false;
        
        const recipeName = normalizeText(recipe['Recept_Neve']);
        const allowedNameNormalized = normalizeText(allowedName);
        
        return recipeName === allowedNameNormalized ||
               recipeName.includes(allowedNameNormalized) ||
               allowedNameNormalized.includes(recipeName);
      })
    );
    
    console.log(`🔍 ${mealType} talált receptek:`, foundRecipes.length, 'db');
    console.log(`🔍 ${mealType} receptek részletei:`, foundRecipes.map(r => r['Recept_Neve']));
    
    return foundRecipes;
  };

  const getRecipesByCategory = (category: string, ingredient?: string, mealType?: string): SupabaseRecipe[] => {
    console.log(`🔍 SZIGORÚ szűrés - Kategória: ${category}, Alapanyag: ${ingredient}, Étkezési típus: ${mealType}`);
    
    if (!mealType) {
      console.log('❌ Nincs étkezési típus megadva');
      return [];
    }

    // Javított mapping a megfelelő belső kulcsra
    const mealTypeMapping: Record<string, string> = {
      'reggeli': 'reggeli',
      'tízórai': 'tízórai', // Javítva
      'ebéd': 'ebed',
      'leves': 'leves',
      'uzsonna': 'uzsonna',
      'vacsora': 'vacsora'
    };

    const mealTypeKey = mealTypeMapping[mealType.toLowerCase()] || mealType.toLowerCase();

    // 1. LÉPÉS: Étkezési típus alapján szűrés
    const allowedRecipeNames = mealTypeRecipes[mealTypeKey] || [];
    console.log(`📋 Engedélyezett receptek ${mealType}-hoz (${mealTypeKey}):`, allowedRecipeNames);

    if (allowedRecipeNames.length === 0) {
      console.log('❌ Nincs recept ehhez az étkezési típushoz');
      return [];
    }

    // 2. LÉPÉS: Receptek szűrése étkezési típus alapján
    const mealTypeFilteredRecipes = recipes.filter(recipe => {
      if (!recipe['Recept_Neve']) return false;
      
      return allowedRecipeNames.some(allowedName => {
        const recipeName = normalizeText(recipe['Recept_Neve']);
        const allowedNameNormalized = normalizeText(allowedName);
        
        return recipeName === allowedNameNormalized ||
               recipeName.includes(allowedNameNormalized) ||
               allowedNameNormalized.includes(recipeName);
      });
    });

    console.log(`📋 Étkezési típus alapján szűrt receptek:`, mealTypeFilteredRecipes.length);

    // Ha konkrét alapanyag nincs megadva, csak kategória alapján szűrünk
    if (!ingredient) {
      // 3. LÉPÉS: Kategória alapú szűrés
      const categoryIngredients = categories[category] || [];
      console.log(`🥕 Kategória alapanyagok (${category}):`, categoryIngredients);

      if (categoryIngredients.length === 0) {
        console.log('❌ Nincs alapanyag ehhez a kategóriához');
        return [];
      }

      const categoryFilteredRecipes = mealTypeFilteredRecipes.filter(recipe => {
        const allIngredients = [
          recipe['Hozzavalo_1'], recipe['Hozzavalo_2'], recipe['Hozzavalo_3'],
          recipe['Hozzavalo_4'], recipe['Hozzavalo_5'], recipe['Hozzavalo_6'],
          recipe['Hozzavalo_7'], recipe['Hozzavalo_8'], recipe['Hozzavalo_9'],
          recipe['Hozzavalo_10'], recipe['Hozzavalo_11'], recipe['Hozzavalo_12'],
          recipe['Hozzavalo_13'], recipe['Hozzavalo_14'], recipe['Hozzavalo_15'],
          recipe['Hozzavalo_16'], recipe['Hozzavalo_17'], recipe['Hozzavalo_18']
        ].filter(Boolean);

        const hasCategory = categoryIngredients.some(categoryIngredient =>
          allIngredients.some(ing => 
            ing && (
              normalizeText(ing).includes(normalizeText(categoryIngredient)) ||
              normalizeText(categoryIngredient).includes(normalizeText(ing))
            )
          )
        );

        return hasCategory;
      });

      console.log(`✅ Végeredmény (kategória ${category}, ${mealType}):`, categoryFilteredRecipes.length, 'db');
      return categoryFilteredRecipes;
    }

    // 4. LÉPÉS: SZIGORÚ specifikus alapanyag szűrés
    const finalFilteredRecipes = mealTypeFilteredRecipes.filter(recipe => {
      const allIngredients = [
        recipe['Hozzavalo_1'], recipe['Hozzavalo_2'], recipe['Hozzavalo_3'],
        recipe['Hozzavalo_4'], recipe['Hozzavalo_5'], recipe['Hozzavalo_6'],
        recipe['Hozzavalo_7'], recipe['Hozzavalo_8'], recipe['Hozzavalo_9'],
        recipe['Hozzavalo_10'], recipe['Hozzavalo_11'], recipe['Hozzavalo_12'],
        recipe['Hozzavalo_13'], recipe['Hozzavalo_14'], recipe['Hozzavalo_15'],
        recipe['Hozzavalo_16'], recipe['Hozzavalo_17'], recipe['Hozzavalo_18']
      ].filter(Boolean);

      const hasSpecificIngredient = allIngredients.some(ing => {
        if (!ing) return false;
        
        const ingredientNormalized = normalizeText(ing);
        const searchIngredientNormalized = normalizeText(ingredient);
        
        return ingredientNormalized.includes(searchIngredientNormalized) || 
               searchIngredientNormalized.includes(ingredientNormalized);
      });

      return hasSpecificIngredient;
    });

    console.log(`✅ SZIGORÚ szűrés végeredménye (${ingredient} alapanyag, ${mealType}):`, finalFilteredRecipes.length, 'db');
    finalFilteredRecipes.forEach(recipe => {
      console.log(`✅ Talált recept: ${recipe['Recept_Neve']}`);
    });

    return finalFilteredRecipes;
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
