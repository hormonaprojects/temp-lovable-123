
import { useState, useEffect } from "react";
import { MealTypeSelector } from "./MealTypeSelector";
import { SharedIngredientSelector } from "./shared/SharedIngredientSelector";
import { RecipeDisplay } from "./RecipeDisplay";
import { MultiDayMealPlanGenerator } from "./MultiDayMealPlanGenerator";
import { DailyMealPlanner } from "./DailyMealPlanner";
import { FunctionSelector } from "./FunctionSelector";
import { Recipe } from "@/types/recipe";
import { useLazySupabaseData } from "@/hooks/useLazySupabaseData";
import { LoadingChef } from "@/components/ui/LoadingChef";
import { filterRecipesByMultipleIngredients } from "@/services/recipeFilters";

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

interface MealIngredients {
  [mealType: string]: SelectedIngredient[];
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
  const [showIngredientSelection, setShowIngredientSelection] = useState(false);
  const [mealIngredients, setMealIngredients] = useState<MealIngredients>({});
  const [lastSearchParams, setLastSearchParams] = useState<{
    category: string;
    ingredient: string;
    mealType: string;
  }>({ category: "", ingredient: "", mealType: "" });
  
  const { 
    categories, 
    mealTypes, 
    loading: dataLoading,
    isInitialized,
    loadBasicData,
    loadUserPreferences,
    loadUserFavorites,
    getRecipesByMealType,
    getRecipesByCategory,
    getRandomRecipe,
    getFilteredIngredients,
    convertToStandardRecipe,
    getFavoriteForIngredient,
    getPreferenceForIngredient
  } = useLazySupabaseData(user.id);

  // Alapvető adatok betöltése amikor a komponens mountálódik
  useEffect(() => {
    loadBasicData();
  }, [loadBasicData]);

  // User specifikus adatok betöltése
  useEffect(() => {
    if (user?.id && isInitialized) {
      console.log('🔄 User adatok betöltése...');
      loadUserPreferences();
      loadUserFavorites();
    }
  }, [user?.id, isInitialized, loadUserPreferences, loadUserFavorites]);

  // AUTOMATIKUS receptgenerálás amikor meal type változik
  useEffect(() => {
    if (selectedMealType && !showIngredientSelection && isInitialized) {
      console.log('🎯 Meal type változott, automatikus receptgenerálás:', selectedMealType);
      handleAutoGenerateRecipe();
    }
  }, [selectedMealType, isInitialized]);

  const handleAutoGenerateRecipe = async () => {
    if (!selectedMealType) return;
    
    setIsLoading(true);
    setCurrentRecipe(null);
    
    try {
      console.log('🔍 AUTOMATIKUS recept generálás preferenciákkal:', selectedMealType);
      
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500));
      
      const foundRecipes = await getRecipesByMealType(selectedMealType);
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

