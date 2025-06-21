
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Shuffle, Settings } from "lucide-react";

interface MealTypeData {
  [key: string]: {
    categories: {
      [key: string]: string[];
    };
  };
}

interface FoodData {
  mealTypes: MealTypeData;
  categories: Record<string, string[]>;
  getFilteredIngredients: (category: string) => string[];
  getRecipesByMealType: (mealType: string) => any[];
}

interface MealTypeSelectorProps {
  selectedMealType: string;
  onSelectMealType: (mealType: string) => void;
  foodData: FoodData;
  onGetRandomRecipe?: () => void;
  onShowIngredientSelection?: () => void;
}

export function MealTypeSelector({ 
  selectedMealType, 
  onSelectMealType, 
  foodData,
  onGetRandomRecipe,
  onShowIngredientSelection
}: MealTypeSelectorProps) {
  const [showOptions, setShowOptions] = useState(false);

  const handleMealTypeSelect = (mealType: string) => {
    onSelectMealType(mealType);
    setShowOptions(true);
    
    // Automatikusan generáljon random receptet
    if (onGetRandomRecipe) {
      onGetRandomRecipe();
    }
    
    // Auto-scroll to options
    setTimeout(() => {
      const optionsSection = document.querySelector('[data-scroll-target="meal-options"]');
      if (optionsSection) {
        optionsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  const handleRandomRecipe = () => {
    setShowOptions(false);
    if (onGetRandomRecipe) {
      onGetRandomRecipe();
    }
  };

  const handleIngredientSelection = () => {
    setShowOptions(false);
    if (onShowIngredientSelection) {
      onShowIngredientSelection();
    }
  };

  // Reset options when meal type changes
  useEffect(() => {
    if (!selectedMealType) {
      setShowOptions(false);
    }
  }, [selectedMealType]);

  const mealTypeOptions = [
    { key: "reggeli", label: "Reggeli", emoji: "🌅" },
    { key: "tízórai", label: "Tízórai", emoji: "☕" },
    { key: "ebéd", label: "Ebéd", emoji: "🍛" },
    { key: "leves", label: "Leves", emoji: "🍲" },
    { key: "uzsonna", label: "Uzsonna", emoji: "🥨" },
    { key: "vacsora", label: "Vacsora", emoji: "🌙" }
  ];

  const getRecipeCount = (mealType: string) => {
    return foodData.getRecipesByMealType(mealType).length;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Meal Type Selection */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-xl sm:text-2xl font-bold text-center flex items-center justify-center gap-2">
            <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
            Válassz étkezési típust
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {mealTypeOptions.map((mealType) => {
              const recipeCount = getRecipeCount(mealType.key);
              const isSelected = selectedMealType === mealType.key;
              
              return (
                <Button
                  key={mealType.key}
                  onClick={() => handleMealTypeSelect(mealType.key)}
                  className={`py-4 sm:py-6 text-sm sm:text-lg font-semibold rounded-xl transition-all duration-300 min-h-[80px] sm:min-h-[120px] flex flex-col items-center justify-center border-2 ${
                    isSelected
                      ? 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-lg scale-105 border-yellow-300'
                      : 'bg-white/20 text-white hover:bg-white/30 hover:scale-102 border-white/30'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">
                      {mealType.emoji}
                    </div>
                    <div className="text-xs sm:text-sm font-medium leading-tight">{mealType.label}</div>
                    <Badge variant="secondary" className="bg-white/30 text-white/90 text-xs mt-1">
                      {recipeCount}
                    </Badge>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Options after meal type selection */}
      {selectedMealType && showOptions && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl" data-scroll-target="meal-options">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg sm:text-xl font-bold text-center">
              Mit szeretnél csinálni?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={handleRandomRecipe}
                className="bg-gradient-to-r from-green-500/80 to-emerald-600/80 hover:from-green-600/90 hover:to-emerald-700/90 backdrop-blur-sm border border-green-300/20 text-white px-6 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Shuffle className="w-5 h-5" />
                Új random recept generálása
              </Button>
              
              <Button
                onClick={handleIngredientSelection}
                className="bg-gradient-to-r from-blue-500/80 to-indigo-600/80 hover:from-blue-600/90 hover:to-indigo-700/90 backdrop-blur-sm border border-blue-300/20 text-white px-6 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Settings className="w-5 h-5" />
                Alapanyagok kiválasztása
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
