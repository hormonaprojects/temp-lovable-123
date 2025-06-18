
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Heart, X, ChevronRight, ChevronLeft } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { saveUserPreferences } from "@/services/foodPreferencesQueries";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface PreferenceSetupProps {
  user: User;
  onComplete: () => void;
}

interface PreferenceState {
  [key: string]: 'like' | 'dislike' | 'neutral';
}

export function PreferenceSetup({ user, onComplete }: PreferenceSetupProps) {
  const [preferencesData, setPreferencesData] = useState<any[]>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [preferences, setPreferences] = useState<PreferenceState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const categoryNames = [
    'Húsfélék',
    'Halak', 
    'Zöldségek / Vegetáriánus',
    'Tejtermékek',
    'Gyümölcsök',
    'Gabonák és Tészták',
    'Olajok és Magvak'
  ];

  useEffect(() => {
    const loadPreferencesData = async () => {
      try {
        console.log('🔄 Preferencia adatok betöltése az új táblából...');
        
        const { data, error } = await supabase
          .from('Ételkategóriák_Új')
          .select('*');
        
        console.log('📊 Ételkategóriák_Új lekérdezés eredménye:', { data, error });

        if (error) {
          console.error('❌ Ételkategóriák_Új lekérdezési hiba:', error);
          throw error;
        }
        
        console.log('✅ Ételkategóriák_Új adatok sikeresen betöltve:', data?.length || 0);
        setPreferencesData(data || []);
        
      } catch (error) {
        console.error('💥 Adatok betöltési hiba:', error);
        toast({
          title: "Hiba történt",
          description: "Nem sikerült betölteni az alapanyagokat.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferencesData();
  }, [toast]);

  const getCurrentCategoryIngredients = () => {
    console.log('🔍 getCurrentCategoryIngredients meghívva');
    console.log('🔍 preferencesData.length:', preferencesData.length);
    console.log('🔍 currentCategoryIndex:', currentCategoryIndex);
    
    if (!preferencesData.length || currentCategoryIndex >= categoryNames.length) {
      console.log('❌ Nincs adat vagy érvénytelen kategória index');
      return [];
    }
    
    const categoryName = categoryNames[currentCategoryIndex];
    console.log('🔍 Kategória keresése:', categoryName);
    
    const ingredients: string[] = [];
    
    // Végigmegyünk az összes soron
    preferencesData.forEach((row, rowIndex) => {
      console.log(`🔍 Sor ${rowIndex + 1} feldolgozása:`, row);
      
      // Megkeressük a kategória oszlopot
      const categoryValue = row[categoryName];
      console.log(`📝 ${categoryName} értéke a ${rowIndex + 1}. sorban:`, categoryValue);
      
      if (categoryValue && typeof categoryValue === 'string' && categoryValue.trim() !== '' && categoryValue !== 'EMPTY') {
        // Az alapanyag közvetlenül a cella értéke
        const ingredient = categoryValue.trim();
        if (ingredient && !ingredients.includes(ingredient)) {
          ingredients.push(ingredient);
          console.log(`✅ Hozzáadva: ${ingredient} (${categoryName})`);
        }
      }
    });
    
    console.log(`🎯 Összegyűjtött alapanyagok (${categoryName}):`, ingredients);
    return ingredients;
  };

  const handlePreferenceChange = (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => {
    const key = `${categoryNames[currentCategoryIndex]}-${ingredient}`;
    setPreferences(prev => ({
      ...prev,
      [key]: preference
    }));
  };

  const getPreferenceForIngredient = (ingredient: string): 'like' | 'dislike' | 'neutral' => {
    const key = `${categoryNames[currentCategoryIndex]}-${ingredient}`;
    return preferences[key] || 'neutral';
  };

  const getIngredientImage = (ingredient: string): string => {
    return '/placeholder.svg';
  };

  const handleNext = () => {
    if (currentCategoryIndex < categoryNames.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const preferencesToSave = Object.entries(preferences).map(([key, preference]) => {
        const [category, ingredient] = key.split('-', 2);
        return {
          category,
          ingredient,
          preference
        };
      });

      await saveUserPreferences(user.id, preferencesToSave);
      
      toast({
        title: "Preferenciák mentve! ✅",
        description: "Sikeresen elmentettük az ételpreferenciáidat!",
      });
      
      onComplete();
    } catch (error) {
      console.error('Preferenciák mentési hiba:', error);
      toast({
        title: "Hiba történt",
        description: "Nem sikerült menteni a preferenciákat.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Betöltés...</p>
        </div>
      </div>
    );
  }

  const currentIngredients = getCurrentCategoryIngredients();
  const isLastCategory = currentCategoryIndex === categoryNames.length - 1;
  const progress = ((currentCategoryIndex + 1) / categoryNames.length) * 100;

  console.log('🎯 Aktuális kategória:', categoryNames[currentCategoryIndex]);
  console.log('🍽️ Aktuális alapanyagok:', currentIngredients);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-white">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">🍽️ Ételpreferenciák Beállítása</h1>
            <p className="text-sm sm:text-base opacity-90">
              Állítsd be az ételpreferenciáidat a személyre szabott receptajánlásokhoz!
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6 bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center text-white/80 text-sm mt-2">
            {currentCategoryIndex + 1} / {categoryNames.length} kategória
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Category Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              {categoryNames[currentCategoryIndex]}
            </h2>
            <p className="text-gray-600">
              Jelöld meg, hogy mely alapanyagokat szereted!
            </p>
          </div>

          {/* Debug Info */}
          <div className="text-center mb-8 p-4 bg-blue-100 rounded-lg">
            <p className="text-blue-800 font-medium">
              Debug információk:
            </p>
            <p className="text-sm text-blue-600 mt-2">
              Összes betöltött sor: {preferencesData.length}
            </p>
            <p className="text-sm text-blue-600">
              Aktuális kategória: {categoryNames[currentCategoryIndex]}
            </p>
            <p className="text-sm text-blue-600">
              Talált alapanyagok: {currentIngredients.length}
            </p>
            <p className="text-sm text-blue-600">
              Használt tábla: Ételkategóriák_Új
            </p>
          </div>

          {currentIngredients.length === 0 && (
            <div className="text-center mb-8 p-4 bg-yellow-100 rounded-lg">
              <p className="text-yellow-800">
                Nincsenek alapanyagok betöltve ehhez a kategóriához: {categoryNames[currentCategoryIndex]}
              </p>
            </div>
          )}

          {/* Ingredients Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {currentIngredients.map((ingredient, index) => {
              const preference = getPreferenceForIngredient(ingredient);
              return (
                <Card
                  key={ingredient}
                  className={`
                    relative overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 animate-fadeInUp
                    ${preference === 'like' ? 'bg-green-100 border-green-300 scale-110 shadow-lg' : ''}
                    ${preference === 'dislike' ? 'bg-red-100 border-red-300 scale-90 opacity-70' : ''}
                    ${preference === 'neutral' ? 'bg-white border-gray-200 hover:shadow-md' : ''}
                  `}
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <div className="p-4">
                    {/* Ingredient Image */}
                    <div className="w-full h-20 mb-3 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      <img
                        src={getIngredientImage(ingredient)}
                        alt={ingredient}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    
                    {/* Ingredient Name */}
                    <h3 className="text-sm font-medium text-gray-800 text-center mb-3 truncate">
                      {ingredient}
                    </h3>
                    
                    {/* Preference Buttons */}
                    <div className="flex justify-center gap-2">
                      <Button
                        onClick={() => handlePreferenceChange(ingredient, 'like')}
                        variant={preference === 'like' ? 'default' : 'outline'}
                        size="sm"
                        className={`
                          w-8 h-8 p-0 transition-all duration-200
                          ${preference === 'like' 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'hover:bg-green-50 hover:border-green-300'
                          }
                        `}
                      >
                        <Heart className={`w-4 h-4 ${preference === 'like' ? 'fill-current' : ''}`} />
                      </Button>
                      
                      <Button
                        onClick={() => handlePreferenceChange(ingredient, 'dislike')}
                        variant={preference === 'dislike' ? 'default' : 'outline'}
                        size="sm"
                        className={`
                          w-8 h-8 p-0 transition-all duration-200
                          ${preference === 'dislike' 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'hover:bg-red-50 hover:border-red-300'
                          }
                        `}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={handlePrev}
              disabled={currentCategoryIndex === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Előző
            </Button>

            {isLastCategory ? (
              <Button
                onClick={handleFinish}
                disabled={saving}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {saving ? 'Mentés...' : 'Befejezés'} ✅
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                Következő
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