  const getMultipleCategoryRecipes = async (mealIngredients: MealIngredients) => {
    if (!selectedMealType) {
      console.log('❌ Hiányzó meal type:', { selectedMealType });
      return;
    }

    const selectedIngredients = mealIngredients[selectedMealType] || [];
    if (selectedIngredients.length === 0) {
      console.log('❌ Nincs kiválasztott alapanyag');
      return;
    }

    setIsLoading(true);
    setCurrentRecipe(null);
    
    const ingredientsText = selectedIngredients.map(ing => `${ing.ingredient} (${ing.category})`).join(", ");
    setLastSearchParams({ category: "Több kategória", ingredient: ingredientsText, mealType: selectedMealType });

    try {
      console.log('🔍 TÖBB KATEGÓRIÁS alapanyaggal recept keresése:', { selectedMealType, selectedIngredients });
      
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
      
      const mealTypeRecipes = await getRecipesByMealType(selectedMealType);
      console.log(`📋 ${selectedMealType} étkezéshez tartozó receptek:`, mealTypeRecipes.length);
      
      if (mealTypeRecipes.length === 0) {
        console.log(`❌ Nincs recept "${selectedMealType}" étkezéshez`);
        await minLoadingTime;
        return;
      }
      
      const ingredientNames = selectedIngredients.map(ing => ing.ingredient);
      console.log('🎯 Keresett alapanyagok:', ingredientNames);
      
      const validRecipes = filterRecipesByMultipleIngredients(mealTypeRecipes, ingredientNames);
      console.log(`✅ Talált receptek: ${validRecipes.length} db`);

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

  const handleGenerateSimilar = async () => {
    console.log('🔄 Hasonló recept generálása ugyanazokkal a paraméterekkel...');
    
    if (showIngredientSelection && Object.keys(mealIngredients).length > 0) {
      await getMultipleCategoryRecipes(mealIngredients);
    } else {
      await regenerateRecipe();
    }
  };

  const regenerateRecipe = async () => {
    if (selectedMealType) {
      setIsLoading(true);
      setCurrentRecipe(null);
      
      try {
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🔄 SZIGORÚ újragenerálás ugyanazokkal a paraméterekkel (preferenciákkal):', lastSearchParams);
        
        let foundRecipes = [];
        
        if (lastSearchParams.category && lastSearchParams.ingredient) {
          foundRecipes = await getRecipesByCategory(lastSearchParams.category, lastSearchParams.ingredient, selectedMealType);
        } else if (lastSearchParams.category) {
          foundRecipes = await getRecipesByCategory(lastSearchParams.category, undefined, selectedMealType);
        } else {
          foundRecipes = await getRecipesByMealType(selectedMealType);
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
    setViewMode('single');
    setShowIngredientSelection(false);
    setMealIngredients({});
    setLastSearchParams({ category: "", ingredient: "", mealType: "" });
  };

  // Csak alapvető betöltés esetén mutassuk a loading screent
  if (dataLoading && !isInitialized) {
    return <LoadingChef />;
  }

  const handleMealTypeSelect = (mealType: string) => {
    console.log('🎯 Meal type kiválasztás (SingleRecipeApp):', mealType);
    setSelectedMealType(mealType);
    setShowIngredientSelection(false);
    setCurrentRecipe(null);
    setMealIngredients({});
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
        <MultiDayMealPlanGenerator user={user} />
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
            foodData={{
              mealTypes: Object.keys(mealTypes).reduce((acc, key) => {
                acc[key] = { categories: categories };
                return acc;
              }, {} as { [key: string]: { categories: { [key: string]: string[] } } }),
              categories: categories,
              getFilteredIngredients: getFilteredIngredients,
              getRecipesByMealType: async (mealType: string) => {
                const recipes = await getRecipesByMealType(mealType);
                return { length: recipes.length };
              }
            }}
            onGetRandomRecipe={handleGetRandomRecipe}
            onShowMultiCategorySelection={handleShowIngredientSelection}
          />

          {selectedMealType && showIngredientSelection && (
            <SharedIngredientSelector
              selectedMeals={[selectedMealType]}
              categories={categories}
              getFilteredIngredients={getFilteredIngredients}
              getFavoriteForIngredient={(ingredient: string, category?: string) => {
                console.log('🔍 SingleRecipeApp - Shared kedvenc ellenőrzés:', { ingredient, category });
                const result = getFavoriteForIngredient(ingredient, category || '');
                console.log('✅ SingleRecipeApp - Shared kedvenc eredmény:', result);
                return result;
              }}
              getPreferenceForIngredient={(ingredient: string, category?: string) => {
                console.log('🔍 SingleRecipeApp - Shared preferencia ellenőrzés:', { ingredient, category });
                const result = getPreferenceForIngredient(ingredient, category || '');
                console.log('✅ SingleRecipeApp - Shared preferencia eredmény:', result);
                return result;
              }}
              onMealIngredientsChange={setMealIngredients}
              initialMealIngredients={mealIngredients}
              title="Alapanyag szűrés (opcionális)"
            />
          )}

          {selectedMealType && showIngredientSelection && Object.keys(mealIngredients).length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => getMultipleCategoryRecipes(mealIngredients)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                🎯 Recept generálása kiválasztott alapanyagokkal
              </button>
            </div>
          )}

          <RecipeDisplay
            recipe={currentRecipe}
            isLoading={isLoading}
            onRegenerate={regenerateRecipe}
            onNewRecipe={resetForm}
            onGenerateSimilar={handleGenerateSimilar}
            user={user}
          />
        </>
      )}
    </div>
  );
}
