import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Minus, Heart } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { FoodPreference } from "@/services/foodPreferencesQueries";
import { getUserFavorites, addUserFavorite, removeUserFavorite, isFavoriteIngredient, UserFavorite } from "@/services/userFavorites";

interface PreferencesCategorySelectorProps {
  category: string;
  userPreferences: FoodPreference[];
  onPreferenceUpdate: (ingredient: string, category: string, preference: 'like' | 'dislike' | 'neutral') => Promise<void>;
}

export function PreferencesCategorySelector({ 
  category, 
  userPreferences, 
  onPreferenceUpdate 
}: PreferencesCategorySelectorProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [userFavorites, setUserFavorites] = useState<UserFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoryIngredients();
  }, [category]);

  const loadCategoryIngredients = async () => {
    try {
      setLoading(true);
      
      const { data: categoriesData, error } = await supabase
        .from('Ételkategóriák_Új')
        .select('*');

      if (error || !categoriesData) {
        console.error('Kategória adatok betöltési hiba:', error);
        return;
      }

      const categoryIngredients: string[] = [];
      categoriesData.forEach(row => {
        const categoryValue = row[category];
        if (categoryValue && typeof categoryValue === 'string' && categoryValue.trim() !== '' && categoryValue !== 'EMPTY') {
          categoryIngredients.push(categoryValue.trim());
        }
      });

      // Remove duplicates and sort
      const uniqueIngredients = [...new Set(categoryIngredients)].sort();
      setIngredients(uniqueIngredients);
      
    } catch (error) {
      console.error('Alapanyagok betöltési hiba:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserFavorites();
  }, [category]);

  const loadUserFavorites = async () => {
    try {
      // Itt feltételezzük, hogy van egy userId a kontextusból vagy props-ból
      // A gyakorlatban ezt át kell adni a komponensnek
      const userId = userPreferences[0]?.user_id;
      if (userId) {
        const favorites = await getUserFavorites(userId);
        setUserFavorites(favorites);
      }
    } catch (error) {
      console.error('❌ Kedvencek betöltési hiba:', error);
    }
  };

  const getPreferenceForIngredient = (ingredient: string): 'like' | 'dislike' | 'neutral' => {
    const preference = userPreferences.find(p => 
      p.ingredient === ingredient && p.category === category
    );
    return preference?.preference || 'neutral';
  };

  const handlePreferenceClick = async (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => {
    await onPreferenceUpdate(ingredient, category, preference);
  };

  const handleFavoriteToggle = async (ingredient: string) => {
    const userId = userPreferences[0]?.user_id;
    if (!userId) return;

    const currentlyFavorite = isFavoriteIngredient(ingredient, category, userFavorites);
    
    try {
      if (currentlyFavorite) {
        await removeUserFavorite(userId, category, ingredient);
      } else {
        await addUserFavorite(userId, category, ingredient);
        // Ha kedvencnek jelöljük, automatikusan "like" preferencet állítunk
        if (getPreferenceForIngredient(ingredient) === 'neutral') {
          await handlePreferenceClick(ingredient, 'like');
        }
      }
      await loadUserFavorites();
    } catch (error) {
      console.error('❌ Kedvenc kezelési hiba:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Alapanyagok betöltése...</p>
        </div>
      </div>
    );
  }

  if (ingredients.length === 0) {
    return (
      <Card className="bg-white/10 border-white/20 text-white">
        <CardContent className="p-8 text-center">
          <p className="text-white/70">Nem találhatók alapanyagok ebben a kategóriában.</p>
        </CardContent>
      </Card>
    );
  }

  // Sort ingredients: favorites first, then by preference, then alphabetically
  const sortedIngredients = [...ingredients].sort((a, b) => {
    const aIsFavorite = isFavoriteIngredient(a, category, userFavorites);
    const bIsFavorite = isFavoriteIngredient(b, category, userFavorites);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    const aPreference = getPreferenceForIngredient(a);
    const bPreference = getPreferenceForIngredient(b);
    
    if (aPreference === 'like' && bPreference !== 'like') return -1;
    if (aPreference !== 'like' && bPreference === 'like') return 1;
    
    return a.localeCompare(b);
  });

  const stats = {
    liked: ingredients.filter(ing => getPreferenceForIngredient(ing) === 'like').length,
    disliked: ingredients.filter(ing => getPreferenceForIngredient(ing) === 'dislike').length,
    neutral: ingredients.filter(ing => getPreferenceForIngredient(ing) === 'neutral').length
  };

  return (
    <div className="space-y-6">
      {/* Statisztikák */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-green-600/20 border-green-400/50 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.liked}</div>
            <div className="text-sm text-white/70">Kedvelem</div>
          </CardContent>
        </Card>
        <Card className="bg-red-600/20 border-red-400/50 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.disliked}</div>
            <div className="text-sm text-white/70">Nem szeretem</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-600/20 border-gray-400/50 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.neutral}</div>
            <div className="text-sm text-white/70">Semleges</div>
          </CardContent>
        </Card>
      </div>

      {/* Alapanyagok listája */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">
            Alapanyagok ({ingredients.length} db)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedIngredients.map((ingredient) => {
              const preference = getPreferenceForIngredient(ingredient);
              const isFavorite = isFavoriteIngredient(ingredient, category, userFavorites);
              return (
                <div
                  key={ingredient}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    preference === 'like' 
                      ? 'bg-green-600/20 border-green-400/50' 
                      : preference === 'dislike'
                      ? 'bg-red-600/20 border-red-400/50'
                      : 'bg-white/5 border-white/20'
                  } ${isFavorite ? 'ring-2 ring-pink-300' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isFavorite && <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />}
                      <span className="text-white text-sm font-medium">{ingredient}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePreferenceClick(ingredient, preference === 'like' ? 'neutral' : 'like')}
                        className={`w-8 h-8 p-0 ${
                          preference === 'like'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'text-white/60 hover:text-green-400 hover:bg-green-600/20'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePreferenceClick(ingredient, preference === 'dislike' ? 'neutral' : 'dislike')}
                        className={`w-8 h-8 p-0 ${
                          preference === 'dislike'
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'text-white/60 hover:text-red-400 hover:bg-red-600/20'
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFavoriteToggle(ingredient)}
                        className={`w-8 h-8 p-0 ${
                          isFavorite
                            ? 'bg-pink-600 text-white hover:bg-pink-700'
                            : 'text-white/60 hover:text-pink-400 hover:bg-pink-600/20'
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
                      </Button>
                      {preference !== 'neutral' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePreferenceClick(ingredient, 'neutral')}
                          className="w-8 h-8 p-0 text-white/60 hover:text-gray-400 hover:bg-gray-600/20"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
