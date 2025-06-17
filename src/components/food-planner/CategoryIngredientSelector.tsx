
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CategoryIngredientSelectorProps {
  selectedMealType: string;
  foodData: any;
  onGetRecipe: (category: string, ingredient: string) => void;
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

export function CategoryIngredientSelector({ selectedMealType, foodData, onGetRecipe }: CategoryIngredientSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState("");

  if (!selectedMealType) {
    return null;
  }

  // Kategóriák lekérése az adatbázisból
  const categories = foodData?.categories ? Object.keys(foodData.categories) : [];
  const ingredients = selectedCategory && foodData?.categories?.[selectedCategory] 
    ? foodData.categories[selectedCategory] 
    : [];

  console.log('📋 Elérhető kategóriák:', categories);
  console.log('🥕 Kiválasztott kategória alapanyagai:', ingredients);

  const handleCategoryChange = (category: string) => {
    console.log('📂 Kategória kiválasztva:', category);
    setSelectedCategory(category);
    setSelectedIngredient("");
  };

  const handleIngredientChange = (ingredient: string) => {
    console.log('🥕 Alapanyag kiválasztva:', ingredient);
    setSelectedIngredient(ingredient);
  };

  const handleGetRecipe = () => {
    if (selectedCategory && selectedIngredient) {
      console.log('🎯 Recept kérése:', { selectedCategory, selectedIngredient });
      onGetRecipe(selectedCategory, selectedIngredient);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="ingredient-section active mb-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 text-center">
            📋 Kategóriák betöltése...
          </h3>
          <div className="text-center text-white/70">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
            Kérjük várjon...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ingredient-section active mb-8">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 text-center">
          📋 Válassz kategóriát és alapanyagot
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-white font-semibold mb-2">Kategória:</label>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Válassz kategóriát..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {categories.map((category) => {
                  const displayName = categoryDisplayNames[category] || category;
                  return (
                    <SelectItem key={category} value={category} className="hover:bg-gray-100">
                      {displayName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Alapanyag:</label>
            <Select 
              value={selectedIngredient} 
              onValueChange={handleIngredientChange}
              disabled={!selectedCategory}
            >
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder={selectedCategory ? "Válassz alapanyagot..." : "Először kategóriát válassz"} />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {ingredients.map((ingredient: string) => (
                  <SelectItem key={ingredient} value={ingredient} className="hover:bg-gray-100">
                    {ingredient}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-center space-x-4">
          <Button
            onClick={handleGetRecipe}
            disabled={!selectedCategory || !selectedIngredient}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎯 Recept kérése
          </Button>
          
          <Button
            onClick={() => onGetRecipe('', '')}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            🎲 Meglepetés recept
          </Button>
        </div>

        {selectedCategory && ingredients.length === 0 && (
          <div className="mt-4 text-center text-white/70">
            <p>⚠️ Ehhez a kategóriához nem találhatók alapanyagok</p>
          </div>
        )}
      </div>
    </div>
  );
}
