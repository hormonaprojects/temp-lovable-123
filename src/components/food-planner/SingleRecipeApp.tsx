
import { useState, useEffect } from "react";
import { MealTypeSelector } from "./MealTypeSelector";
import { MultiCategoryIngredientSelector } from "./MultiCategoryIngredientSelector";
import { RecipeDisplay } from "./RecipeDisplay";
import { MultiDayMealPlanGenerator } from "./MultiDayMealPlanGenerator";
import { DailyMealPlanner } from "./DailyMealPlanner";
import { FunctionSelector } from "./FunctionSelector";
import { Recipe } from "@/types/recipe";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { LoadingChef } from "@/components/ui/LoadingChef";

interface MultiDayMealPlan {
  day: number;
  date: string;
  meals: {
    [mealType: string]: Recipe | null;
  };
}

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

interface SingleRecipeAppProps {
  user: any;
  onToggleDailyPlanner: () => void;
}

export function SingleRecipeApp({ user, onToggleDailyPlanner }: SingleRecipeAppProps) {
  const [selectedMealType, setSelectedMealType] = useState("");
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'daily' | 'multi'>('single');
  const [multiDayPlan, setMultiDayPlan] = useState<MultiDayMealPlan[]>([]);
  const [isMultiDayLoading, setIsMultiDayLoading] = useState(false);
  const [showIngredientSelection, setShowIngredientSelection] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState<{
    category: string;
    ingredient: string;
    mealType: string;
  }>({ category: "", ingredient: "", mealType: "" });
  
  const { 
    categories, 
    mealTypes, 
    loading: dataLoading, 
    getRecipesByMealType,
    getRecipesByCategory,
    getRandomRecipe,
    getFilteredIngredients,
    convertToStandardRecipe,
    getFavoriteForIngredient,
    refreshFavorites,
    recipes
  } = useSupabaseData(user.id);

  // Kedvencek újratöltése amikor a komponens mountálódik
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Kedvencek újratöltése SingleRecipeApp-ben...');
      refreshFavorites();
    }
  }, [user?.id, refreshFavorites]);

  // AUTOMATIKUS receptgenerálás amikor meal type változik
  useEffect(() => {
    if (selectedMealType && !showIngredientSelection) {
      console.log('🎯 Meal type változott, automatikus receptgenerálás:', selectedMealType);
      handleAutoGenerateRecipe();
    }
  }, [selectedMealType]);

  const handleAutoGenerateRecipe = async () => {
    if (!selectedMealType) return;
    
    setIsLoading(true);
    setCurrentRecipe(null);
    
    try {
      console.log('🔍 AUTOMATIKUS recept generálás preferenciákkal:', selectedMealType);
      
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
      
      const foundRecipes = getRecipesByMealType(selectedMealType);
      console.log(`🎯 Automatikus keresés eredménye: ${foundRecipes.length} recept`);

      await minLoadingTime;

      if (foundRecipes.length > 0) {
        const randomIndex = Math.floor(Math.random() * foundRecipes.length);
        const selectedSupabaseRecipe = foundRecipes[randomIndex];
        const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
        
        setCurrentRecipe(standardRecipe);
        setLastSearchParams({ category: "", ingredient: "", mealType: selectedMealType });
        
        console.log(`✅ Recept betöltve: ${standardRecipe.név} (preferenciáiddal)`);
      } else {
        console.log(`❌ Nincs recept "${selectedMealType}" étkezéshez (preferenciáid szerint)`);
      }

    } catch (error) {
      console.error('❌ Hiba az automatikus recept generálásakor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMultipleCategoryRecipes = async (selectedIngredients: SelectedIngredient[]) => {
    if (!selectedMealType || selectedIngredients.length === 0) return;

    setIsLoading(true);
    setCurrentRecipe(null);
    
    const ingredientsText = selectedIngredients.map(ing => `${ing.ingredient} (${ing.category})`).join(", ");
    setLastSearchParams({ category: "Több kategória", ingredient: ingredientsText, mealType: selectedMealType });

    try {
      console.log('🔍 TÖBB KATEGÓRIÁS alapanyaggal recept keresése:', { selectedMealType, selectedIngredients });
      
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 3000));
      
      // JAVÍTOTT logika: olyan recepteket keresünk, amelyek MINDEN kiválasztott alapanyagot tartalmazzák
      const mealTypeRecipes = getRecipesByMealType(selectedMealType);
      console.log(`📋 ${selectedMealType} étkezéshez tartozó receptek:`, mealTypeRecipes.length);
      
      // Ellenőrizzük minden receptet, hogy tartalmazza-e az ÖSSZES kiválasztott alapanyagot
      const getAllRecipeIngredients = (recipe: any): string[] => {
        return [
          recipe['Hozzavalo_1'], recipe['Hozzavalo_2'], recipe['Hozzavalo_3'],
          recipe['Hozzavalo_4'], recipe['Hozzavalo_5'], recipe['Hozzavalo_6'],
          recipe['Hozzavalo_7'], recipe['Hozzavalo_8'], recipe['Hozzavalo_9'],
          recipe['Hozzavalo_10'], recipe['Hozzavalo_11'], recipe['Hozzavalo_12'],
          recipe['Hozzavalo_13'], recipe['Hozzavalo_14'], recipe['Hozzavalo_15'],
          recipe['Hozzavalo_16'], recipe['Hozzavalo_17'], recipe['Hozzavalo_18']
        ].filter(Boolean).map(ing => ing?.toString() || '');
      };

      const normalizeText = (text: string): string => {
        return text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, '')
          .trim();
      };

      const hasIngredient = (recipeIngredients: string[], searchIngredient: string): boolean => {
        const searchNormalized = normalizeText(searchIngredient);
        return recipeIngredients.some(recipeIng => {
          const recipeIngNormalized = normalizeText(recipeIng);
          return recipeIngNormalized.includes(searchNormalized) || searchNormalized.includes(recipeIngNormalized);
        });
      };

      const validRecipes = mealTypeRecipes.filter(recipe => {
        const recipeIngredients = getAllRecipeIngredients(recipe);
        console.log(`\n🔍 Recept vizsgálata: ${recipe['Recept_Neve']}`);
        console.log(`📝 Hozzávalók:`, recipeIngredients);
        
        // Ellenőrizzük, hogy MINDEN kiválasztott alapanyag szerepel-e a receptben
        const hasAllIngredients = selectedIngredients.every(selectedIng => {
          const found = hasIngredient(recipeIngredients, selectedIng.ingredient);
          console.log(`${found ? '✅' : '❌'} "${selectedIng.ingredient}" ${found ? 'MEGTALÁLVA' : 'HIÁNYZIK'}`);
          return found;
        });
        
        if (hasAllIngredients) {
          console.log(`✅ ✅ ✅ ELFOGADVA: "${recipe['Recept_Neve']}" TARTALMAZZA az ÖSSZES kiválasztott alapanyagot!`);
        } else {
          console.log(`❌ ❌ ❌ ELUTASÍTVA: "${recipe['Recept_Neve']}" NEM tartalmazza az összes alapanyagot!`);
        }
        
        return hasAllIngredients;
      });

      await minLoadingTime;

      if (validRecipes.length > 0) {
        const randomIndex = Math.floor(Math.random() * validRecipes.length);
        const selectedSupabaseRecipe = validRecipes[randomIndex];
        const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
        
        setCurrentRecipe(standardRecipe);
        
        console.log(`✅ SIKERES TALÁLAT: "${standardRecipe.név}" receptben minden alapanyag megtalálható!`);
      } else {
        console.log('❌ NINCS OLYAN RECEPT, ami minden kiválasztott alapanyagot tartalmazná!');
      }

    } catch (error) {
      console.error('❌ Hiba a több kategóriás recept kérésekor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMultiDayPlan = async (days: number): Promise<MultiDayMealPlan[]> => {
    setIsMultiDayLoading(true);
    
    try {
      const mealTypesArray = ['reggeli', 'ebéd', 'vacsora'];
      const newPlan: MultiDayMealPlan[] = [];
      
      for (let day = 1; day <= days; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day - 1);
        const formattedDate = date.toLocaleDateString('hu-HU');
        
        const dayPlan: MultiDayMealPlan = {
          day,
          date: formattedDate,
          meals: {}
        };
        
        for (const mealType of mealTypesArray) {
          const foundRecipes = getRecipesByMealType(mealType);
          if (foundRecipes.length > 0) {
            const randomIndex = Math.floor(Math.random() * foundRecipes.length);
            const selectedSupabaseRecipe = foundRecipes[randomIndex];
            const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
            dayPlan.meals[mealType] = standardRecipe;
          } else {
            dayPlan.meals[mealType] = null;
          }
        }
        
        newPlan.push(dayPlan);
      }
      
      setMultiDayPlan(newPlan);
      
      console.log(`✅ ${days} napos étrend sikeresen elkészült`);
      
      return newPlan;
      
    } catch (error) {
      console.error('❌ Hiba a többnapos étrend generálásakor:', error);
      return [];
    } finally {
      setIsMultiDayLoading(false);
    }
  };

  const regenerateRecipe = async () => {
    if (selectedMealType) {
      setIsLoading(true);
      setCurrentRecipe(null);
      
      try {
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🔄 SZIGORÚ újragenerálás ugyanazokkal a paraméterekkel (preferenciákkal):', lastSearchParams);
        
        let foundRecipes = [];
        
        if (lastSearchParams.category && lastSearchParams.ingredient) {
          foundRecipes = getRecipesByCategory(lastSearchParams.category, lastSearchParams.ingredient, selectedMealType);
        } else if (lastSearchParams.category) {
          foundRecipes = getRecipesByCategory(lastSearchParams.category, undefined, selectedMealType);
        } else {
          foundRecipes = getRecipesByMealType(selectedMealType);
        }

        await minLoadingTime;

        if (foundRecipes.length > 0) {
          const randomIndex = Math.floor(Math.random() * foundRecipes.length);
          const selectedSupabaseRecipe = foundRecipes[randomIndex];
          const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
          
          setCurrentRecipe(standardRecipe);
          
          console.log(`✅ Új recept betöltve: ${standardRecipe.név} (preferenciáiddal)`);
        } else {
          let errorMessage = "";
          if (lastSearchParams.category && lastSearchParams.ingredient) {
            errorMessage = `Nincs több "${lastSearchParams.ingredient}" alapanyaggal recept "${selectedMealType}" étkezéshez a "${lastSearchParams.category}" kategóriában (preferenciáid szerint).`;
          } else if (lastSearchParams.category) {
            errorMessage = `Nincs több recept "${selectedMealType}" étkezéshez a "${lastSearchParams.category}" kategóriában (preferenciáid szerint).`;
          } else {
            errorMessage = `Nincs több recept "${selectedMealType}" étkezéshez (preferenciáid szerint).`;
          }
          
          console.log(`❌ ${errorMessage}`);
        }
      } catch (error) {
        console.error('❌ Hiba az újrageneráláskor:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetForm = () => {
    setSelectedMealType("");
    setCurrentRecipe(null);
    setMultiDayPlan([]);
    setViewMode('single');
    setShowIngredientSelection(false);
    setLastSearchParams({ category: "", ingredient: "", mealType: "" });
  };

  // Transform mealTypes to match FoodData interface
  const transformedMealTypes = Object.keys(m realTypes).reduce((acc, mealType) => {
    acc[mealType] = {
      categories: categories
    };
    return acc;
  }, {} as { [key: string]: { categories: { [key: string]: string[] } } });

  const foodData = {
    mealTypes: transformedMealTypes,
    categories: categories,
    getFilteredIngredients: getFilteredIngredients,
    getRecipesByMealType: getRecipesByMealType
  };

  console.log('🗂️ FoodData átadva komponenseknek:', foodData);

  if (dataLoading) {
    return <LoadingChef />;
  }

  const handleMealTypeSelect = (mealType: string) => {
    console.log('🎯 Meal type kiválasztás (SingleRecipeApp):', mealType);
    setSelectedMealType(mealType);
    setShowIngredientSelection(false);
    setCurrentRecipe(null);
  };

  const handleGetRandomRecipe = async () => {
    console.log('🎲 Manuális random recept kérés');
    if (selectedMealType) {
      setShowIngredientSelection(false);
      await handleAutoGenerateRecipe();
    }
  };

  const handleShowIngredientSelection = () => {
    setShowIngredientSelection(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6">
      {/* Compact Hero Section */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-3">🍽️ Ételtervező</h1>
          <p className="text-white/80 text-sm sm:text-lg md:text-xl px-2 leading-relaxed">
            Válassz funkciót és kezdd el az ételek tervezését!
          </p>
        </div>
      </div>

      {/* New Function Selector */}
      <FunctionSelector
        selectedFunction={viewMode}
        onFunctionSelect={setViewMode}
      />

      {viewMode === 'multi' ? (
        <MultiDayMealPlanGenerator
          onGeneratePlan={generateMultiDayPlan}
          isLoading={isMultiDayLoading}
          mealPlan={multiDayPlan}
        />
      ) : viewMode === 'daily' ? (
        <DailyMealPlanner
          user={user}
          onToggleSingleRecipe={() => setViewMode('single')}
        />
      ) : (
        <>
          <MealTypeSelector
            selectedMealType={selectedMealType}
            onSelectMealType={handleMealTypeSelect}
            foodData={foodData}
            onGetRandomRecipe={handleGetRandomRecipe}
            onShowMultiCategorySelection={handleShowIngredientSelection}
          />

          {selectedMealType && showIngredientSelection && (
            <MultiCategoryIngredientSelector
              selectedMealType={selectedMealType}
              foodData={foodData}
              onGetMultipleCategoryRecipes={getMultipleCategoryRecipes}
              getFavoriteForIngredient={(ingredient: string, category: string) => {
                console.log('🔍 SingleRecipeApp - Multi kategória kedvenc ellenőrzés:', { ingredient, category });
                const result = getFavoriteForIngredient(ingredient, category);
                console.log('✅ SingleRecipeApp - Multi kategória kedvenc eredmény:', result);
                return result;
              }}
            />
          )}

          <RecipeDisplay
            recipe={currentRecipe}
            isLoading={isLoading}
            onRegenerate={regenerateRecipe}
            onNewRecipe={resetForm}
            user={user}
          />
        </>
      )}
    </div>
  );
}
