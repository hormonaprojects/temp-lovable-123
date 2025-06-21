
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Utensils, Search, X } from "lucide-react";

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
}

interface CategoryIngredientSelectorProps {
  selectedMealType: string;
  foodData: FoodData;
  onGetRecipe: (category: string, ingredient: string) => Promise<void>;
  multipleIngredients?: boolean;
  onGetMultipleRecipes?: (category: string, ingredients: string[]) => Promise<void>;
}

export function CategoryIngredientSelector({ 
  selectedMealType, 
  foodData, 
  onGetRecipe,
  multipleIngredients = false,
  onGetMultipleRecipes
}: CategoryIngredientSelectorProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<{[category: string]: string[]}>({});
  const [allSelectedIngredients, setAllSelectedIngredients] = useState<string[]>([]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(category);
      if (isSelected) {
        // Eltávolítjuk a kategóriát és az összes hozzávalóját
        const newSelectedIngredients = { ...selectedIngredients };
        delete newSelectedIngredients[category];
        setSelectedIngredients(newSelectedIngredients);
        
        // Frissítjük az összes kiválasztott alapanyag listáját
        const newAllSelected = Object.values(newSelectedIngredients).flat();
        setAllSelectedIngredients(newAllSelected);
        
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleIngredientToggle = (category: string, ingredient: string) => {
    setSelectedIngredients(prev => {
      const categoryIngredients = prev[category] || [];
      const isSelected = categoryIngredients.includes(ingredient);
      
      const newCategoryIngredients = isSelected
        ? categoryIngredients.filter(item => item !== ingredient)
        : [...categoryIngredients, ingredient];
      
      const newSelectedIngredients = {
        ...prev,
        [category]: newCategoryIngredients
      };
      
      // Frissítjük az összes kiválasztott alapanyag listáját
      const newAllSelected = Object.values(newSelectedIngredients).flat();
      setAllSelectedIngredients(newAllSelected);
      
      return newSelectedIngredients;
    });
  };

  const removeIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => {
      const newSelectedIngredients = { ...prev };
      
      // Megkeressük, melyik kategóriában van ez az alapanyag
      Object.keys(newSelectedIngredients).forEach(category => {
        newSelectedIngredients[category] = newSelectedIngredients[category].filter(
          item => item !== ingredient
        );
      });
      
      // Frissítjük az összes kiválasztott alapanyag listáját
      const newAllSelected = Object.values(newSelectedIngredients).flat();
      setAllSelectedIngredients(newAllSelected);
      
      return newSelectedIngredients;
    });
  };

  const handleGetRecipe = () => {
    if (multipleIngredients && onGetMultipleRecipes && allSelectedIngredients.length > 0) {
      // Több alapanyag esetén az első kategóriát adjuk át
      const firstCategory = selectedCategories[0] || "";
      onGetMultipleRecipes(firstCategory, allSelectedIngredients);
    } else {
      // Random recept
      onGetRecipe("", "");
    }
  };

  const getRandomRecipe = () => {
    onGetRecipe("", "");
  };

  // Get categories for selected meal type
  const availableCategories = selectedMealType && foodData.mealTypes[selectedMealType] 
    ? Object.keys(foodData.mealTypes[selectedMealType].categories) 
    : [];

  return (
    <div className="space-y-6 sm:space-y-8" data-scroll-target="category-selector">
      {/* Random Recipe Button */}
      <div className="text-center">
        <Button
          onClick={getRandomRecipe}
          className="bg-gradient-to-r from-yellow-500/80 to-orange-600/80 hover:from-yellow-600/90 hover:to-orange-700/90 backdrop-blur-sm border border-yellow-300/20 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 text-sm sm:text-base"
        >
          🎲 Véletlenszerű recept ({selectedMealType})
        </Button>
      </div>

      {/* Selected Ingredients Display */}
      {allSelectedIngredients.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg sm:text-xl font-bold">
              Kiválasztott alapanyagok ({allSelectedIngredients.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {allSelectedIngredients.map((ingredient, index) => (
                <Badge key={`${ingredient}-${index}`} variant="secondary" className="bg-blue-600/30 text-blue-200 border-blue-400/50 flex items-center gap-1">
                  {ingredient}
                  <button 
                    onClick={() => removeIngredient(ingredient)}
                    className="ml-1 text-blue-200 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Selection */}
      {availableCategories.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg sm:text-xl font-bold flex items-center gap-2">
              <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              Válassz kategóriákat
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {availableCategories.map((category) => {
                const isSelected = selectedCategories.includes(category);
                
                return (
                  <div
                    key={category}
                    className={`p-2 sm:p-3 h-auto transition-all duration-300 text-xs sm:text-sm border rounded cursor-pointer ${
                      isSelected
                        ? 'bg-green-600/30 border-green-400/50 text-white shadow-lg'
                        : 'bg-white/5 border-white/20 text-white hover:bg-white/15 hover:border-white/40'
                    }`}
                    onClick={() => handleCategoryToggle(category)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none"
                      />
                      <div className="flex-1">
                        <div className="font-medium leading-tight mb-1 text-center whitespace-normal break-words">
                          {category}
                        </div>
                        <Badge variant="secondary" className="bg-white/20 text-white/90 text-xs px-1 py-0.5">
                          {foodData.getFilteredIngredients(category).length}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ingredient Selection for Selected Categories */}
      {selectedCategories.map((category) => {
        const availableIngredients = foodData.getFilteredIngredients(category);
        const categorySelectedIngredients = selectedIngredients[category] || [];

        return (
          <Card key={category} className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-lg sm:text-xl font-bold flex items-center gap-2">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                Alapanyagok - {category}
              </CardTitle>
              {categorySelectedIngredients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {categorySelectedIngredients.map((ingredient) => (
                    <Badge key={ingredient} variant="secondary" className="bg-blue-600/30 text-blue-200 border-blue-400/50">
                      {ingredient}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                {availableIngredients.map((ingredient) => {
                  const isSelected = categorySelectedIngredients.includes(ingredient);

                  return (
                    <div key={ingredient} className="relative">
                      <div
                        className={`p-2 sm:p-3 h-auto transition-all duration-200 text-xs sm:text-sm border rounded cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/30 border-blue-400/50 text-white shadow-md'
                            : 'bg-white/5 border-white/20 text-white hover:bg-white/15 hover:border-white/40'
                        }`}
                        onClick={() => handleIngredientToggle(category, ingredient)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            className="pointer-events-none"
                          />
                          <span className="flex-1 break-words">{ingredient}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Generate Recipe Button */}
      <div className="text-center">
        <Button
          onClick={handleGetRecipe}
          className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-700/90 hover:to-pink-700/90 backdrop-blur-sm border border-purple-300/20 text-white px-8 sm:px-12 py-4 sm:py-6 rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
        >
          🍽️ Recept generálása
        </Button>
      </div>
    </div>
  );
}
