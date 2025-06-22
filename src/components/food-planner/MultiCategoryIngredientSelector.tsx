
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

interface FoodData {
  mealTypes: { [key: string]: { categories: { [key: string]: string[] } } };
  categories: { [key: string]: string[] };
  getFilteredIngredients: (category: string) => string[];
  getRecipesByMealType: (mealType: string) => any[];
}

interface MultiCategoryIngredientSelectorProps {
  selectedMealType: string;
  foodData: FoodData;
  onGetMultipleCategoryRecipes: (ingredients: SelectedIngredient[]) => Promise<void>;
  getFavoriteForIngredient: (ingredient: string, category: string) => boolean;
}

export function MultiCategoryIngredientSelector({
  selectedMealType,
  foodData,
  onGetMultipleCategoryRecipes,
  getFavoriteForIngredient
}: MultiCategoryIngredientSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const selectedIngredientsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedIngredients.length > 0 && selectedIngredientsRef.current) {
      selectedIngredientsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedIngredients]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const addSelectedIngredient = (ingredient: string) => {
    if (!selectedCategory) return;

    const newIngredient = { category: selectedCategory, ingredient };
    setSelectedIngredients(prev => {
      if (prev.find(item => item.ingredient === ingredient && item.category === selectedCategory)) {
        return prev;
      }
      return [...prev, newIngredient];
    });
  };

  const removeSelectedIngredient = (index: number) => {
    setSelectedIngredients(prev => {
      const newIngredients = [...prev];
      newIngredients.splice(index, 1);
      return newIngredients;
    });
  };

  const handleGenerateRecipe = async () => {
    if (selectedIngredients.length === 0) return;
    await onGetMultipleCategoryRecipes(selectedIngredients);
  };

  // Sort ingredients: favorites first, then alphabetically
  const getSortedIngredients = (category: string) => {
    const ingredients = foodData.getFilteredIngredients(category);
    return [...ingredients].sort((a, b) => {
      const aIsFavorite = getFavoriteForIngredient(a, category);
      const bIsFavorite = getFavoriteForIngredient(b, category);
      
      // If one is favorite and the other is not, favorite comes first
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // If both are favorites or both are not favorites, sort alphabetically
      return a.localeCompare(b);
    });
  };

  return (
    <Card className="mb-8 bg-white/5 backdrop-blur-lg border-white/10 shadow-2xl">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl font-bold text-white">
          Válassz alapanyagokat több kategóriából
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Selected Ingredients Display */}
        {selectedIngredients.length > 0 && (
          <div 
            ref={selectedIngredientsRef}
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl p-4"
          >
            <h3 className="text-white font-semibold mb-3">Kiválasztott alapanyagok ({selectedIngredients.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selectedIngredients.map((item, index) => (
                <Badge
                  key={index}
                  className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white border border-purple-400/50 px-3 py-2 text-sm flex items-center gap-2 hover:from-purple-700/90 hover:to-pink-700/90 transition-all duration-300"
                >
                  {item.ingredient}
                  <span className="text-purple-200 text-xs">({item.category})</span>
                  <button
                    onClick={() => removeSelectedIngredient(index)}
                    className="ml-1 text-white hover:text-red-200 bg-red-500/50 hover:bg-red-500/70 rounded-full p-1 transition-all duration-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Category Selection */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Kategóriák</h3>
          <div className="flex flex-wrap gap-3">
            {Object.keys(foodData.categories).map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                onClick={() => handleCategorySelect(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Ingredient Grid */}
        {selectedCategory && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">
              {selectedCategory} alapanyagai
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {getSortedIngredients(selectedCategory).map(ingredient => {
                const isFavorite = getFavoriteForIngredient(ingredient, selectedCategory);
                const buttonClasses = cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative",
                  isFavorite
                    ? "bg-pink-500/80 text-white hover:bg-pink-600 shadow-md"
                    : "bg-white/10 text-white hover:bg-white/20"
                );

                return (
                  <button
                    key={ingredient}
                    onClick={() => addSelectedIngredient(ingredient)}
                    className={buttonClasses}
                  >
                    {isFavorite && (
                      <Heart className="absolute top-1 right-1 w-3 h-3 text-white fill-white" />
                    )}
                    {ingredient}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Generate Recipe Button */}
        {selectedIngredients.length > 0 && (
          <div className="flex justify-center pt-6">
            <Button
              onClick={handleGenerateRecipe}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Recept generálása ({selectedIngredients.length} alapanyag)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
