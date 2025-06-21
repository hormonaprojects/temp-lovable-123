
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Utensils, Search } from "lucide-react";

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
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedIngredient("");
    setSelectedIngredients([]);
    
    // Scroll to ingredients section after a short delay
    setTimeout(() => {
      const ingredientsSection = document.querySelector('[data-scroll-target="ingredients-selector"]');
      if (ingredientsSection) {
        ingredientsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  const handleIngredientSelect = (ingredient: string) => {
    if (multipleIngredients) {
      setSelectedIngredients(prev => {
        const isSelected = prev.includes(ingredient);
        if (isSelected) {
          return prev.filter(item => item !== ingredient);
        } else {
          return [...prev, ingredient];
        }
      });
    } else {
      setSelectedIngredient(ingredient);
      
      // Scroll to generate button after a short delay
      setTimeout(() => {
        const generateSection = document.querySelector('[data-scroll-target="generate-button"]');
        if (generateSection) {
          generateSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  };

  const handleGetRecipe = () => {
    if (multipleIngredients && onGetMultipleRecipes && selectedIngredients.length > 0) {
      onGetMultipleRecipes(selectedCategory, selectedIngredients);
    } else if (!multipleIngredients && selectedIngredient) {
      onGetRecipe(selectedCategory, selectedIngredient);
    } else {
      // Ha nincs alapanyag kiválasztva, de van kategória
      if (selectedCategory) {
        if (multipleIngredients && onGetMultipleRecipes) {
          onGetMultipleRecipes(selectedCategory, []);
        } else {
          onGetRecipe(selectedCategory, "");
        }
      } else {
        // Teljesen random recept
        if (multipleIngredients && onGetMultipleRecipes) {
          onGetMultipleRecipes("", []);
        } else {
          onGetRecipe("", "");
        }
      }
    }
  };

  const getRandomRecipe = () => {
    if (multipleIngredients && onGetMultipleRecipes) {
      onGetMultipleRecipes("", []);
    } else {
      onGetRecipe("", "");
    }
  };

  // Get categories for selected meal type
  const availableCategories = selectedMealType && foodData.mealTypes[selectedMealType] 
    ? Object.keys(foodData.mealTypes[selectedMealType].categories) 
    : [];

  // Get ingredients for selected category
  const availableIngredients = selectedCategory 
    ? foodData.getFilteredIngredients(selectedCategory)
    : [];

  const canGenerateRecipe = selectedCategory || selectedIngredient || (multipleIngredients && selectedIngredients.length > 0);

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

      {/* Category Selection */}
      {availableCategories.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg sm:text-xl font-bold flex items-center gap-2">
              <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              Válassz kategóriát
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {availableCategories.map((category) => (
                <Button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  variant="outline"
                  className={`h-auto p-2 sm:p-3 transition-all duration-300 text-xs sm:text-sm ${
                    selectedCategory === category
                      ? 'bg-green-600/30 border-green-400/50 text-white shadow-lg transform scale-105'
                      : 'bg-white/5 border-white/20 text-white hover:bg-white/15 hover:border-white/40 hover:transform hover:scale-102'
                  }`}
                >
                  <div className="text-center w-full">
                    <div className="font-medium leading-tight mb-1 text-center whitespace-normal break-words min-h-[2rem] flex items-center justify-center">
                      {category}
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white/90 text-xs px-1 py-0.5">
                      {foodData.getFilteredIngredients(category).length}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ingredient Selection */}
      {selectedCategory && availableIngredients.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl" data-scroll-target="ingredients-selector">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg sm:text-xl font-bold flex items-center gap-2">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              {multipleIngredients ? 'Válassz alapanyagokat (opcionális)' : 'Válassz alapanyagot (opcionális)'} ({selectedCategory})
            </CardTitle>
            {multipleIngredients && selectedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedIngredients.map((ingredient) => (
                  <Badge key={ingredient} variant="secondary" className="bg-blue-600/30 text-blue-200 border-blue-400/50">
                    {ingredient}
                    <button 
                      onClick={() => handleIngredientSelect(ingredient)}
                      className="ml-2 text-blue-200 hover:text-white"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
              {availableIngredients.map((ingredient) => {
                const isSelected = multipleIngredients 
                  ? selectedIngredients.includes(ingredient)
                  : selectedIngredient === ingredient;

                return (
                  <div key={ingredient} className="relative">
                    {multipleIngredients ? (
                      <div
                        className={`p-2 sm:p-3 h-auto transition-all duration-200 text-xs sm:text-sm border rounded cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/30 border-blue-400/50 text-white shadow-md'
                            : 'bg-white/5 border-white/20 text-white hover:bg-white/15 hover:border-white/40'
                        }`}
                        onClick={() => handleIngredientSelect(ingredient)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            className="pointer-events-none"
                          />
                          <span className="flex-1 break-words">{ingredient}</span>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleIngredientSelect(ingredient)}
                        variant="outline"
                        size="sm"
                        className={`p-2 sm:p-3 h-auto transition-all duration-200 text-xs sm:text-sm w-full ${
                          isSelected
                            ? 'bg-blue-600/30 border-blue-400/50 text-white shadow-md transform scale-105'
                            : 'bg-white/5 border-white/20 text-white hover:bg-white/15 hover:border-white/40'
                        }`}
                      >
                        <span className="break-words">{ingredient}</span>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Recipe Button */}
      <div className="text-center" data-scroll-target="generate-button">
        <Button
          onClick={handleGetRecipe}
          className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-700/90 hover:to-pink-700/90 backdrop-blur-sm border border-purple-300/20 text-white px-8 sm:px-12 py-4 sm:py-6 rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
        >
          🍽️ Recept generálása
          {selectedCategory && ` (${selectedCategory})`}
          {!multipleIngredients && selectedIngredient && ` - ${selectedIngredient}`}
          {multipleIngredients && selectedIngredients.length > 0 && ` - ${selectedIngredients.length} alapanyag`}
        </Button>
      </div>
    </div>
  );
}
