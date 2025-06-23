
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { MealTypeCardSelector } from "./MealTypeCardSelector";
import { IngredientSelectionSection } from "./IngredientSelectionSection";
import { MealPlanGenerationButton } from "./MealPlanGenerationButton";
import { DailyMealHeader } from "./DailyMealHeader";
import { GeneratedMealPlan } from "./GeneratedMealPlan";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useMealPlanGeneration } from "@/hooks/useMealPlanGeneration";

interface DailyMealPlannerProps {
  user: any;
  onToggleSingleRecipe: () => void;
}

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

interface MealIngredients {
  [mealType: string]: SelectedIngredient[];
}

export function DailyMealPlanner({ user, onToggleSingleRecipe }: DailyMealPlannerProps) {
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [showIngredientSelection, setShowIngredientSelection] = useState(false);
  const [currentMealIngredients, setCurrentMealIngredients] = useState<MealIngredients>({});

  const {
    categories,
    getRecipesByMealType,
    getFilteredIngredients,
    loading,
    getFavoriteForIngredient,
    convertToStandardRecipe,
    userPreferences
  } = useSupabaseData(user?.id);

  const {
    generatedRecipes,
    isGenerating,
    handleGetMultipleCategoryRecipes
  } = useMealPlanGeneration({
    selectedMeals,
    getRecipesByMealType,
    convertToStandardRecipe
  });

  // EGYSZERŰ meal toggle - csak state frissítés, SEMMI automatikus generálás
  const handleMealToggle = (mealKey: string) => {
    console.log('🔄 Meal toggle - CSAK state frissítés:', mealKey);
    
    setSelectedMeals(prev => {
      const newSelectedMeals = prev.includes(mealKey) 
        ? prev.filter(m => m !== mealKey)
        : [...prev, mealKey];
      
      console.log('✅ Új selectedMeals state:', newSelectedMeals);
      
      // Alapanyag szűrő megjelenítése ha van kiválasztott étkezés
      setShowIngredientSelection(newSelectedMeals.length > 0);
      
      return newSelectedMeals;
    });
  };

  const getRecipeCount = (mealType: string) => {
    const recipes = getRecipesByMealType(mealType);
    return recipes ? recipes.length : 0;
  };

  const handleMealIngredientsChange = (mealIngredients: MealIngredients) => {
    console.log('🔄 Meal ingredients változás - CSAK state frissítés:', mealIngredients);
    setCurrentMealIngredients(mealIngredients);
  };

  // MANUÁLIS étrend generálás - csak gombnyomásra
  const handleGenerateMealPlan = async () => {
    console.log('🎯 MANUÁLIS étrend generálás indítása:', {
      selectedMeals,
      currentMealIngredients
    });
    
    if (selectedMeals.length === 0) {
      console.log('❌ Nincs kiválasztott étkezés');
      return;
    }
    
    await handleGetMultipleCategoryRecipes(currentMealIngredients);
  };

  // Preferencia keresés függvény
  const getPreferenceForIngredient = (ingredient: string, category: string): 'like' | 'dislike' | 'neutral' => {
    const preference = userPreferences.find(pref => 
      pref.ingredient.toLowerCase() === ingredient.toLowerCase() &&
      pref.category.toLowerCase() === category.toLowerCase()
    );
    return preference ? preference.preference : 'neutral';
  };

  // Transform categories to match FoodData interface
  const foodData = {
    mealTypes: selectedMeals.reduce((acc, mealType) => {
      acc[mealType] = {
        categories: categories
      };
      return acc;
    }, {} as { [key: string]: { categories: { [key: string]: string[] } } }),
    categories: categories,
    getFilteredIngredients: getFilteredIngredients,
    getRecipesByMealType: getRecipesByMealType
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-3 sm:mb-4 text-purple-500" />
          <p className="text-gray-600 text-sm sm:text-base">Adatok betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-8 max-w-6xl mx-auto p-2 sm:p-6">
      <DailyMealHeader onToggleSingleRecipe={onToggleSingleRecipe} />

      <MealTypeCardSelector
        selectedMeals={selectedMeals}
        onMealToggle={handleMealToggle}
        getRecipeCount={getRecipeCount}
      />

      <IngredientSelectionSection
        showIngredientSelection={showIngredientSelection}
        selectedMeals={selectedMeals}
        foodData={foodData}
        onMealIngredientsChange={handleMealIngredientsChange}
        getFavoriteForIngredient={getFavoriteForIngredient}
        getPreferenceForIngredient={getPreferenceForIngredient}
      />

      <MealPlanGenerationButton
        selectedMeals={selectedMeals}
        selectedIngredients={Object.values(currentMealIngredients).flat()}
        isGenerating={isGenerating}
        onGenerateMealPlan={handleGenerateMealPlan}
      />

      <GeneratedMealPlan generatedRecipes={generatedRecipes} user={user} />
    </div>
  );
}
