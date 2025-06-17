
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CategoryIngredientSelectorProps {
  selectedMealType: string;
  foodData: any;
  onGetRecipe: (category: string, ingredient: string) => void;
}

export function CategoryIngredientSelector({ selectedMealType, foodData, onGetRecipe }: CategoryIngredientSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState("");

  if (!selectedMealType || !foodData?.mealTypes?.[selectedMealType]) {
    return null;
  }

  const categories = Object.keys(foodData.mealTypes[selectedMealType].categories || {});
  const ingredients = selectedCategory ? foodData.mealTypes[selectedMealType].categories[selectedCategory] || [] : [];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedIngredient("");
  };

  const handleIngredientChange = (ingredient: string) => {
    setSelectedIngredient(ingredient);
  };

  const handleGetRecipe = () => {
    if (selectedCategory && selectedIngredient) {
      onGetRecipe(selectedCategory, selectedIngredient);
    }
  };

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
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
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
                <SelectValue placeholder="Válassz alapanyagot..." />
              </SelectTrigger>
              <SelectContent>
                {ingredients.map((ingredient: string) => (
                  <SelectItem key={ingredient} value={ingredient}>
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
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
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
      </div>
    </div>
  );
}
