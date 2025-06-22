
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiCategorySelectedIngredients } from "./MultiCategorySelectedIngredients";
import { MultiCategoryIngredientList } from "./MultiCategoryIngredientList";

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
  getPreferenceForIngredient?: (ingredient: string, category: string) => 'like' | 'dislike' | 'neutral';
}

export function MultiCategoryIngredientSelector({
  selectedMealType,
  foodData,
  onGetMultipleCategoryRecipes,
  getFavoriteForIngredient,
  getPreferenceForIngredient
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
      // Ha már ki van választva, távolítsuk el
      const existingIndex = prev.findIndex(item => item.ingredient === ingredient && item.category === selectedCategory);
      if (existingIndex !== -1) {
        const newIngredients = [...prev];
        newIngredients.splice(existingIndex, 1);
        return newIngredients;
      }
      
      // Húsfélék és Halak kategóriáknál maximum 1 elem választható
      if (selectedCategory === 'Húsfélék' || selectedCategory === 'Halak') {
        // Távolítsuk el a már kiválasztott elemet ebből a kategóriából
        const filteredIngredients = prev.filter(item => item.category !== selectedCategory);
        return [...filteredIngredients, newIngredient];
      }
      
      // Ha nincs kiválasztva, adjuk hozzá
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

  const isIngredientSelected = (ingredient: string) => {
    return selectedIngredients.some(item => item.ingredient === ingredient && item.category === selectedCategory);
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
        <div ref={selectedIngredientsRef}>
          <MultiCategorySelectedIngredients
            selectedIngredients={selectedIngredients}
            onRemoveSelectedIngredient={removeSelectedIngredient}
          />
        </div>

        {/* Category Selection */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Kategóriák</h3>
          <div className="flex flex-wrap gap-3">
            {Object.keys(foodData.categories).map(category => (
              <Button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all duration-300 border-2",
                  selectedCategory === category
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400 shadow-lg transform scale-105"
                    : "bg-gradient-to-r from-gray-600/80 to-gray-700/80 text-white border-gray-500/50 hover:from-gray-500/90 hover:to-gray-600/90 hover:border-gray-400/70 hover:shadow-md"
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Ingredient List */}
        <MultiCategoryIngredientList
          selectedCategory={selectedCategory}
          getFilteredIngredients={foodData.getFilteredIngredients}
          getFavoriteForIngredient={getFavoriteForIngredient}
          getPreferenceForIngredient={getPreferenceForIngredient}
          onAddSelectedIngredient={addSelectedIngredient}
          isIngredientSelected={isIngredientSelected}
        />

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
