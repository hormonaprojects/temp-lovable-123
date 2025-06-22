
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Utensils, Sparkles, Star, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FoodData {
  mealTypes: { [key: string]: { categories: { [key: string]: string[] } } };
  categories: { [key: string]: string[] };
  getFilteredIngredients: (category: string) => string[];
  getRecipesByMealType: (mealType: string) => any[];
}

interface CategoryIngredientSelectorProps {
  selectedMealType: string;
  foodData: FoodData;
  onGetRecipe: (category: string, ingredient: string) => void;
  multipleIngredients?: boolean;
  onGetMultipleRecipes?: (category: string, ingredients: string[]) => void;
  getFavoriteForIngredient?: (ingredient: string, category: string) => boolean;
  getPreferenceForIngredient?: (ingredient: string, category: string) => 'like' | 'dislike' | 'neutral';
}

export function CategoryIngredientSelector({ 
  selectedMealType, 
  foodData, 
  onGetRecipe, 
  multipleIngredients = false,
  onGetMultipleRecipes,
  getFavoriteForIngredient,
  getPreferenceForIngredient
}: CategoryIngredientSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [singleSelectedIngredient, setSingleSelectedIngredient] = useState<string>("");

  const availableCategories = Object.keys(foodData.categories);
  
  const getSortedIngredients = (category: string): string[] => {
    const ingredients = foodData.getFilteredIngredients(category);
    
    if (!getFavoriteForIngredient && !getPreferenceForIngredient) {
      return ingredients.sort((a, b) => a.localeCompare(b));
    }

    // Enhanced sorting: favorites first, then liked, then neutral (hide disliked)
    return [...ingredients]
      .filter(ingredient => {
        // Hide disliked ingredients if preference function is available
        if (getPreferenceForIngredient) {
          const preference = getPreferenceForIngredient(ingredient, category);
          return preference !== 'dislike';
        }
        return true;
      })
      .sort((a, b) => {
        const aIsFavorite = getFavoriteForIngredient ? getFavoriteForIngredient(a, category) : false;
        const bIsFavorite = getFavoriteForIngredient ? getFavoriteForIngredient(b, category) : false;
        
        // First priority: favorites (kedvencek)
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        
        // Second priority: liked ingredients (szeretett alapanyagok)
        if (getPreferenceForIngredient) {
          const aPreference = getPreferenceForIngredient(a, category);
          const bPreference = getPreferenceForIngredient(b, category);
          
          if (aPreference === 'like' && bPreference !== 'like') return -1;
          if (aPreference !== 'like' && bPreference === 'like') return 1;
          
          // Third priority: neutral ingredients
          if (aPreference === 'neutral' && bPreference === 'dislike') return -1;
          if (aPreference === 'dislike' && bPreference === 'neutral') return 1;
        }
        
        // Fourth priority: alphabetical order for same preference level
        return a.localeCompare(b);
      });
  };

  const availableIngredients = selectedCategory ? getSortedIngredients(selectedCategory) : [];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedIngredients([]);
    setSingleSelectedIngredient("");
  };

  const handleIngredientToggle = (ingredient: string) => {
    if (multipleIngredients) {
      setSelectedIngredients(prev => 
        prev.includes(ingredient) 
          ? prev.filter(i => i !== ingredient)
          : [...prev, ingredient]
      );
    } else {
      setSingleSelectedIngredient(ingredient);
    }
  };

  const handleGenerateRecipe = () => {
    if (multipleIngredients && selectedIngredients.length > 0 && onGetMultipleRecipes) {
      onGetMultipleRecipes(selectedCategory, selectedIngredients);
    } else if (!multipleIngredients && singleSelectedIngredient) {
      onGetRecipe(selectedCategory, singleSelectedIngredient);
    } else if (selectedCategory) {
      // If no ingredient selected but category is selected, pass empty ingredient
      onGetRecipe(selectedCategory, "");
    }
  };

  const canGenerate = selectedCategory && (
    multipleIngredients ? selectedIngredients.length > 0 : singleSelectedIngredient || true
  );

  return (
    <Card className="mb-8 bg-white/5 backdrop-blur-lg border-white/10 shadow-2xl">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
          <Utensils className="h-6 w-6 text-purple-400" />
          Alapanyag választás - {selectedMealType}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Selection */}
        <div className="space-y-3">
          <label className="text-white/90 text-lg font-medium block">
            Válassz kategóriát:
          </label>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white text-lg h-12">
              <SelectValue placeholder="Válassz egy kategóriát..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 text-white">
              {availableCategories.map((category) => (
                <SelectItem 
                  key={category} 
                  value={category}
                  className="text-white hover:bg-gray-700 text-base"
                >
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ingredients Selection */}
        {selectedCategory && availableIngredients.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-white/90 text-lg font-medium">
                Válassz alapanyago(ka)t:
              </label>
              {multipleIngredients && (
                <Badge variant="outline" className="text-purple-300 border-purple-300">
                  Több is választható
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-4 bg-white/5 rounded-xl border border-white/10">
              {availableIngredients.map((ingredient) => {
                const isSelected = multipleIngredients 
                  ? selectedIngredients.includes(ingredient)
                  : singleSelectedIngredient === ingredient;
                
                const isFavorite = getFavoriteForIngredient ? getFavoriteForIngredient(ingredient, selectedCategory) : false;
                const preference = getPreferenceForIngredient ? getPreferenceForIngredient(ingredient, selectedCategory) : 'neutral';

                let cardClasses = cn(
                  "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105"
                );

                if (isSelected) {
                  cardClasses = cn(cardClasses, "bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-400 shadow-lg");
                } else if (isFavorite) {
                  cardClasses = cn(cardClasses, "bg-pink-500/20 border-pink-400/60 hover:bg-pink-500/30");
                } else if (preference === 'like') {
                  cardClasses = cn(cardClasses, "bg-green-500/20 border-green-400/60 hover:bg-green-500/30");
                } else {
                  cardClasses = cn(cardClasses, "bg-white/10 border-white/20 hover:bg-white/20");
                }

                return (
                  <div
                    key={ingredient}
                    className={cardClasses}
                    onClick={() => handleIngredientToggle(ingredient)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent div click
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

            {multipleIngredients && selectedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-white/90 font-medium">Kiválasztva:</span>
                {selectedIngredients.map((ingredient) => {
                  const isFavorite = getFavoriteForIngredient ? getFavoriteForIngredient(ingredient, selectedCategory) : false;
                  return (
                    <Badge 
                      key={ingredient} 
                      variant="secondary" 
                      className="bg-purple-500/20 text-white border-purple-400 flex items-center gap-1"
                    >
                      {isFavorite && <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />}
                      {ingredient}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Generate Recipe Button */}
        {selectedCategory && (
          <div className="text-center pt-4">
            <Button
              onClick={handleGenerateRecipe}
              disabled={!canGenerate}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Star className="mr-2 h-5 w-5" />
              {multipleIngredients && selectedIngredients.length > 1
                ? `Recept generálása ${selectedIngredients.length} alapanyaggal`
                : "Recept generálása"
              }
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
