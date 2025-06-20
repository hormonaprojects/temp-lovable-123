
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ChefHat } from "lucide-react";

interface FoodData {
  mealTypes: { [key: string]: { categories: { [key: string]: string[] } } };
  categories: Record<string, string[]>;
  getFilteredIngredients: (category: string) => string[];
  getRecipesByMealType: (mealType: string) => any[];
}

interface CategoryIngredientSelectorProps {
  selectedMealType: string;
  foodData: FoodData;
  onGetRecipe: (category: string, ingredient: string) => void;
}

interface PreferenceCategoryIngredientSelectorProps {
  category: string;
  selectedPreferences: Record<string, 'like' | 'dislike' | 'neutral'>;
  onPreferenceChange: (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => void;
}

// Main component for recipe generation (used in SingleRecipeApp)
export function CategoryIngredientSelector({ 
  selectedMealType, 
  foodData, 
  onGetRecipe 
}: CategoryIngredientSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");

  const availableCategories = Object.keys(foodData.categories);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedIngredient("");
  };

  const handleIngredientSelect = (ingredient: string) => {
    setSelectedIngredient(ingredient);
  };

  const handleGetRecipe = () => {
    onGetRecipe(selectedCategory, selectedIngredient);
  };

  const handleRandomRecipe = () => {
    onGetRecipe("", "");
  };

  if (!selectedCategory) {
    return (
      <div className="mb-8 sm:mb-10">
        <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl sm:text-2xl text-white mb-4">
              🥘 Válassz kategóriát vagy készíts random receptet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {availableCategories.map((category) => (
                <Button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className="bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-600/90 hover:to-purple-700/90 backdrop-blur-sm border border-blue-300/20 text-white p-4 sm:p-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 h-auto min-h-[80px] text-sm sm:text-base"
                >
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-2">
                      {category === 'Húsfélék' && '🥩'}
                      {category === 'Halak' && '🐟'}
                      {category === 'Zöldségek / Vegetáriánus' && '🥬'}
                      {category === 'Gyümölcsök' && '🍎'}
                      {category === 'Tejtermékek' && '🥛'}
                      {category === 'Gabonák és Tészták' && '🌾'}
                      {category === 'Olajok és Magvak' && '🌰'}
                    </div>
                    <div className="font-medium">{category}</div>
                  </div>
                </Button>
              ))}
            </div>
            
            <div className="pt-4 border-t border-white/20">
              <Button
                onClick={handleRandomRecipe}
                className="w-full bg-gradient-to-r from-orange-500/80 to-red-600/80 hover:from-orange-600/90 hover:to-red-700/90 backdrop-blur-sm border border-orange-300/20 text-white py-4 sm:py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-base sm:text-lg"
              >
                <ChefHat className="w-5 h-5 mr-2" />
                🎲 Random recept készítése
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableIngredients = foodData.getFilteredIngredients(selectedCategory);

  return (
    <div className="mb-8 sm:mb-10">
      <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setSelectedCategory("")}
              className="text-white hover:text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Vissza
            </Button>
            <CardTitle className="text-lg sm:text-xl text-white">
              {selectedCategory}
            </CardTitle>
            <div className="w-16"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {availableIngredients.map((ingredient) => (
              <Button
                key={ingredient}
                onClick={() => handleIngredientSelect(ingredient)}
                className={`p-3 sm:p-4 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm h-auto min-h-[60px] ${
                  selectedIngredient === ingredient
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                {ingredient}
              </Button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/20">
            <Button
              onClick={handleGetRecipe}
              disabled={!selectedIngredient}
              className="flex-1 bg-gradient-to-r from-green-500/80 to-emerald-600/80 hover:from-green-600/90 hover:to-emerald-700/90 disabled:from-gray-500/50 disabled:to-gray-600/50 backdrop-blur-sm border border-green-300/20 text-white py-3 sm:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
            >
              <ChefHat className="w-4 h-4 mr-2" />
              Recept készítése - {selectedIngredient || 'Válassz alapanyagot'}
            </Button>
            
            <Button
              onClick={() => onGetRecipe(selectedCategory, "")}
              className="flex-1 bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-600/90 hover:to-purple-700/90 backdrop-blur-sm border border-blue-300/20 text-white py-3 sm:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
            >
              🎲 Random {selectedCategory} recept
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Separate component for preference setup (used in PreferenceSetup) - with image-based interface
export function PreferenceCategoryIngredientSelector({ 
  category, 
  selectedPreferences, 
  onPreferenceChange 
}: PreferenceCategoryIngredientSelectorProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIngredients();
  }, [category]);

  const loadIngredients = async () => {
    setIsLoading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from('Ételkategóriák_Új')
        .select('*');

      if (error) throw error;

      const ingredients: string[] = [];
      
      data?.forEach(row => {
        const categoryValue = row[category];
        if (categoryValue && typeof categoryValue === 'string' && categoryValue.trim() !== '' && categoryValue !== 'EMPTY') {
          const ingredient = categoryValue.trim();
          if (!ingredients.includes(ingredient)) {
            ingredients.push(ingredient);
          }
        }
      });
      
      setIngredients(ingredients.sort());
    } catch (error) {
      console.error('Alapanyagok betöltési hiba:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngredientClick = (ingredient: string) => {
    const currentPreference = selectedPreferences[ingredient] || 'neutral';
    let newPreference: 'like' | 'dislike' | 'neutral';

    // Allow toggling back to neutral from any state
    if (currentPreference === 'neutral') {
      newPreference = 'like';
    } else if (currentPreference === 'like') {
      newPreference = 'dislike';
    } else {
      newPreference = 'neutral';
    }

    onPreferenceChange(ingredient, newPreference);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600 mb-2">
          Kattints az alapanyagokra a preferenciák beállításához:
        </p>
        <p className="text-xs text-gray-500 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1">
            ➖ Semleges
          </span>
          <span className="flex items-center gap-1">
            👍 Kedvelt
          </span>
          <span className="flex items-center gap-1">
            👎 Nem kedvelt
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {ingredients.map((ingredient) => {
          const preference = selectedPreferences[ingredient] || 'neutral';
          return (
            <Button
              key={ingredient}
              variant="ghost"
              className={`p-3 rounded-lg border transition-all duration-200 text-left flex flex-col items-center justify-center min-h-[80px] relative ${
                preference === 'like' 
                  ? 'border-green-500 bg-green-50 hover:bg-green-100 text-green-800'
                  : preference === 'dislike'
                  ? 'border-red-500 bg-red-50 hover:bg-red-100 text-red-800'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              }`}
              onClick={() => handleIngredientClick(ingredient)}
            >
              <div className="text-2xl mb-1">
                {category === 'Húsfélék' && '🥩'}
                {category === 'Halak' && '🐟'}
                {category === 'Zöldségek / Vegetáriánus' && '🥬'}
                {category === 'Gyümölcsök' && '🍎'}
                {category === 'Tejtermékek' && '🥛'}
                {category === 'Gabonák és Tészták' && '🌾'}
                {category === 'Olajok és Magvak' && '🌰'}
              </div>
              <span className="text-xs font-medium text-center leading-tight">{ingredient}</span>
              <span className="absolute top-1 right-1 text-sm">
                {preference === 'like' && '👍'}
                {preference === 'dislike' && '👎'}
                {preference === 'neutral' && '➖'}
              </span>
            </Button>
          );
        })}
      </div>

      {ingredients.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nincs elérhető alapanyag ebben a kategóriában.
        </div>
      )}
    </div>
  );
}
