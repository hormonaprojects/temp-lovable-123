
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const getDisplayedIngredients = () => {
    if (!selectedCategory) return [];
    
    let ingredients = getFilteredIngredients(selectedCategory);
    
    // Szűrjük ki a "nem szeretem" alapanyagokat
    if (getPreferenceForIngredient) {
      ingredients = ingredients.filter(ingredient => {
        const preference = getPreferenceForIngredient(ingredient, selectedCategory);
        return preference !== 'dislike';
      });
    }
    
    // EGYSÉGES sorrendezés: kedvencek ELŐSZÖR, majd liked, majd neutral
    return ingredients.sort((a, b) => {
      const aIsFavorite = getFavoriteForIngredient?.(a, selectedCategory) || false;
      const bIsFavorite = getFavoriteForIngredient?.(b, selectedCategory) || false;
      
      console.log(`🔍 CompactIngredientSelector - Sorrendezés: ${a} (kedvenc: ${aIsFavorite}) vs ${b} (kedvenc: ${bIsFavorite})`);
      
      // ELSŐ PRIORITÁS: Kedvencek előre
      if (aIsFavorite && !bIsFavorite) {
        console.log(`✨ ${a} kedvenc, előre kerül`);
        return -1;
      }
      if (!aIsFavorite && bIsFavorite) {
        console.log(`✨ ${b} kedvenc, előre kerül`);
        return 1;
      }
      
      // MÁSODIK PRIORITÁS: Ha mindkettő kedvenc vagy mindkettő nem kedvenc, akkor preferencia szerint
      if (getPreferenceForIngredient && aIsFavorite === bIsFavorite) {
        const aPreference = getPreferenceForIngredient(a, selectedCategory);
        const bPreference = getPreferenceForIngredient(b, selectedCategory);
        
        console.log(`🎯 Preferenciák: ${a} (${aPreference}) vs ${b} (${bPreference})`);
        
        if (aPreference === 'like' && bPreference !== 'like') {
          console.log(`💚 ${a} liked, előre kerül`);
          return -1;
        }
        if (aPreference !== 'like' && bPreference === 'like') {
          console.log(`💚 ${b} liked, előre kerül`);
          return 1;
        }
      }
      
      // HARMADIK PRIORITÁS: Ábécé sorrend
      return a.localeCompare(b, 'hu');
    });
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

  const displayedIngredients = getDisplayedIngredients();

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
            <span className="text-white/90 text-sm font-medium">
              Kiválasztott alapanyagok ({selectedIngredients.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white/70 hover:text-white h-auto p-1"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className={`space-y-2 ${!isExpanded ? 'max-h-20 overflow-hidden' : ''}`}>
            {selectedIngredients.map((item, index) => (
              <div key={index} className="flex flex-wrap gap-1 sm:gap-2">
                <Badge 
                  variant="default" 
                  className="text-xs bg-blue-500/80 hover:bg-blue-500 flex items-center gap-1"
                >
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {item.ingredient} ({item.category})
                  </span>
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-red-200" 
                    onClick={() => removeIngredient(item.ingredient, item.category)}
                  />
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alapanyagok grid */}
      {selectedCategory && displayedIngredients.length > 0 && (
        <div className="space-y-2">
          <span className="text-white/90 text-sm font-medium block">
            Elérhető alapanyagok ({displayedIngredients.length})
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {displayedIngredients.map((ingredient) => {
              const isFavorite = getFavoriteForIngredient?.(ingredient, selectedCategory) || false;
              const isSelected = isIngredientSelected(ingredient);
              
              return (
                <Button
                  key={ingredient}
                  onClick={() => handleIngredientToggle(ingredient)}
                  className={`
                    text-xs sm:text-sm px-2 py-1 h-auto min-h-[32px] sm:min-h-[36px]
                    transition-colors duration-200 truncate relative
                    ${getIngredientButtonClass(ingredient)}
                  `}
                  title={ingredient}
                >
                  {/* EGYSÉGES kedvenc jelölés */}
                  {isFavorite && !isSelected && (
                    <Heart className="absolute top-0.5 right-0.5 w-3 h-3 text-white fill-white" />
                  )}
                  <span className="truncate leading-tight">
                    {ingredient}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {selectedCategory && displayedIngredients.length === 0 && (
        <div className="text-center py-4">
          <p className="text-white/60 text-sm">
            Nincs elérhető alapanyag ebben a kategóriában (preferenciáid alapján)
          </p>
        </div>
      )}
    </div>
  );
}
