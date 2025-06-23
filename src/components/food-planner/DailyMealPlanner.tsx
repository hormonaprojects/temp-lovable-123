
import { useState, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { MealTypeCardSelector } from "./MealTypeCardSelector";
import { IngredientSelectionSection } from "./IngredientSelectionSection";
import { MealPlanGenerationButton } from "./MealPlanGenerationButton";
import { DailyMealHeader } from "./DailyMealHeader";
import { GeneratedMealPlan } from "./GeneratedMealPlan";
import { LoadingChef } from "@/components/ui/LoadingChef";
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
  // FIXED: Add state to preserve ingredients after generation
  const [preservedMealIngredients, setPreservedMealIngredients] = useState<MealIngredients>({});

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

  // FIXED: Meal toggle - only state update, no automatic generation
  const handleMealToggle = (mealKey: string) => {
    setSelectedMeals(prev => {
      const newSelectedMeals = prev.includes(mealKey) 
        ? prev.filter(m => m !== mealKey)
        : [...prev, mealKey];
      
      // Show ingredient filter if there are selected meals with smooth scroll
      const willShowIngredients = newSelectedMeals.length > 0;
      setShowIngredientSelection(willShowIngredients);
      
      // Automatikus scroll az alapanyag választáshoz
      if (willShowIngredients && newSelectedMeals.length > prev.length) {
        setTimeout(() => {
          const ingredientSection = document.querySelector('.ingredient-selection-section');
          if (ingredientSection) {
            ingredientSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        }, 100);
      }
      
      return newSelectedMeals;
    });
  };

  const getRecipeCount = (mealType: string) => {
    const recipes = getRecipesByMealType(mealType);
    return recipes ? recipes.length : 0;
  };

  const handleMealIngredientsChange = (mealIngredients: MealIngredients) => {
    setCurrentMealIngredients(mealIngredients);
  };

  // Manual meal plan generation - only on button press
  const handleGenerateMealPlan = async () => {
    if (selectedMeals.length === 0) {
      return;
    }
    
    // FIXED: Preserve ingredients before generation
    setPreservedMealIngredients({ ...currentMealIngredients });
    
    // Scroll to generation button first
    setTimeout(() => {
      const generationButton = document.querySelector('.meal-plan-generation-button');
      if (generationButton) {
        generationButton.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 100);
    
    await handleGetMultipleCategoryRecipes(currentMealIngredients);
  };

  // Handle similar recipe generation for a specific meal type
  const handleGenerateSimilar = async (recipe: any, mealType: string) => {
    console.log('🔄 Hasonló recept generálása:', recipe.név, 'típus:', mealType);
    
    // Create a new meal ingredients object with only the specific meal type
    const singleMealIngredients: MealIngredients = {};
    
    // FIXED: Use preserved ingredients if available, otherwise use current
    const ingredientsToUse = Object.keys(preservedMealIngredients).length > 0 ? preservedMealIngredients : currentMealIngredients;
    
    if (ingredientsToUse[mealType]) {
      singleMealIngredients[mealType] = ingredientsToUse[mealType];
    } else {
      // Otherwise, set empty array to get any recipe from this meal type
      singleMealIngredients[mealType] = [];
    }
    
    // Temporarily set selected meals to only this meal type
    const originalSelectedMeals = selectedMeals;
    setSelectedMeals([mealType]);
    
    // Generate similar recipe
    await handleGetMultipleCategoryRecipes(singleMealIngredients);
    
    // Restore original selected meals
    setSelectedMeals(originalSelectedMeals);
  };

  // Preference search function
  const getPreferenceForIngredient = (ingredient: string, category: string): 'like' | 'dislike' | 'neutral' => {
    const preference = userPreferences.find(pref => 
      pref.ingredient.toLowerCase() === ingredient.toLowerCase() &&
      pref.category.toLowerCase() === category.toLowerCase()
    );
    return preference ? preference.preference : 'neutral';
  };

  // FIXED: Memoize foodData object to prevent unnecessary re-renders
  const foodData = useMemo(() => ({
    mealTypes: selectedMeals.reduce((acc, mealType) => {
      acc[mealType] = {
        categories: categories
      };
      return acc;
    }, {} as { [key: string]: { categories: { [key: string]: string[] } } }),
    categories: categories,
    getFilteredIngredients: getFilteredIngredients,
    getRecipesByMealType: getRecipesByMealType
  }), [selectedMeals, categories, getFilteredIngredients, getRecipesByMealType]);

  // Loading check after hooks
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

  // Full screen loading during generation
  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <LoadingChef />
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

      <div className="ingredient-selection-section">
        <IngredientSelectionSection
          showIngredientSelection={showIngredientSelection}
          selectedMeals={selectedMeals}
          foodData={foodData}
          onMealIngredientsChange={handleMealIngredientsChange}
          getFavoriteForIngredient={getFavoriteForIngredient}
          getPreferenceForIngredient={getPreferenceForIngredient}
          // FIXED: Pass preserved ingredients to maintain state
          initialMealIngredients={preservedMealIngredients}
        />
      </div>

      <div className="meal-plan-generation-button">
        <MealPlanGenerationButton
          selectedMeals={selectedMeals}
          selectedIngredients={Object.values(currentMealIngredients).flat()}
          isGenerating={isGenerating}
          onGenerateMealPlan={handleGenerateMealPlan}
        />
      </div>

      <GeneratedMealPlan 
        generatedRecipes={generatedRecipes} 
        user={user} 
        onGenerateSimilar={handleGenerateSimilar}
      />
    </div>
  );
}
