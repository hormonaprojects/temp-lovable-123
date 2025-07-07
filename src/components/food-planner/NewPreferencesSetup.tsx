import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import { 
  fetchNewIngredients, 
  fetchIngredientCategories, 
  NewIngredient, 
  IngredientCategory 
} from '@/services/preferenceAdapter';
import { supabase } from '@/integrations/supabase/client';

interface NewPreferencesSetupProps {
  userId: string;
  onComplete: () => void;
  onBack: () => void;
}

export function NewPreferencesSetup({ userId, onComplete, onBack }: NewPreferencesSetupProps) {
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [ingredients, setIngredients] = useState<NewIngredient[]>([]);
  const [currentCategoryIndex, setCategoryIndex] = useState(0);
  const [selectedPreferences, setSelectedPreferences] = useState<Record<string, 'like' | 'dislike' | 'neutral'>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Adatok betöltése
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Új preferencia setup - adatok betöltése...');
        
        const [categoriesData, ingredientsData] = await Promise.all([
          fetchIngredientCategories(),
          fetchNewIngredients()
        ]);

        setCategories(categoriesData);
        setIngredients(ingredientsData);
        
        console.log('✅ Adatok betöltve:', {
          categories: categoriesData.length,
          ingredients: ingredientsData.length
        });
        
      } catch (error) {
        console.error('❌ Adatok betöltési hiba:', error);
        toast({
          title: "Hiba",
          description: "Nem sikerült betölteni az adatokat.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const currentCategory = categories[currentCategoryIndex];
  const currentIngredients = ingredients.filter(ing => ing.Kategoria_ID === currentCategory?.Kategoria_ID);
  const totalCategories = categories.length;
  const progress = totalCategories > 0 ? ((currentCategoryIndex + 1) / totalCategories) * 100 : 0;

  // Preferencia beállítása
  const handlePreferenceChange = (ingredient: NewIngredient, preference: 'like' | 'dislike' | 'neutral') => {
    setSelectedPreferences(prev => ({
      ...prev,
      [ingredient.Elelmiszer_nev]: preference
    }));
  };

  // Kedvenc kezelése
  const handleFavoriteToggle = (ingredient: NewIngredient) => {
    const newFavorites = new Set(favorites);
    const ingredientName = ingredient.Elelmiszer_nev;
    
    if (newFavorites.has(ingredientName)) {
      newFavorites.delete(ingredientName);
    } else {
      newFavorites.add(ingredientName);
      // Ha kedvencnek jelöljük, automatikusan "like" preferencet állítunk
      setSelectedPreferences(prev => ({
        ...prev,
        [ingredientName]: 'like'
      }));
    }
    
    setFavorites(newFavorites);
  };

  // Következő kategória
  const handleNext = () => {
    if (currentCategoryIndex < totalCategories - 1) {
      setCategoryIndex(prev => prev + 1);
    }
  };

  // Előző kategória
  const handlePrevious = () => {
    if (currentCategoryIndex > 0) {
      setCategoryIndex(prev => prev - 1);
    }
  };

  // Mentés
  const handleSave = async () => {
    setSaving(true);
    
    try {
      console.log('💾 Preferenciák mentése kezdődik...');
      console.log('📋 Kiválasztott preferenciák:', selectedPreferences);
      console.log('💖 Kedvencek:', Array.from(favorites));

      // Preferenciák mentése
      const preferenceInserts = Object.entries(selectedPreferences).map(([ingredient, preference]) => ({
        user_id: userId,
        ingredient: ingredient,
        category: currentCategory?.Kategoriak || 'Unknown',
        preference: preference
      }));

      if (preferenceInserts.length > 0) {
        const { error: prefError } = await supabase
          .from('Ételpreferenciák')
          .upsert(preferenceInserts, { 
            onConflict: 'user_id,ingredient,category' 
          });

        if (prefError) {
          console.error('❌ Preferenciák mentési hiba:', prefError);
          throw prefError;
        }
      }

      // Kedvencek mentése
      const favoriteInserts = Array.from(favorites).map(ingredient => ({
        user_id: userId,
        ingredient: ingredient,
        category: currentCategory?.Kategoriak || 'Unknown'
      }));

      if (favoriteInserts.length > 0) {
        const { error: favError } = await supabase
          .from('user_favorites')
          .upsert(favoriteInserts, { 
            onConflict: 'user_id,ingredient,category' 
          });

        if (favError) {
          console.error('❌ Kedvencek mentési hiba:', favError);
          throw favError;
        }
      }

      console.log('✅ Preferenciák és kedvencek mentve');
      
      toast({
        title: "Sikeres mentés",
        description: "Preferenciáid sikeresen elmentve!",
      });

      onComplete();

    } catch (error) {
      console.error('❌ Mentési hiba:', error);
      toast({
        title: "Mentési hiba",
        description: "Nem sikerült elmenteni a preferenciákat.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Adatok betöltése...</p>
        </div>
      </div>
    );
  }

  if (!currentCategory || currentIngredients.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Nincs elérhető kategória</h2>
        <Button onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza
          </Button>
          <h1 className="text-2xl font-bold">Étel Preferenciák</h1>
          <div />
        </div>
        
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Kategória: {currentCategory.Kategoriak}</span>
            <span>{currentCategoryIndex + 1} / {totalCategories}</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </div>

      {/* Ingredients Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        {currentIngredients.map((ingredient) => {
          const preference = selectedPreferences[ingredient.Elelmiszer_nev] || 'neutral';
          const isFavorite = favorites.has(ingredient.Elelmiszer_nev);
          
          return (
            <Card 
              key={ingredient.id}
              className={`
                relative cursor-pointer transition-all duration-300 hover:scale-105
                ${isFavorite ? 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-400 ring-2 ring-pink-300' : ''}
                ${preference === 'like' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 ring-2 ring-green-200' : ''}
                ${preference === 'dislike' ? 'bg-red-50 border-red-300 ring-2 ring-red-200' : ''}
                ${preference === 'neutral' && !isFavorite ? 'bg-white border-gray-200 hover:border-purple-300' : ''}
              `}
            >
              <CardContent className="p-3">
                {/* Kedvenc jelölés */}
                {isFavorite && (
                  <div className="absolute top-1 right-1 z-10">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                  </div>
                )}
                
                {/* Kép */}
                <div className="w-full aspect-square mb-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                  {ingredient.Kep ? (
                    <img
                      src={ingredient.Kep}
                      alt={ingredient.Elelmiszer_nev}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="text-xs text-gray-500 text-center p-2">
                      {ingredient.Elelmiszer_nev}
                    </div>
                  )}
                </div>
                
                {/* Név */}
                <h3 className="text-xs font-semibold text-center mb-2 leading-tight break-words min-h-[2rem] flex items-center justify-center">
                  {ingredient.Elelmiszer_nev}
                </h3>
                
                {/* Gombok */}
                <div className="flex justify-center gap-1">
                  <Button
                    onClick={() => handlePreferenceChange(ingredient, 'like')}
                    variant={preference === 'like' ? 'default' : 'outline'}
                    size="sm"
                    className={`w-6 h-6 p-0 ${
                      preference === 'like' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                        : 'hover:bg-green-50 hover:border-green-300'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    onClick={() => handlePreferenceChange(ingredient, 'dislike')}
                    variant={preference === 'dislike' ? 'default' : 'outline'}
                    size="sm"
                    className={`w-6 h-6 p-0 ${
                      preference === 'dislike' 
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white' 
                        : 'hover:bg-red-50 hover:border-red-300'
                    }`}
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    onClick={() => handleFavoriteToggle(ingredient)}
                    variant={isFavorite ? 'default' : 'outline'}
                    size="sm"
                    className={`w-6 h-6 p-0 ${
                      isFavorite 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-pink-400' 
                        : 'hover:bg-pink-50 hover:border-pink-300 border-pink-200'
                    }`}
                  >
                    <Heart className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentCategoryIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Előző
        </Button>

        <div className="flex gap-2">
          {Object.keys(selectedPreferences).length > 0 && (
            <Badge variant="secondary">
              {Object.keys(selectedPreferences).length} kiválasztva
            </Badge>
          )}
          {favorites.size > 0 && (
            <Badge variant="outline" className="border-pink-300 text-pink-600">
              {favorites.size} kedvenc
            </Badge>
          )}
        </div>

        {currentCategoryIndex === totalCategories - 1 ? (
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {saving ? 'Mentés...' : 'Befejezés'}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Következő
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}