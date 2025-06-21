
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Settings, ChefHat } from "lucide-react";

interface MealTypeCardSelectorProps {
  selectedMeals: string[];
  onMealToggle: (mealKey: string) => void;
  getRecipeCount: (mealType: string) => number;
  onShowIngredientSelection?: (mealType: string) => void;
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
  getRecipeCount,
  onShowIngredientSelection 
}: MealTypeCardSelectorProps) {
  const [selectedMealForIngredients, setSelectedMealForIngredients] = useState<string>("");

  const handleMealToggle = (mealKey: string) => {
    onMealToggle(mealKey);
  };

  const handleIngredientSelection = (mealKey: string) => {
    setSelectedMealForIngredients(mealKey);
    if (onShowIngredientSelection) {
      onShowIngredientSelection(mealKey);
    }
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
              <CardContent className="p-4">
                <Button
                  onClick={() => handleMealToggle(meal.key)}
                  className={cn(
                    "w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300 min-h-[100px] flex flex-col items-center justify-center border-2 mb-3",
                    isSelected
                      ? "bg-yellow-400 text-black hover:bg-yellow-300 shadow-lg scale-105 border-yellow-300"
                      : "bg-white/20 text-white hover:bg-white/30 hover:scale-102 border-white/30"
                  )}
                >
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
                
                {/* Ingredient selection button for each meal */}
                {isSelected && (
                  <Button
                    onClick={() => handleIngredientSelection(meal.key)}
                    variant="outline"
                    size="sm"
                    className="w-full bg-white/5 border-white/20 text-white hover:bg-white/15 hover:border-white/40 text-xs"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Alapanyagok
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Show ingredient selection info */}
      {selectedMealForIngredients && (
        <div className="mt-4 text-center">
          <Badge variant="secondary" className="bg-blue-600/30 text-blue-200 border-blue-400/50">
            Alapanyag kiválasztás: {mealOptions.find(m => m.key === selectedMealForIngredients)?.label}
          </Badge>
        </div>
      )}
    </div>
  );
}
