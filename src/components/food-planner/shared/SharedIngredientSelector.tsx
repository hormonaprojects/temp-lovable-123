import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Utensils, Heart, X } from "lucide-react";
import { sortIngredientsByPreference } from "@/services/ingredientSorting";

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

interface MealIngredients {
  [mealType: string]: SelectedIngredient[];
}

interface SharedIngredientSelectorProps {
  selectedMeals: string[];
  categories: Record<string, string[]>;
  getFilteredIngredients: (category: string) => string[];
  getFavoriteForIngredient: (ingredient: string, category?: string) => boolean;
  getPreferenceForIngredient: (ingredient: string, category?: string) => 'like' | 'dislike' | 'neutral';
  onMealIngredientsChange: (mealIngredients: MealIngredients) => void;
  initialMealIngredients?: MealIngredients;
  showIngredientSelection?: boolean;
  title?: string;
}

export function SharedIngredientSelector({
  selectedMeals,
  categories,
  getFilteredIngredients,
  getFavoriteForIngredient,
  getPreferenceForIngredient,
  onMealIngredientsChange,
  initialMealIngredients = {},
  showIngredientSelection = true,
  title = "Alapanyag szűrés (opcionális)"
}: SharedIngredientSelectorProps) {
  const [currentMealIngredients, setCurrentMealIngredients] = useState<MealIngredients>(initialMealIngredients);
  const [activeMealType, setActiveMealType] = useState<string>(selectedMeals[0] || '');

  // Keep ingredients persistent - don't reset them
  useEffect(() => {
    if (Object.keys(initialMealIngredients).length > 0) {
      setCurrentMealIngredients(initialMealIngredients);
    }
  }, [initialMealIngredients]);

  useEffect(() => {
    if (selectedMeals.length > 0 && !selectedMeals.includes(activeMealType)) {
      setActiveMealType(selectedMeals[0]);
    }
  }, [selectedMeals, activeMealType]);

  useEffect(() => {
    onMealIngredientsChange(currentMealIngredients);
  }, [currentMealIngredients, onMealIngredientsChange]);

  const handleIngredientToggle = (category: string, ingredient: string) => {
    setCurrentMealIngredients(prev => {
      const mealIngredients = prev[activeMealType] || [];
      const existingIndex = mealIngredients.findIndex(
        item => item.category === category && item.ingredient === ingredient
      );
      
      let newMealIngredients;
      if (existingIndex >= 0) {
        newMealIngredients = mealIngredients.filter((_, index) => index !== existingIndex);
      } else {
        newMealIngredients = [...mealIngredients, { category, ingredient }];
      }
      
      return {
        ...prev,
        [activeMealType]: newMealIngredients
      };
    });
  };

  const isIngredientSelected = (category: string, ingredient: string): boolean => {
    const mealIngredients = currentMealIngredients[activeMealType] || [];
    return mealIngredients.some(item => item.category === category && item.ingredient === ingredient);
  };

  const getMealTypeDisplayName = (mealType: string) => {
    switch (mealType) {
      case 'reggeli': return '🌅 Reggeli';
      case 'ebéd': return '🍽️ Ebéd';
      case 'vacsora': return '🌙 Vacsora';
      default: return mealType;
    }
  };

  if (!showIngredientSelection || selectedMeals.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-white text-lg sm:text-xl font-bold flex items-center gap-2">
          <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Meal Type Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          {selectedMeals.map((mealType) => (
            <Button
              key={mealType}
              onClick={() => setActiveMealType(mealType)}
              variant={activeMealType === mealType ? "default" : "outline"}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm transition-all ${
                activeMealType === mealType
                  ? 'bg-purple-600/80 border-purple-400/50 text-white shadow-lg'
                  : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
              }`}
            >
              {getMealTypeDisplayName(mealType)}
              {currentMealIngredients[mealType] && currentMealIngredients[mealType].length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-green-600/80 text-white text-xs">
                  {currentMealIngredients[mealType].length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Selected Ingredients Display */}
        {currentMealIngredients[activeMealType] && currentMealIngredients[activeMealType].length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h4 className="text-white text-sm sm:text-base font-semibold mb-2 sm:mb-3">
              Kiválasztott alapanyagok - {getMealTypeDisplayName(activeMealType)}:
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentMealIngredients[activeMealType].map((item, index) => (
                <Badge
                  key={index}
                  className="bg-green-600/80 text-white px-2 sm:px-3 py-1 text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
                >
                  {item.ingredient}
                  <button
                    onClick={() => handleIngredientToggle(item.category, item.ingredient)}
                    className="hover:bg-red-500/50 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible Category Sections */}
        <Accordion type="multiple" className="space-y-2">
          {Object.entries(categories).map(([category, ingredients]) => {
            const filteredIngredients = getFilteredIngredients(category);
            const sortedIngredients = sortIngredientsByPreference(
              filteredIngredients,
              getFavoriteForIngredient,
              getPreferenceForIngredient,
              category
            );

            if (sortedIngredients.length === 0) return null;

            return (
              <AccordionItem key={category} value={category} className="border-white/10">
                <AccordionTrigger className="text-white font-semibold text-sm sm:text-base hover:text-white/80 py-3">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span>{category}</span>
                    <Badge variant="outline" className="bg-white/10 text-white/70 border-white/30 text-xs ml-2">
                      {sortedIngredients.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {sortedIngredients.map((ingredient) => {
                      const isSelected = isIngredientSelected(category, ingredient);
                      const isFavorite = getFavoriteForIngredient(ingredient, category);
                      const preference = getPreferenceForIngredient(ingredient, category);

                      return (
                        <button
                          key={ingredient}
                          onClick={() => handleIngredientToggle(category, ingredient)}
                          className={`relative p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 text-left ${
                            isSelected
                              ? 'bg-green-600/80 text-white border-2 border-green-400/60 shadow-lg'
                              : preference === 'like'
                              ? 'bg-blue-600/20 text-blue-200 border border-blue-400/30 hover:bg-blue-600/30'
                              : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate pr-1">{ingredient}</span>
                            {isFavorite && (
                              <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 fill-current flex-shrink-0" />
                            )}
                          </div>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs font-bold">
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
