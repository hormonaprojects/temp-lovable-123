
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
}

export function CategoryIngredientSelector({ 
  selectedMealType, 
  foodData, 
  onGetRecipe 
}: CategoryIngredientSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState("");

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedIngredient("");
    
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
  };

  const handleGetRecipe = () => {
    onGetRecipe(selectedCategory, selectedIngredient);
  };

  const getRandomRecipe = () => {
    onGetRecipe("", "");
  };

  // Get categories for selected meal type
  const availableCategories = selectedMealType && foodData.mealTypes[selectedMealType] 
    ? Object.keys(foodData.mealTypes[selectedMealType].categories) 
    : [];

  // Get ingredients for selected category
  const availableIngredients = selectedCategory 
    ? foodData.getFilteredIngredients(selectedCategory)
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

      {/* Category Selection */}
      {availableCategories.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-xl sm:text-2xl font-bold flex items-center gap-3">
              <Utensils className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
              Válassz kategóriát
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {availableCategories.map((category) => (
                <Button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  variant="outline"
                  className={`h-auto p-4 sm:p-6 transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-green-600/30 border-green-400/50 text-white shadow-lg transform scale-105'
                      : 'bg-white/5 border-white/20 text-white hover:bg-white/15 hover:border-white/40 hover:transform hover:scale-102'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold text-sm sm:text-base mb-2">{category}</div>
                    <Badge variant="secondary" className="bg-white/20 text-white/90">
                      {foodData.getFilteredIngredients(category).length} alapanyag
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
          <CardHeader>
            <CardTitle className="text-white text-xl sm:text-2xl font-bold flex items-center gap-3">
              <Search className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              Válassz alapanyagot ({selectedCategory})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
              {availableIngredients.map((ingredient) => (
                <Button
                  key={ingredient}
                  onClick={() => handleIngredientSelect(ingredient)}
                  variant="outline"
                  size="sm"
                  className={`p-2 sm:p-3 h-auto transition-all duration-200 text-xs sm:text-sm ${
                    selectedIngredient === ingredient
                      ? 'bg-blue-600/30 border-blue-400/50 text-white shadow-md transform scale-105'
                      : 'bg-white/5 border-white/20 text-white hover:bg-white/15 hover:border-white/40'
                  }`}
                >
                  {ingredient}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Recipe Button */}
      {(selectedCategory || selectedIngredient) && (
        <div className="text-center" data-scroll-target="generate-button">
          <Button
            onClick={handleGetRecipe}
            className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-700/90 hover:to-pink-700/90 backdrop-blur-sm border border-purple-300/20 text-white px-8 sm:px-12 py-4 sm:py-6 rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
          >
            🍽️ Recept generálása
            {selectedCategory && ` (${selectedCategory})`}
            {selectedIngredient && ` - ${selectedIngredient}`}
          </Button>
        </div>
      )}
    </div>
  );
}
