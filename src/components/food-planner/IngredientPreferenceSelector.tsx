
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';

interface FoodPreference {
  id: string;
  user_id: string;
  category: string;
  ingredient: string;
  preference: 'like' | 'dislike' | 'neutral';
  created_at: string;
  updated_at: string;
}

interface IngredientPreferenceSelectorProps {
  category: string;
  userPreferences: FoodPreference[];
  onPreferenceUpdate: (ingredient: string, category: string, preference: 'like' | 'dislike' | 'neutral') => Promise<void>;
}

export function IngredientPreferenceSelector({ 
  category, 
  userPreferences, 
  onPreferenceUpdate 
}: IngredientPreferenceSelectorProps) {
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

  const getPreferenceForIngredient = (ingredient: string): 'like' | 'dislike' | 'neutral' => {
    const preference = userPreferences.find(pref => 
      pref.category === category && pref.ingredient === ingredient
    );
    return preference?.preference || 'neutral';
  };

  const handleIngredientClick = async (ingredient: string) => {
    const currentPreference = getPreferenceForIngredient(ingredient);
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

    await onPreferenceUpdate(ingredient, category, newPreference);
  };

  if (isLoading) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-3 text-white">Alapanyagok betöltése...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <span className="text-2xl">
            {category === 'Húsfélék' && '🥩'}
            {category === 'Halak' && '🐟'}
            {category === 'Zöldségek / Vegetáriánus' && '🥬'}
            {category === 'Gyümölcsök' && '🍎'}
            {category === 'Tejtermékek' && '🥛'}
            {category === 'Gabonák és Tészták' && '🌾'}
            {category === 'Olajok és Magvak' && '🌰'}
          </span>
          {category} - Alapanyagok
        </CardTitle>
        <p className="text-white/70 text-sm">
          Kattints az alapanyagokra a preferenciák beállításához (semleges → kedvelt → nem kedvelt → semleges)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {ingredients.map((ingredient) => {
            const preference = getPreferenceForIngredient(ingredient);
            return (
              <Button
                key={ingredient}
                variant="ghost"
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left flex items-center justify-between min-h-[60px] ${
                  preference === 'like' 
                    ? 'border-green-400/50 bg-green-600/20 hover:bg-green-600/30 text-green-400'
                    : preference === 'dislike'
                    ? 'border-red-400/50 bg-red-600/20 hover:bg-red-600/30 text-red-400'
                    : 'border-white/20 bg-white/5 hover:bg-white/10 text-white'
                }`}
                onClick={() => handleIngredientClick(ingredient)}
              >
                <span className="flex-1 text-sm font-medium">{ingredient}</span>
                <span className="text-lg ml-2">
                  {preference === 'like' && '❤️'}
                  {preference === 'dislike' && '👎'}
                  {preference === 'neutral' && '➖'}
                </span>
              </Button>
            );
          })}
        </div>

        {ingredients.length === 0 && (
          <div className="text-center py-8 text-white/60">
            Nincs elérhető alapanyag ebben a kategóriában.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
