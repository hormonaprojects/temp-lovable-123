
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, ThumbsDown, Minus } from "lucide-react";

interface CategoryIngredientSelectorProps {
  category: string;
  selectedPreferences: Record<string, 'like' | 'dislike' | 'neutral'>;
  onPreferenceChange: (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => void;
}

export function CategoryIngredientSelector({ 
  category, 
  selectedPreferences, 
  onPreferenceChange 
}: CategoryIngredientSelectorProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIngredients();
  }, [category]);

  const loadIngredients = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Ételkategóriák_Új')
        .select(category)
        .limit(1);

      if (error) throw error;

      if (data && data[0] && data[0][category]) {
        const categoryIngredients = data[0][category]
          .split(',')
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0);
        
        setIngredients(categoryIngredients);
      }
    } catch (error) {
      console.error('Alapanyagok betöltési hiba:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPreferenceIcon = (ingredient: string) => {
    const preference = selectedPreferences[ingredient] || 'neutral';
    
    switch (preference) {
      case 'like':
        return <ThumbsUp className="w-5 h-5 text-green-600" />;
      case 'dislike':
        return <ThumbsDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getButtonClass = (ingredient: string) => {
    const preference = selectedPreferences[ingredient] || 'neutral';
    const baseClass = "p-4 rounded-lg border-2 transition-all duration-200 text-left flex items-center justify-between min-h-[60px]";
    
    switch (preference) {
      case 'like':
        return `${baseClass} border-green-500 bg-green-50 hover:bg-green-100 text-green-800`;
      case 'dislike':
        return `${baseClass} border-red-500 bg-red-50 hover:bg-red-100 text-red-800`;
      default:
        return `${baseClass} border-gray-200 bg-white hover:bg-gray-50 text-gray-700`;
    }
  };

  const handleIngredientClick = (ingredient: string) => {
    const currentPreference = selectedPreferences[ingredient] || 'neutral';
    let newPreference: 'like' | 'dislike' | 'neutral';

    // Cycle through: neutral -> like -> dislike -> neutral
    switch (currentPreference) {
      case 'neutral':
        newPreference = 'like';
        break;
      case 'like':
        newPreference = 'dislike';
        break;
      case 'dislike':
        newPreference = 'neutral';
        break;
      default:
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
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Minus className="w-4 h-4" />
            <span>Semleges</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4 text-green-600" />
            <span>Szeretem</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsDown className="w-4 h-4 text-red-600" />
            <span>Nem szeretem</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ingredients.map((ingredient) => (
          <Button
            key={ingredient}
            variant="ghost"
            className={getButtonClass(ingredient)}
            onClick={() => handleIngredientClick(ingredient)}
          >
            <span className="flex-1 text-sm font-medium">{ingredient}</span>
            {getPreferenceIcon(ingredient)}
          </Button>
        ))}
      </div>

      {ingredients.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nincs elérhető alapanyag ebben a kategóriában.
        </div>
      )}
    </div>
  );
}
