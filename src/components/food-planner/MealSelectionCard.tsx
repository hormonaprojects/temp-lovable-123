
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Target, RefreshCw } from "lucide-react";

interface MealSelectionCardProps {
  mealType: string;
  mealLabel: string;
  emoji: string;
  isSelected: boolean;
  onToggle: (mealType: string) => void;
  categories: string[];
  getIngredientsByCategory: (category: string) => string[];
  onGetRecipe: (mealType: string, category: string, ingredient: string) => void;
  onSelectionChange?: (mealType: string, category: string, ingredient: string) => void;
  isGenerating?: boolean;
  showRecipeButton?: boolean;
}

const categoryDisplayNames: { [key: string]: string } = {
  'Húsfélék': '🥩 Húsfélék',
  'Halak': '🐟 Halak',
  'Zöldségek / Vegetáriánus': '🥬 Zöldségek / Vegetáriánus',
  'Tejtermékek': '🥛 Tejtermékek',
  'Gyümölcsök': '🍎 Gyümölcsök',
  'Gabonák és Tészták': '🌾 Gabonák és Tészták',
  'Olajok és Magvak': '🌰 Olajok és Magvak'
};

export function MealSelectionCard({
  mealType,
  mealLabel,
  emoji,
  isSelected,
  onToggle,
  categories,
  getIngredientsByCategory,
  onGetRecipe,
  onSelectionChange,
  isGenerating = false,
  showRecipeButton = false
}: MealSelectionCardProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState("");

  const ingredients = selectedCategory ? getIngredientsByCategory(selectedCategory) : [];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedIngredient("");
    // Notify parent about the selection change
    if (onSelectionChange) {
      onSelectionChange(mealType, category, "");
    }
  };

  const handleIngredientChange = (ingredient: string) => {
    setSelectedIngredient(ingredient);
    // Notify parent about the selection change
    if (onSelectionChange) {
      onSelectionChange(mealType, selectedCategory, ingredient);
    }
  };

  const handleGetSpecificRecipe = () => {
    onGetRecipe(mealType, selectedCategory, selectedIngredient);
  };

  const handleGetRandomRecipe = () => {
    onGetRecipe(mealType, '', '');
  };

  // Notify parent whenever selections change
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(mealType, selectedCategory, selectedIngredient);
    }
  }, [selectedCategory, selectedIngredient, mealType, onSelectionChange]);

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Checkbox
            id={`meal-${mealType}`}
            checked={isSelected}
            onCheckedChange={() => onToggle(mealType)}
            className="border-white/50 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
          />
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <CardTitle className="text-white text-lg">{mealLabel}</CardTitle>
          </div>
        </div>
      </CardHeader>
      
      {(isSelected || showRecipeButton) && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-white/90 font-medium mb-2 text-sm">Kategória:</label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white text-sm">
                  <SelectValue placeholder="Választható..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {categories.map((category) => {
                    const displayName = categoryDisplayNames[category] || category;
                    const ingredientCount = getIngredientsByCategory(category).length;
                    return (
                      <SelectItem key={category} value={category} className="hover:bg-gray-100 text-sm">
                        {displayName} ({ingredientCount})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-white/90 font-medium mb-2 text-sm">Alapanyag:</label>
              <Select 
                value={selectedIngredient} 
                onValueChange={handleIngredientChange}
                disabled={!selectedCategory}
              >
                <SelectTrigger className="bg-white/20 border-white/30 text-white text-sm">
                  <SelectValue placeholder={selectedCategory ? "Választható..." : "Kategória kell"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {ingredients.map((ingredient: string) => (
                    <SelectItem key={ingredient} value={ingredient} className="hover:bg-gray-100 text-sm">
                      {ingredient}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {showRecipeButton && (
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={handleGetSpecificRecipe}
                disabled={!selectedCategory || !selectedIngredient || isGenerating}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex-1"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Generálás...
                  </>
                ) : (
                  <>
                    <Target className="w-3 h-3 mr-2" />
                    Specifikus Recept
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleGetRandomRecipe}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex-1"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Generálás...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Random Recept
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
