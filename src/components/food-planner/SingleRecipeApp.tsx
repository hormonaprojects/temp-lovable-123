
import { useState, useEffect } from "react";
import { MealTypeSelector } from "./MealTypeSelector";
import { SharedIngredientSelector } from "./shared/SharedIngredientSelector";
import { RecipeDisplay } from "./RecipeDisplay";
import { MultiDayMealPlanGenerator } from "./MultiDayMealPlanGenerator";
import { DailyMealPlanner } from "./DailyMealPlanner";
import { FunctionSelector } from "./FunctionSelector";
import { useLazySupabaseData } from "@/hooks/useLazySupabaseData";
import { LoadingChef } from "@/components/ui/LoadingChef";
import { filterRecipesByMultipleIngredients } from "@/services/recipeFilters";
import { useRecipeGeneration } from "./hooks/useRecipeGeneration";

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
  const [viewMode, setViewMode] = useState<'single' | 'daily' | 'multi'>('single');
  const [showIngredientSelection, setShowIngredientSelection] = useState(false);
  const [mealIngredients, setMealIngredients] = useState<MealIngredients>({});
  
  const { 
    currentRecipe,
    isLoading,
    generateRecipe,
    regenerateRecipe,
    resetRecipe,
    setLastSearchParams
  } = useRecipeGeneration();
  
  const { 
    categories, 
    mealTypes, 
    loading: dataLoading,
    isInitialized,
    recipesLoaded,
    loadBasicData,
    loadRecipes,
    loadUserPreferences,
    loadUserFavorites,
    getRecipesByMealType,
    getRecipesByCategory,
    getFilteredIngredients,
    convertToStandardRecipe,
    getFavoriteForIngredient,
    getPreferenceForIngredient
  } = useLazySupabaseData(user.id);

  // Alapvető adatok betöltése
  useEffect(() => {
    loadBasicData();
  }, [loadBasicData]);

  // Receptek betöltése amikor a komponens mountálódik
  useEffect(() => {
    if (isInitialized && !recipesLoaded) {
      loadRecipes();
    }
  }, [isInitialized, recipesLoaded, loadRecipes]);

  // User adatok betöltése
  useEffect(() => {
    if (user?.id && isInitialized) {
      loadUserPreferences();
      loadUserFavorites();
    }
  }, [user?.id, isInitialized, loadUserPreferences, loadUserFavorites]);

  // Automatikus receptgenerálás
  useEffect(() => {
    if (selectedMealType && !showIngredientSelection && isInitialized && recipesLoaded) {
      generateRecipe(selectedMealType, getRecipesByMealType, convertToStandardRecipe);
    }
  }, [selectedMealType, isInitialized, recipesLoaded]);

  const getMultipleCategoryRecipes = async (mealIngredients: MealIngredients) => {
    if (!selectedMealType) return;

    const selectedIngredients = mealIngredients[selectedMealType] || [];
    if (selectedIngredients.length === 0) return;

    const ingredientsText = selectedIngredients.map(ing => `${ing.ingredient} (${ing.category})`).join(", ");
    setLastSearchParams({ category: "Több kategória", ingredient: ingredientsText, mealType: selectedMealType });

    try {
      const mealTypeRecipes = await getRecipesByMealType(selectedMealType);
      
      if (mealTypeRecipes.length === 0) return;
      
      const ingredientNames = selectedIngredients.map(ing => ing.ingredient);
      const validRecipes = filterRecipesByMultipleIngredients(mealTypeRecipes, ingredientNames);

      if (validRecipes.length > 0) {
        const randomIndex = Math.floor(Math.random() * validRecipes.length);
        const selectedSupabaseRecipe = validRecipes[randomIndex];
        const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
        
        // A currentRecipe-t a useRecipeGeneration hook-ban kellene kezelni, de itt közvetlenül használjuk
        // TODO: Refaktorálás a hook-ba
      }
    } catch (error) {
      console.error('Hiba a több kategóriás recept kérésekor:', error);
    }
  };

  const handleGenerateSimilar = async () => {
    if (showIngredientSelection && Object.keys(mealIngredients).length > 0) {
      await getMultipleCategoryRecipes(mealIngredients);
    } else {
      await regenerateRecipe(selectedMealType, getRecipesByMealType, getRecipesByCategory, convertToStandardRecipe);
    }
  };

  const resetForm = () => {
    setSelectedMealType("");
    setViewMode('single');
    setShowIngredientSelection(false);
    setMealIngredients({});
    resetRecipe();
  };

  if (dataLoading && !isInitialized) {
    return <LoadingChef />;
  }

  const handleMealTypeSelect = (mealType: string) => {
    setSelectedMealType(mealType);
    setShowIngredientSelection(false);
    setMealIngredients({});
  };

  const handleGetRandomRecipe = async () => {
    if (selectedMealType) {
      setShowIngredientSelection(false);
      await generateRecipe(selectedMealType, getRecipesByMealType, convertToStandardRecipe);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6">
      {/* Hero Section */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-3">🍽️ Ételtervező</h1>
          <p className="text-white/80 text-sm sm:text-lg md:text-xl px-2 leading-relaxed">
            Válassz funkciót és kezdd el az ételek tervezését!
          </p>
        </div>
      </div>

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
            onShowMultiCategorySelection={() => setShowIngredientSelection(true)}
          />

          {selectedMealType && showIngredientSelection && (
            <SharedIngredientSelector
              selectedMeals={[selectedMealType]}
              categories={categories}
              getFilteredIngredients={getFilteredIngredients}
              getFavoriteForIngredient={getFavoriteForIngredient}
              getPreferenceForIngredient={getPreferenceForIngredient}
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
            onRegenerate={() => regenerateRecipe(selectedMealType, getRecipesByMealType, getRecipesByCategory, convertToStandardRecipe)}
            onNewRecipe={resetForm}
            onGenerateSimilar={handleGenerateSimilar}
            user={user}
          />
        </>
      )}
    </div>
  );
}
