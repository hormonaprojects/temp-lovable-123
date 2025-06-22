
import { useState, useEffect } from "react";
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

export function DailyMealPlanner({ user, onToggleSingleRecipe }: DailyMealPlannerProps) {
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [showIngredientSelection, setShowIngredientSelection] = useState(false);

  const {
    categories,
    getRecipesByMealType,
    getFilteredIngredients,
    loading,
    getFavoriteForIngredient,
    recipes,
    mealTypes,
    convertToStandardRecipe
  } = useSupabaseData(user?.id);

  const {
    generatedRecipes,
    isGenerating,
    selectedIngredients,
    handleGetMultipleCategoryRecipes,
    generateDailyMealPlanWithoutIngredients
  } = useMealPlanGeneration({
    selectedMeals,
    recipes,
    mealTypes,
    convertToStandardRecipe
  });

  const handleMealToggle = (mealKey: string) => {
    setSelectedMeals(prev => {
      const newSelectedMeals = prev.includes(mealKey) 
        ? prev.filter(m => m !== mealKey)
        : [...prev, mealKey];
      
      // Ha van kiválasztott étkezés, mutassuk az alapanyag szűrőt
      setShowIngredientSelection(newSelectedMeals.length > 0);
      
      return newSelectedMeals;
    });
  };

  const getRecipeCount = (mealType: string) => {
    const recipes = getRecipesByMealType(mealType);
    return recipes ? recipes.length : 0;
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-600">Adatok betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
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
        onGetMultipleCategoryRecipes={handleGetMultipleCategoryRecipes}
        getFavoriteForIngredient={getFavoriteForIngredient}
      />

      <MealPlanGenerationButton
        selectedMeals={selectedMeals}
        selectedIngredients={selectedIngredients}
        isGenerating={isGenerating}
        onGenerateMealPlan={generateDailyMealPlanWithoutIngredients}
      />

      <GeneratedMealPlan generatedRecipes={generatedRecipes} user={user} />
    </div>
  );
}
