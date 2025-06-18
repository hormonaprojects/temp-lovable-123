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

      // Étkezések feldolgozása - EGYSZERŰSÍTETT logika a pontos oszlopnevek használatával
      const processedMealTypeRecipes: Record<string, string[]> = {};
      
      console.log('🔍 ÉTKEZÉS DEBUG - Nyers mealTypesData:', mealTypesData);
      
      if (mealTypesData && mealTypesData.length > 0) {
        mealTypesData.forEach((row, index) => {
          console.log(`🔍 ÉTKEZÉS DEBUG - Sor ${index}:`, row);
          
          // Az összes oszlopot végignézzük és egyszerűen az oszlopnév alapján mappelünk
          Object.keys(row).forEach(columnName => {
            const cellValue = row[columnName];
            console.log(`🔍 Oszlop: "${columnName}", érték: "${cellValue}"`);
            
            // Ha X van a cellában és van recept név
            if (cellValue === 'X' && row['Recept Neve']) {
              const recipeName = row['Recept Neve'];
              
              // EGYSZERŰ mapping - pontosan az oszlopnév alapján
              let mealTypeKey = '';
              
              // Pontos oszlopnév -> belső kulcs mapping
              switch (columnName) {
                case 'Reggeli':
                  mealTypeKey = 'reggeli';
                  break;
                case 'Tízórai':
                  mealTypeKey = 'tízórai';  // Pontosan ahogy az adatbázisban van!
                  break;
                case 'Ebéd':
                  mealTypeKey = 'ebed';
                  break;
                case 'Leves':
                  mealTypeKey = 'leves';
                  break;
                case 'Uzsonna':
                  mealTypeKey = 'uzsonna';
                  break;
                case 'Vacsora':
                  mealTypeKey = 'vacsora';
                  break;
              }
              
              if (mealTypeKey) {
                if (!processedMealTypeRecipes[mealTypeKey]) {
                  processedMealTypeRecipes[mealTypeKey] = [];
                }
                if (!processedMealTypeRecipes[mealTypeKey].includes(recipeName)) {
                  processedMealTypeRecipes[mealTypeKey].push(recipeName);
                  console.log(`✅ ${columnName} -> ${mealTypeKey} - Hozzáadva recept: ${recipeName}`);
                }
              }
            }
          });
        });
      }

      console.log('🍽️ Feldolgozott étkezési típusok receptekkel:', processedMealTypeRecipes);

      // Meal types objektum létrehozása - EGYSZERŰ mapping
      const processedMealTypes: MealTypeData = {};
      
      // Egyszerű átmásolás
      Object.keys(processedMealTypeRecipes).forEach(mealTypeKey => {
        if (processedMealTypeRecipes[mealTypeKey] && processedMealTypeRecipes[mealTypeKey].length > 0) {
          processedMealTypes[mealTypeKey] = processedMealTypeRecipes[mealTypeKey];
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
    
    // EGYSZERŰ kulcs használat
    const recipeNames = mealTypeRecipes[mealType] || [];
    
    console.log(`🔍 ${mealType} engedélyezett receptnevek:`, recipeNames);
    
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

    // 1. LÉPÉS: Étkezési típus alapján szűrés - EGYSZERŰ kulcs használat
    const allowedRecipeNames = mealTypeRecipes[mealType] || [];
    console.log(`📋 Engedélyezett receptek ${mealType}-hoz:`, allowedRecipeNames);

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

    // ... keep existing code (category and ingredient filtering logic)

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
