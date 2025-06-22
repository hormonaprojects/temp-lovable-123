
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, Heart, Check } from "lucide-react";
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

  // Javított sorrendezés: kedvencek ELŐSZÖR, majd liked, majd neutral (disliked elrejtése)
  const getSortedIngredients = (category: string) => {
    const ingredients = foodData.getFilteredIngredients(category);
    
    console.log(`🔄 Sorrendezés előtt (${category}):`, ingredients);
    
    return [...ingredients]
      .filter(ingredient => {
        // Elrejtjük a disliked alapanyagokat
        if (getPreferenceForIngredient) {
          const preference = getPreferenceForIngredient(ingredient, category);
          return preference !== 'dislike';
        }
        return true;
      })
      .sort((a, b) => {
        const aIsFavorite = getFavoriteForIngredient(a, category);
        const bIsFavorite = getFavoriteForIngredient(b, category);
        
        console.log(`🔍 Összehasonlítás: ${a} (kedvenc: ${aIsFavorite}) vs ${b} (kedvenc: ${bIsFavorite})`);
        
        // ELSŐ PRIORITÁS: Kedvencek (rózsaszín szív)
        if (aIsFavorite && !bIsFavorite) {
          console.log(`✨ ${a} kedvenc, előre kerül`);
          return -1;
        }
        if (!aIsFavorite && bIsFavorite) {
          console.log(`✨ ${b} kedvenc, előre kerül`);
          return 1;
        }
        
        // Ha mindkettő kedvenc vagy mindkettő nem kedvenc, akkor preference szerint
        if (getPreferenceForIngredient) {
          const aPreference = getPreferenceForIngredient(a, category);
          const bPreference = getPreferenceForIngredient(b, category);
          
          console.log(`🎯 Preferenciák: ${a} (${aPreference}) vs ${b} (${bPreference})`);
          
          // MÁSODIK PRIORITÁS: Liked alapanyagok (ha nem kedvencek)
          if (!aIsFavorite && !bIsFavorite) {
            if (aPreference === 'like' && bPreference !== 'like') {
              console.log(`💚 ${a} liked, előre kerül`);
              return -1;
            }
            if (aPreference !== 'like' && bPreference === 'like') {
              console.log(`💚 ${b} liked, előre kerül`);
              return 1;
            }
          }
        }
        
        // HARMADIK PRIORITÁS: Ábécé sorrend ugyanazon szinten
        const result = a.localeCompare(b, 'hu');
        console.log(`📝 Ábécé sorrend: ${a} vs ${b} = ${result}`);
        return result;
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
                    className="ml-1 text-white hover:text-red-200 bg-red-500/60 hover:bg-red-500/80 rounded-full p-1 transition-all duration-200 border border-red-400/50"
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

        {/* Ingredient Grid */}
        {selectedCategory && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">
              {selectedCategory} alapanyagai
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {getSortedIngredients(selectedCategory).map(ingredient => {
                const isFavorite = getFavoriteForIngredient(ingredient, selectedCategory);
                const preference = getPreferenceForIngredient ? getPreferenceForIngredient(ingredient, selectedCategory) : 'neutral';
                const isSelected = isIngredientSelected(ingredient);
                
                console.log(`🎨 Renderelés: ${ingredient} - kedvenc: ${isFavorite}, preferencia: ${preference}, kiválasztva: ${isSelected}`);
                
                let buttonClasses = cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative border-2 min-h-[60px] flex items-center justify-center"
                );

                if (isSelected) {
                  // Kiválasztott állapot - zöld háttér
                  buttonClasses = cn(buttonClasses, "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg border-green-400 transform scale-105");
                } else if (isFavorite) {
                  buttonClasses = cn(buttonClasses, "bg-pink-500/80 text-white hover:bg-pink-600 shadow-md border-pink-400");
                } else if (preference === 'like') {
                  buttonClasses = cn(buttonClasses, "bg-green-500/60 text-white hover:bg-green-600/80 border-green-400");
                } else {
                  buttonClasses = cn(buttonClasses, "bg-white/10 text-white hover:bg-white/20 border-white/20 hover:border-white/40");
                }

                return (
                  <button
                    key={ingredient}
                    onClick={() => addSelectedIngredient(ingredient)}
                    className={buttonClasses}
                  >
                    {isSelected && (
                      <Check className="absolute top-1 right-1 w-4 h-4 text-white bg-green-600 rounded-full p-0.5" />
                    )}
                    {isFavorite && !isSelected && (
                      <Heart className="absolute top-1 right-1 w-3 h-3 text-white fill-white" />
                    )}
                    <span className="text-center">{ingredient}</span>
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
