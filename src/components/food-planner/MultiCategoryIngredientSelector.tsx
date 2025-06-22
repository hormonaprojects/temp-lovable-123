
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Utensils, Star, Heart, Plus, Minus, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FoodData {
  mealTypes: { [key: string]: { categories: { [key: string]: string[] } } };
  categories: { [key: string]: string[] };
  getFilteredIngredients: (category: string) => string[];
  getRecipesByMealType: (mealType: string) => any[];
}

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

interface MultiCategoryIngredientSelectorProps {
  selectedMealType: string;
  foodData: FoodData;
  onGetMultipleCategoryRecipes: (selectedIngredients: SelectedIngredient[]) => void;
  getFavoriteForIngredient?: (ingredient: string, category: string) => boolean;
}

export function MultiCategoryIngredientSelector({ 
  selectedMealType, 
  foodData, 
  onGetMultipleCategoryRecipes,
  getFavoriteForIngredient
}: MultiCategoryIngredientSelectorProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);

  const availableCategories = Object.keys(foodData.categories);
  
  // Kategóriák amelyeknél csak 1 alapanyagot lehet választani
  const singleSelectionCategories = ['Húsfélék', 'Halak'];

  const getSortedIngredients = (category: string): string[] => {
    const ingredients = foodData.getFilteredIngredients(category);
    
    if (!getFavoriteForIngredient) {
      return ingredients.sort((a, b) => a.localeCompare(b));
    }

    return [...ingredients].sort((a, b) => {
      const aIsFavorite = getFavoriteForIngredient(a, category);
      const bIsFavorite = getFavoriteForIngredient(b, category);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      return a.localeCompare(b);
    });
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category];
      
      // Ha eltávolítjuk a kategóriát, távolítsuk el az összes alapanyagát is
      if (!newCategories.includes(category)) {
        setSelectedIngredients(prev => 
          prev.filter(ing => ing.category !== category)
        );
      }
      
      return newCategories;
    });
  };

  const handleIngredientToggle = (ingredient: string, category: string) => {
    const newIngredient: SelectedIngredient = { category, ingredient };
    
    setSelectedIngredients(prev => {
      const existingIndex = prev.findIndex(
        ing => ing.ingredient === ingredient && ing.category === category
      );
      
      if (existingIndex > -1) {
        // Eltávolítjuk az alapanyagot
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        // Hozzáadjuk az alapanyagot
        const isSingleSelectionCategory = singleSelectionCategories.includes(category);
        
        if (isSingleSelectionCategory) {
          // Ha ez egy korlátozott kategória, eltávolítjuk a többi alapanyagot ebből a kategóriából
          const filtered = prev.filter(ing => ing.category !== category);
          return [...filtered, newIngredient];
        } else {
          // Normál esetben csak hozzáadjuk
          return [...prev, newIngredient];
        }
      }
    });
  };

  const isIngredientSelected = (ingredient: string, category: string): boolean => {
    return selectedIngredients.some(
      ing => ing.ingredient === ingredient && ing.category === category
    );
  };

  const getSelectedCountForCategory = (category: string): number => {
    return selectedIngredients.filter(ing => ing.category === category).length;
  };

  const handleGenerateRecipe = () => {
    if (selectedIngredients.length > 0) {
      onGetMultipleCategoryRecipes(selectedIngredients);
    }
  };

  const clearAllSelections = () => {
    setSelectedCategories([]);
    setSelectedIngredients([]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Simplified Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Utensils className="h-5 w-5 sm:h-6 w-6 text-purple-400" />
          Alapanyag választás - {selectedMealType}
        </h2>
        <p className="text-white/70 text-sm sm:text-base">
          Válassz kategóriákat és alapanyagokat a receptgeneráláshoz
        </p>
      </div>

      {/* Simplified Category Selection */}
      <Card className="mb-6 bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-white">1. Válassz kategóriákat:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableCategories.map((category) => {
              const isSingleSelection = singleSelectionCategories.includes(category);
              const selectedCount = getSelectedCountForCategory(category);
              const isSelected = selectedCategories.includes(category);
              
              return (
                <div
                  key={category}
                  className={cn(
                    "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02]",
                    isSelected
                      ? "bg-gradient-to-br from-purple-500/40 to-pink-500/40 border-purple-300 shadow-lg"
                      : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                  )}
                  onClick={() => handleCategoryToggle(category)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center",
                        isSelected 
                          ? "bg-purple-500 border-purple-500" 
                          : "border-white/30"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <h3 className="text-white font-medium text-sm sm:text-base">
                        {category}
                      </h3>
                    </div>
                    {isSingleSelection && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-300 text-xs">Max 1</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedCount > 0 && (
                    <div className="text-center">
                      <Badge className="bg-purple-500/30 text-purple-200 text-xs">
                        {selectedCount} kiválasztva
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ingredients Selection for Each Category */}
      {selectedCategories.map((category) => {
        const categoryIngredients = getSortedIngredients(category);
        const isSingleSelection = singleSelectionCategories.includes(category);
        const selectedCount = getSelectedCountForCategory(category);
        
        return (
          <Card key={category} className="mb-6 bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  2. {category} alapanyagok
                  <Badge variant="outline" className="text-purple-300 border-purple-300 text-xs">
                    {categoryIngredients.length} db
                  </Badge>
                </CardTitle>
                {isSingleSelection && (
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs">
                    Csak 1 választható
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-80 overflow-y-auto">
                {categoryIngredients.map((ingredient) => {
                  const isSelected = isIngredientSelected(ingredient, category);
                  const isFavorite = getFavoriteForIngredient ? getFavoriteForIngredient(ingredient, category) : false;
                  const isDisabled = isSingleSelection && selectedCount >= 1 && !isSelected;

                  return (
                    <div
                      key={`${category}-${ingredient}`}
                      className={cn(
                        "relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300",
                        isDisabled 
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:scale-105",
                        isSelected
                          ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-green-400 shadow-md"
                          : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                      )}
                      onClick={() => !isDisabled && handleIngredientToggle(ingredient, category)}
                    >
                      {/* Selection indicator */}
                      <div className="absolute top-2 right-2">
                        {isSelected && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {isFavorite && !isSelected && (
                          <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                        )}
                      </div>
                      
                      <div className="text-center">
                        <p className="text-white text-xs sm:text-sm font-medium leading-tight break-words">
                          {ingredient}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Selected Ingredients Summary */}
      {selectedIngredients.length > 0 && (
        <Card className="mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg border-blue-300/30 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium text-lg">
                Kiválasztott alapanyagok ({selectedIngredients.length})
              </h3>
              <Button
                onClick={clearAllSelections}
                variant="outline"
                size="sm"
                className="text-white border-white/30 hover:bg-white/10 text-xs"
              >
                Törlés
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedIngredients.map((item, index) => {
                const isFavorite = getFavoriteForIngredient ? getFavoriteForIngredient(item.ingredient, item.category) : false;
                return (
                  <Badge 
                    key={`${item.category}-${item.ingredient}-${index}`}
                    className="bg-white/20 text-white border-white/30 flex items-center gap-1 text-xs"
                  >
                    {isFavorite && <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />}
                    {item.ingredient}
                    <span className="text-white/60">({item.category})</span>
                  </Badge>
                );
              })}
            </div>
            
            {/* Generate Recipe Button */}
            <div className="text-center">
              <Button
                onClick={handleGenerateRecipe}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 text-base shadow-xl hover:shadow-2xl transition-all duration-300 w-full sm:w-auto"
              >
                <Star className="mr-2 h-5 w-5" />
                Recept generálása ({selectedIngredients.length} alapanyag)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
