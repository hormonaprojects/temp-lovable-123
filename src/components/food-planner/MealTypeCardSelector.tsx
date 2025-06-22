
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface MealTypeCardSelectorProps {
  selectedMeals: string[];
  onMealToggle: (mealKey: string) => void;
  getRecipeCount: (mealType: string) => number;
}

const mealOptions = [
  { key: "reggeli", label: "Reggeli", emoji: "🌅" },
  { key: "tízórai", label: "Tízórai", emoji: "☕" },
  { key: "ebéd", label: "Ebéd", emoji: "🍛" },
  { key: "uzsonna", label: "Uzsonna", emoji: "🥨" },
  { key: "vacsora", label: "Vacsora", emoji: "🌙" }
];

export function MealTypeCardSelector({ 
  selectedMeals, 
  onMealToggle, 
  getRecipeCount
}: MealTypeCardSelectorProps) {
  const handleMealToggle = (mealKey: string) => {
    onMealToggle(mealKey);
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-white mb-6 text-center">
        🍽️ Válaszd ki az étkezéseket
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {mealOptions.map((meal) => {
          const isSelected = selectedMeals.includes(meal.key);
          const recipeCount = getRecipeCount(meal.key);
          
          return (
            <Card key={meal.key} className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
              <CardContent className="p-0">
                <Button
                  onClick={() => handleMealToggle(meal.key)}
                  className={cn(
                    "w-full h-full py-6 text-lg font-semibold rounded-xl transition-all duration-300 min-h-[120px] flex flex-col items-center justify-center border-2 relative",
                    isSelected
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400 shadow-lg scale-105 hover:from-green-600 hover:to-emerald-600"
                      : "bg-white/20 text-white hover:bg-white/30 hover:scale-102 border-white/30 hover:border-white/50"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-white/20 rounded-full p-1">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {meal.emoji}
                    </div>
                    <div className="text-sm font-medium">{meal.label}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {recipeCount} recept
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
