import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Utensils, Search, X, ChefHat } from "lucide-react";

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

  // Kategóriák ahol több alapanyag választható
  const multipleSelectionCategories = [
    'Zöldségek / Vegetáriánus',
    'Gyümölcsök', 
    'Tejtermékek',
    'Olajok és Magvak'
  ];

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
    const allowsMultiple = multipleSelectionCategories.includes(category);
    
    setSelectedIngredients(prev => {
      const categoryIngredients = prev[category] || [];
      const isSelected = categoryIngredients.includes(ingredient);
      
      let newCategoryIngredients: string[];
      
      if (allowsMultiple) {
        // Több alapanyag választható
        newCategoryIngredients = isSelected
          ? categoryIngredients.filter(item => item !== ingredient)
          : [...categoryIngredients, ingredient];
      } else {
        // Csak egy alapanyag választható
        newCategoryIngredients = isSelected ? [] : [ingredient];
      }
      
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
    <div className="space-y-8 mt-12" data-scroll-target="category-selector">
      {/* Random Recipe Button */}
      <div className="text-center">
        <Button
          onClick={getRandomRecipe}
          className="bg-gradient-to-r from-yellow-500/80 to-orange-600/80 hover:from-yellow-600/90 hover:to-orange-700/90 backdrop-blur-sm border border-yellow-300/20 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 text-sm sm:text-base"
        >
          <ChefHat className="w-5 h-5 mr-2" />
          Véletlenszerű recept ({selectedMealType})
        </Button>
      </div>

      {/* Selected Ingredients Display */}
      {allSelectedIngredients.length > 0 && (
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 border-violet-400 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg sm:text-xl font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" />
              Kiválasztott alapanyagok ({allSelectedIngredients.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {allSelectedIngredients.map((ingredient, index) => (
                <Badge key={`${ingredient}-${index}`} variant="secondary" className="bg-gradient-to-r from-blue-600/40 to-purple-600/40 text-blue-100 border-blue-400/50 flex items-center gap-1 px-3 py-1 text-sm hover:from-blue-600/50 hover:to-purple-600/50 transition-all duration-200">
                  {ingredient}
                  <button 
                    onClick={() => removeIngredient(ingredient)}
                    className="ml-1 text-blue-200 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Selection - Purple Design */}
      {availableCategories.length > 0 && (
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 border-violet-400 shadow-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-white text-xl sm:text-2xl font-bold flex items-center gap-3">
              <Utensils className="w-6 h-6 text-green-400" />
              Válassz kategóriákat
            </CardTitle>
            <p className="text-white/70 text-sm">Kattints a kategóriákra az alapanyagok megtekintéséhez</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCategories.map((category) => {
                const isSelected = selectedCategories.includes(category);
                const ingredientCount = foodData.getFilteredIngredients(category).length;
                const allowsMultiple = multipleSelectionCategories.includes(category);
                
                return (
                  <div
                    key={category}
                    className={`group relative overflow-hidden p-6 transition-all duration-300 text-sm border-2 rounded-2xl cursor-pointer transform hover:scale-105 ${
                      isSelected
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white shadow-2xl scale-105'
                        : 'bg-gradient-to-br from-purple-700 to-purple-800 border-purple-500 text-white hover:from-purple-600 hover:to-purple-700 hover:border-purple-400 shadow-lg'
                    }`}
                    onClick={() => handleCategoryToggle(category)}
                  >
                    <div className="relative z-10 flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                        isSelected 
                          ? 'bg-green-400 border-green-400' 
                          : 'border-white/40 group-hover:border-white/60'
                      }`}>
                        {isSelected && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold leading-tight mb-2 text-base">
                          {category}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs px-2 py-1 ${
                              isSelected 
                                ? 'bg-white/20 text-green-100 border-green-300/30' 
                                : 'bg-white/15 text-white/80 border-white/20'
                            }`}
                          >
                            {ingredientCount} alapanyag
                          </Badge>
                          {!allowsMultiple && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs px-2 py-1 ${
                                isSelected 
                                  ? 'bg-orange-500/30 text-orange-200 border-orange-300/30' 
                                  : 'bg-orange-600/20 text-orange-300 border-orange-400/30'
                              }`}
                            >
                              1 választás
                            </Badge>
                          )}
                        </div>
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
        const allowsMultiple = multipleSelectionCategories.includes(category);

        return (
          <Card key={category} className="bg-gradient-to-br from-violet-500 to-purple-600 border-violet-400 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-lg sm:text-xl font-bold flex items-center gap-2">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                Alapanyagok - {category}
                {!allowsMultiple && (
                  <Badge className="bg-orange-600/30 text-orange-200 border-orange-400/50 text-xs ml-2">
                    Csak 1 választható
                  </Badge>
                )}
              </CardTitle>
              {categorySelectedIngredients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {categorySelectedIngredients.map((ingredient) => (
                    <Badge key={ingredient} variant="secondary" className="bg-gradient-to-r from-blue-600/40 to-purple-600/40 text-blue-100 border-blue-400/50 px-3 py-1">
                      {ingredient}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {availableIngredients.map((ingredient) => {
                  const isSelected = categorySelectedIngredients.includes(ingredient);

                  return (
                    <div key={ingredient} className="relative">
                      <div
                        className={`group p-3 transition-all duration-200 text-sm border-2 rounded-xl cursor-pointer transform hover:scale-105 ${
                          isSelected
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-400 text-white shadow-lg scale-105'
                            : 'bg-gradient-to-br from-purple-700 to-purple-800 border-purple-500 text-white hover:from-purple-600 hover:to-purple-700 hover:border-purple-400 shadow-md'
                        }`}
                        onClick={() => handleIngredientToggle(category, ingredient)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${
                            isSelected 
                              ? 'bg-blue-400 border-blue-400' 
                              : 'border-white/40 group-hover:border-white/60'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="flex-1 break-words font-medium">{ingredient}</span>
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
      <div className="text-center pb-8">
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
