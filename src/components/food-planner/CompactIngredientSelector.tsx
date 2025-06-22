
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

interface CompactIngredientSelectorProps {
  categories: Record<string, string[]>;
  getFilteredIngredients: (category: string) => string[];
  onIngredientsChange: (ingredients: SelectedIngredient[]) => void;
  getFavoriteForIngredient?: (ingredient: string, category: string) => boolean;
  getPreferenceForIngredient?: (ingredient: string, category: string) => 'like' | 'dislike' | 'neutral';
}

export function CompactIngredientSelector({
  categories,
  getFilteredIngredients,
  onIngredientsChange,
  getFavoriteForIngredient,
  getPreferenceForIngredient
}: CompactIngredientSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const availableCategories = Object.keys(categories);
  
  // Szűrt és rendezett alapanyagok lekérése
  const getFilteredAndSortedIngredients = (category: string): string[] => {
    const allIngredients = getFilteredIngredients(category);
    
    // Szűrjük ki a "dislike" alapanyagokat
    const filteredIngredients = allIngredients.filter(ingredient => {
      if (getPreferenceForIngredient) {
        const preference = getPreferenceForIngredient(ingredient, category);
        return preference !== 'dislike';
      }
      return true;
    });
    
    // Rendezzük preferenciák szerint
    return filteredIngredients.sort((a, b) => {
      const aIsFavorite = getFavoriteForIngredient ? getFavoriteForIngredient(a, category) : false;
      const bIsFavorite = getFavoriteForIngredient ? getFavoriteForIngredient(b, category) : false;
      const aPreference = getPreferenceForIngredient ? getPreferenceForIngredient(a, category) : 'neutral';
      const bPreference = getPreferenceForIngredient ? getPreferenceForIngredient(b, category) : 'neutral';
      
      // Első prioritás: kedvencek
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // Ha mindkettő kedvenc vagy mindkettő nem kedvenc
      if (!aIsFavorite && !bIsFavorite) {
        // Második prioritás: liked alapanyagok
        if (aPreference === 'like' && bPreference !== 'like') return -1;
        if (aPreference !== 'like' && bPreference === 'like') return 1;
      }
      
      // Harmadik prioritás: ábécé sorrend
      return a.localeCompare(b, 'hu');
    });
  };

  const availableIngredients = selectedCategory ? getFilteredAndSortedIngredients(selectedCategory) : [];

  const handleIngredientToggle = (ingredient: string) => {
    const newSelection = { category: selectedCategory, ingredient };
    const isAlreadySelected = selectedIngredients.some(
      item => item.category === selectedCategory && item.ingredient === ingredient
    );

    let newSelectedIngredients;
    if (isAlreadySelected) {
      newSelectedIngredients = selectedIngredients.filter(
        item => !(item.category === selectedCategory && item.ingredient === ingredient)
      );
    } else {
      newSelectedIngredients = [...selectedIngredients, newSelection];
    }

    setSelectedIngredients(newSelectedIngredients);
    onIngredientsChange(newSelectedIngredients);
  };

  const removeIngredient = (index: number) => {
    const newSelectedIngredients = selectedIngredients.filter((_, i) => i !== index);
    setSelectedIngredients(newSelectedIngredients);
    onIngredientsChange(newSelectedIngredients);
  };

  const clearAll = () => {
    setSelectedIngredients([]);
    onIngredientsChange([]);
  };

  if (!isOpen) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-white/90 font-medium">🧄 Alapanyag szűrő</span>
          <Button
            onClick={() => setIsOpen(true)}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            Hozzáadás
          </Button>
        </div>

        {selectedIngredients.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {selectedIngredients.map((item, index) => {
                const isFavorite = getFavoriteForIngredient 
                  ? getFavoriteForIngredient(item.ingredient, item.category) 
                  : false;
                
                return (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-purple-500/20 text-white border-purple-400 flex items-center gap-1 px-2 py-1"
                  >
                    {isFavorite && <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />}
                    <span className="text-xs text-purple-300">{item.category}:</span>
                    {item.ingredient}
                    <button
                      onClick={() => removeIngredient(index)}
                      className="ml-1 hover:bg-red-500/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
            <Button
              onClick={clearAll}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 h-6 px-2 text-xs"
            >
              Összes törlése
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between">
        <span className="text-white font-medium">🧄 Alapanyag szűrő</span>
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="sm"
          className="text-white/70 hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Válassz kategóriát..." />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            {availableCategories.map((category) => (
              <SelectItem 
                key={category} 
                value={category}
                className="text-white hover:bg-gray-700"
              >
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCategory && availableIngredients.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {availableIngredients.map((ingredient) => {
                const isSelected = selectedIngredients.some(
                  item => item.category === selectedCategory && item.ingredient === ingredient
                );
                const isFavorite = getFavoriteForIngredient 
                  ? getFavoriteForIngredient(ingredient, selectedCategory) 
                  : false;
                const preference = getPreferenceForIngredient 
                  ? getPreferenceForIngredient(ingredient, selectedCategory) 
                  : 'neutral';

                return (
                  <div
                    key={ingredient}
                    onClick={() => handleIngredientToggle(ingredient)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm",
                      isSelected 
                        ? "bg-purple-500/30 border border-purple-400" 
                        : isFavorite
                        ? "bg-pink-500/20 border border-pink-400/40 hover:bg-pink-500/30"
                        : preference === 'like'
                        ? "bg-green-500/20 border border-green-400/40 hover:bg-green-500/30"
                        : "bg-white/10 border border-white/20 hover:bg-white/20"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => {}}
                      className="data-[state=checked]:bg-purple-500"
                    />
                    {isFavorite && <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />}
                    <span className="text-white text-xs leading-tight">{ingredient}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedIngredients.length > 0 && (
        <div className="space-y-2">
          <span className="text-white/90 text-sm font-medium">Kiválasztva ({selectedIngredients.length}):</span>
          <div className="flex flex-wrap gap-1">
            {selectedIngredients.map((item, index) => {
              const isFavorite = getFavoriteForIngredient 
                ? getFavoriteForIngredient(item.ingredient, item.category) 
                : false;
              
              return (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-purple-500/20 text-white border-purple-400 flex items-center gap-1 text-xs px-2 py-1"
                >
                  {isFavorite && <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />}
                  {item.ingredient}
                  <button
                    onClick={() => removeIngredient(index)}
                    className="ml-1 hover:bg-red-500/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
