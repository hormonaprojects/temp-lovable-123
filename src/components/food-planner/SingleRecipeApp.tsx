import { useState, useEffect } from "react";
import { MealTypeSelector } from "./MealTypeSelector";
import { RecipeDisplay } from "./RecipeDisplay";
import { MultiDayMealPlanGenerator } from "./MultiDayMealPlanGenerator";
import { DailyMealPlanner } from "./DailyMealPlanner";
import { FunctionSelector } from "./FunctionSelector";
import { Recipe } from "@/types/recipe";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { LoadingChef } from "@/components/ui/LoadingChef";
import { filterRecipesByMultipleIngredients } from "@/services/recipeFilters";
import { SharedIngredientSelector } from "./shared/SharedIngredientSelector";

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
  const [currentMealIngredients, setCurrentMealIngredients] = useState<MealIngredients>({});
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
    recipes,
    userPreferences
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

  const handleMealIngredientsChange = (mealIngredients: MealIngredients) => {
    setCurrentMealIngredients(mealIngredients);
  };

  const getPreferenceForIngredient = (ingredient: string, category: string): 'like' | 'dislike' | 'neutral' => {
    const preference = userPreferences.find(pref => 
      pref.ingredient.toLowerCase() === ingredient.toLowerCase() &&
      pref.category.toLowerCase() === category.toLowerCase()
    );
    return preference ? preference.preference : 'neutral';
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
      
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 3000));
      
      // 1. Lépés: Lekérjük az étkezési típusnak megfelelő recepteket
      const mealTypeRecipes = getRecipesByMealType(selectedMealType);
      console.log(`📋 ${selectedMealType} étkezéshez tartozó receptek:`, mealTypeRecipes.length);
      
      if (mealTypeRecipes.length === 0) {
        console.log(`❌ Nincs recept "${selectedMealType}" étkezéshez`);
        await minLoadingTime;
        return;
      }
      
      // 2. Lépés: Szűrjük a recepteket az alapanyagok alapján
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
    
    if (showIngredientSelection && lastSearchParams.category && lastSearchParams.ingredient) {
      // Ha van több kategóriás keresés, használjuk azt
      const ingredientsArray = lastSearchParams.ingredient.split(", ").map(item => {
        const match = item.match(/^(.+) \((.+)\)$/);
        if (match) {
          return { ingredient: match[1], category: match[2] };
        }
        return { ingredient: item, category: lastSearchParams.category };
      });
      
      await getMultipleCategoryRecipes(ingredientsArray);
    } else {
      // Egyszerű újragenerálás
      await regenerateRecipe();
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
    setViewMode('single');
    setShowIngredientSelection(false);
    setLastSearchParams({ category: "", ingredient: "", mealType: "" });
  };

  // Transform mealTypes to match FoodData interface
  const transformedMealTypes = Object.keys(mealTypes).reduce((acc, mealType) => {
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

  const handleGenerateWithIngredients = async () => {
    await getMultipleCategoryRecipes(currentMealIngredients);
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
              categories: categories,
              getFilteredIngredients: getFilteredIngredients,
              getRecipesByMealType: getRecipesByMealType
            }}
            onGetRandomRecipe={handleGetRandomRecipe}
            onShowMultiCategorySelection={handleShowIngredientSelection}
          />

          {selectedMealType && showIngredientSelection && (
            <SharedIngredientSelector
              selectedMeals={[selectedMealType]}
              categories={categories}
              getFilteredIngredients={getFilteredIngredients}
              getFavoriteForIngredient={getFavoriteForIngredient}
              getPreferenceForIngredient={getPreferenceForIngredient}
              onMealIngredientsChange={handleMealIngredientsChange}
              initialMealIngredients={currentMealIngredients}
              showIngredientSelection={showIngredientSelection}
              title="Alapanyag szűrés (opcionális)"
            />
          )}

          {selectedMealType && showIngredientSelection && Object.values(currentMealIngredients).flat().length > 0 && (
            <div className="mb-6 flex justify-center">
              <button
                onClick={handleGenerateWithIngredients}
                className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-700/90 hover:to-pink-700/90 backdrop-blur-sm border border-purple-300/20 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              >
                🎯 Recept generálása alapanyagokkal ({Object.values(currentMealIngredients).flat().length})
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
