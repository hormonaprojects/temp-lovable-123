
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UnifiedMealTypeSelector } from "./shared/UnifiedMealTypeSelector";

interface MealTypeSelectorProps {
  selectedMealType: string;
  onSelectMealType: (mealType: string) => void;
  foodData: any;
  onGetRandomRecipe: () => void;
  onShowMultiCategorySelection: () => void;
}

export function MealTypeSelector({
  selectedMealType,
  onSelectMealType,
  foodData,
  onGetRandomRecipe,
  onShowMultiCategorySelection
}: MealTypeSelectorProps) {
  const getRecipeCount = (mealType: string) => {
    const recipes = foodData.getRecipesByMealType(mealType);
    return recipes ? recipes.length : 0;
  };

  return (
    <div className="mb-6 sm:mb-8">
      <UnifiedMealTypeSelector
        selectedMealType={selectedMealType}
        onSelectMealType={onSelectMealType}
        getRecipeCount={getRecipeCount}
        title="Válaszd ki az étkezést"
        subtitle="Kattints az étkezésre a kiválasztáshoz"
        mode="single"
      />

      {selectedMealType && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            onClick={onGetRandomRecipe}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            🎲 Véletlenszerű recept
          </Button>
          
          <Button
            onClick={onShowMultiCategorySelection}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            🎯 Szűrés alapanyagok szerint
          </Button>
        </div>
      )}
    </div>
  );
}
