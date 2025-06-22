
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompactIngredientDisplay } from './CompactIngredientDisplay';
import { CompactIngredientGrid } from './CompactIngredientGrid';

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

interface CompactIngredientSelectorProps {
  categories: { [key: string]: string[] };
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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    onIngredientsChange(selectedIngredients);
  }, [selectedIngredients, onIngredientsChange]);

  const handleIngredientToggle = (ingredient: string) => {
    if (!selectedCategory) return;

    setSelectedIngredients(prev => {
      const existing = prev.find(item => 
        item.ingredient === ingredient && item.category === selectedCategory
      );

      if (existing) {
        return prev.filter(item => 
          !(item.ingredient === ingredient && item.category === selectedCategory)
        );
      } else {
        return [...prev, { category: selectedCategory, ingredient }];
      }
    });
  };

  const isIngredientSelected = (ingredient: string) => {
    return selectedIngredients.some(item => 
      item.ingredient === ingredient && item.category === selectedCategory
    );
  };

  const removeIngredient = (ingredient: string, category: string) => {
    setSelectedIngredients(prev => 
      prev.filter(item => !(item.ingredient === ingredient && item.category === category))
    );
  };

  const getIngredientButtonClass = (ingredient: string) => {
    const isSelected = isIngredientSelected(ingredient);
    const isFavorite = getFavoriteForIngredient?.(ingredient, selectedCategory) || false;
    const preference = getPreferenceForIngredient?.(ingredient, selectedCategory) || 'neutral';
    
    if (isSelected) {
      return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400';
    } else if (isFavorite) {
      return 'bg-gradient-to-r from-pink-500/80 to-rose-500/80 hover:from-pink-600/90 hover:to-rose-600/90 text-white border-pink-400';
    } else if (preference === 'like') {
      return 'bg-gradient-to-r from-green-500/60 to-emerald-500/60 hover:from-green-600/80 hover:to-emerald-600/80 text-white border-green-400';
    } else {
      return 'bg-white/10 hover:bg-white/20 text-white border-white/20';
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Kategória választó */}
      <div className="space-y-2">
        <label className="text-white/90 text-sm font-medium block">
          🏷️ Alapanyag szűrő
        </label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full bg-white/10 border-white/20 text-white text-sm sm:text-base">
            <SelectValue placeholder="Válassz kategóriát..." />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(categories).map((category) => (
              <SelectItem key={category} value={category} className="text-sm sm:text-base">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kiválasztott alapanyagok megjelenítése */}
      {selectedIngredients.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <CompactIngredientDisplay
              selectedIngredients={selectedIngredients}
              onRemoveIngredient={removeIngredient}
              isExpanded={isExpanded}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white/70 hover:text-white h-auto p-1"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Alapanyagok grid */}
      <CompactIngredientGrid
        selectedCategory={selectedCategory}
        getFilteredIngredients={getFilteredIngredients}
        getFavoriteForIngredient={getFavoriteForIngredient}
        getPreferenceForIngredient={getPreferenceForIngredient}
        onIngredientToggle={handleIngredientToggle}
        isIngredientSelected={isIngredientSelected}
        getIngredientButtonClass={getIngredientButtonClass}
      />

      {selectedCategory && getFilteredIngredients(selectedCategory).length === 0 && (
        <div className="text-center py-4">
          <p className="text-white/60 text-sm">
            Nincs elérhető alapanyag ebben a kategóriában (preferenciáid alapján)
          </p>
        </div>
      )}
    </div>
  );
}
