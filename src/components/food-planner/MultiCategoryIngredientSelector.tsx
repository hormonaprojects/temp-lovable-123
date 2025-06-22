
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Utensils, Star, Heart, Plus, Minus } from "lucide-react";
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
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        return [...prev, newIngredient];
      }
    });
  };

  const isIngredientSelected = (ingredient: string, category: string): boolean => {
    return selectedIngredients.some(
      ing => ing.ingredient === ingredient && ing.category === category
    );
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
    <Card className="mb-8 bg-white/5 backdrop-blur-lg border-white/10 shadow-2xl">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
          <Utensils className="h-6 w-6 text-purple-400" />
          Több kategóriás alapanyag választás - {selectedMealType}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Selection */}
        <div className="space-y-3">
          <label className="text-white/90 text-lg font-medium block">
            Válassz kategóriákat:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableCategories.map((category) => (
              <div
                key={category}
                className={cn(
                  "p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105",
                  selectedCategories.includes(category)
                    ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-400 shadow-lg"
                    : "bg-white/10 border-white/20 hover:bg-white/20"
                )}
                onClick={() => handleCategoryToggle(category)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={selectedCategories.includes(category)}
                    onChange={() => {}}
                    className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                  />
                  {selectedCategories.includes(category) ? (
                    <Minus className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Plus className="w-4 h-4 text-white/60" />
                  )}
                </div>
                <p className="text-white text-sm font-medium text-center leading-tight">
                  {category}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Categories Summary */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-white/90 font-medium">Kiválasztott kategóriák:</span>
            {selectedCategories.map((category) => (
              <Badge 
                key={category} 
                variant="secondary" 
                className="bg-purple-500/20 text-white border-purple-400"
              >
                {category}
              </Badge>
            ))}
          </div>
        )}

        {/* Ingredients Selection for Each Category */}
        {selectedCategories.map((category) => {
          const categoryIngredients = getSortedIngredients(category);
          
          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-white/90 text-lg font-medium">
                  {category} alapanyagok:
                </h3>
                <Badge variant="outline" className="text-purple-300 border-purple-300">
                  {categoryIngredients.length} db
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-64 overflow-y-auto p-4 bg-white/5 rounded-xl border border-white/10">
                {categoryIngredients.map((ingredient) => {
                  const isSelected = isIngredientSelected(ingredient, category);
                  const isFavorite = getFavoriteForIngredient ? getFavoriteForIngredient(ingredient, category) : false;

                  return (
                    <div
                      key={`${category}-${ingredient}`}
                      className={cn(
                        "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105",
                        isSelected
                          ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-400 shadow-lg"
                          : "bg-white/10 border-white/20 hover:bg-white/20"
                      )}
                      onClick={() => handleIngredientToggle(ingredient, category)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => {}}
                          className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                        />
                        {isFavorite && (
                          <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                        )}
                      </div>
                      <p className="text-white text-sm font-medium text-center leading-tight">
                        {ingredient}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Selected Ingredients Summary */}
        {selectedIngredients.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/90 font-medium">
                Kiválasztott alapanyagok ({selectedIngredients.length} db):
              </span>
              <Button
                onClick={clearAllSelections}
                variant="outline"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
              >
                Összes törlése
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {selectedIngredients.map((item, index) => {
                const isFavorite = getFavoriteForIngredient ? getFavoriteForIngredient(item.ingredient, item.category) : false;
                return (
                  <Badge 
                    key={`${item.category}-${item.ingredient}-${index}`}
                    variant="secondary" 
                    className="bg-purple-500/20 text-white border-purple-400 flex items-center gap-1"
                  >
                    {isFavorite && <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />}
                    {item.ingredient}
                    <span className="text-xs text-white/60">({item.category})</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Generate Recipe Button */}
        {selectedIngredients.length > 0 && (
          <div className="text-center pt-4">
            <Button
              onClick={handleGenerateRecipe}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Star className="mr-2 h-5 w-5" />
              Recept generálása {selectedIngredients.length} alapanyaggal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
