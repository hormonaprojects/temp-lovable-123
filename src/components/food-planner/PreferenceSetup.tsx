
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, ArrowRight, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface PreferenceSetupProps {
  userId: string;
  onComplete: () => void;
}

interface FoodCategory {
  [key: string]: string[];
}

export function PreferenceSetup({ userId, onComplete }: PreferenceSetupProps) {
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [selectedPreferences, setSelectedPreferences] = useState<Set<string>>(new Set());
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const categoryNames = [
    'Alapanyagok_1',
    'Alapanyagok_2', 
    'Alapanyagok_3',
    'Zöldségek',
    'Gyümölcsök',
    'Tejtermékek',
    'Húsok'
  ];

  const categoryDisplayNames: Record<string, string> = {
    'Alapanyagok_1': 'Alapanyagok (1. rész)',
    'Alapanyagok_2': 'Alapanyagok (2. rész)',
    'Alapanyagok_3': 'Alapanyagok (3. rész)',
    'Zöldségek': 'Zöldségek',
    'Gyümölcsök': 'Gyümölcsök',
    'Tejtermékek': 'Tejtermékek',
    'Húsok': 'Húsok'
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data: categoriesData, error } = await supabase
        .from('Ételkategóriák_Új')
        .select('*');

      if (error || !categoriesData) {
        console.error('Kategória adatok betöltési hiba:', error);
        return;
      }

      const processedCategories: Record<string, string[]> = {};

      categoryNames.forEach(categoryName => {
        const categoryIngredients: string[] = [];
        categoriesData.forEach(row => {
          const categoryValue = row[categoryName];
          if (categoryValue && typeof categoryValue === 'string' && categoryValue.trim() !== '' && categoryValue !== 'EMPTY') {
            categoryIngredients.push(categoryValue.trim());
          }
        });
        
        const uniqueIngredients = [...new Set(categoryIngredients)].sort();
        if (uniqueIngredients.length > 0) {
          processedCategories[categoryName] = uniqueIngredients;
        }
      });

      setCategories(processedCategories);
    } catch (error) {
      console.error('Kategóriák betöltési hiba:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreference = (ingredient: string) => {
    const newPreferences = new Set(selectedPreferences);
    if (newPreferences.has(ingredient)) {
      newPreferences.delete(ingredient);
    } else {
      newPreferences.add(ingredient);
    }
    setSelectedPreferences(newPreferences);
  };

  const handleNext = () => {
    const categoryKeys = Object.keys(categories);
    if (currentCategoryIndex < categoryKeys.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      // Save all selected preferences
      const preferencesToSave = Array.from(selectedPreferences).map(ingredient => ({
        user_id: userId,
        ingredient: ingredient,
        preference: 'like' as const,
        category: findCategoryForIngredient(ingredient)
      }));

      if (preferencesToSave.length > 0) {
        const { error } = await supabase
          .from('Ételpreferenciák')
          .insert(preferencesToSave);

        if (error) {
          console.error('Preferenciák mentési hiba:', error);
          toast({
            title: "Mentési hiba",
            description: "Hiba történt a preferenciák mentésekor.",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Preferenciák mentve! 🎉",
        description: "Most már használhatod az ételtervezőt!",
      });

      onComplete();
    } catch (error) {
      console.error('Preferenciák mentési hiba:', error);
      toast({
        title: "Mentési hiba",
        description: "Hiba történt a preferenciák mentésekor.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const findCategoryForIngredient = (ingredient: string): string => {
    for (const [categoryName, ingredients] of Object.entries(categories)) {
      if (ingredients.includes(ingredient)) {
        return categoryName;
      }
    }
    return '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Ételkategóriák betöltése...</p>
        </div>
      </div>
    );
  }

  const categoryKeys = Object.keys(categories);
  const currentCategory = categoryKeys[currentCategoryIndex];
  const currentIngredients = categories[currentCategory] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Ételpreferenciák beállítása
            </CardTitle>
            <p className="text-gray-600 text-lg">
              Válaszd ki azokat az alapanyagokat, amelyeket szeretsz! (Kattints újra a visszavonáshoz)
            </p>
            <div className="flex justify-between items-center mt-4">
              <Badge variant="outline" className="text-sm">
                {currentCategoryIndex + 1} / {categoryKeys.length}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {selectedPreferences.size} kedvenc kiválasztva
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                {categoryDisplayNames[currentCategory] || currentCategory}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {currentIngredients.map((ingredient) => {
                const isSelected = selectedPreferences.has(ingredient);
                return (
                  <Button
                    key={ingredient}
                    onClick={() => togglePreference(ingredient)}
                    variant="outline"
                    className={`relative h-auto p-4 text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? 'bg-green-100 border-green-500 text-green-700 shadow-md transform scale-105'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-center leading-tight">{ingredient}</span>
                      {isSelected && (
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-green-600 fill-current" />
                          <X className="w-3 h-3 text-green-600" />
                        </div>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-6 border-t">
              <Button
                onClick={handlePrevious}
                disabled={currentCategoryIndex === 0}
                variant="outline"
                className="px-6"
              >
                Előző
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {currentCategory && categories[currentCategory] ? 
                    `${categories[currentCategory].length} alapanyag ebben a kategóriában` : 
                    ''
                  }
                </p>
              </div>

              <Button
                onClick={handleNext}
                disabled={isSaving}
                className="px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                {currentCategoryIndex === categoryKeys.length - 1 ? (
                  isSaving ? 'Mentés...' : 'Befejezés'
                ) : (
                  <>
                    Tovább
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
