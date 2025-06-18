
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
        const { data, error } = await supabase
          .from('Preferencia')
          .select('*');
        
        if (error) {
          console.error('Preferencia adatok betöltési hiba:', error);
          throw error;
        }
        
        setPreferencesData(data || []);
      } catch (error) {
        console.error('Preferencia adatok betöltési hiba:', error);
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
    if (!preferencesData.length || currentCategoryIndex >= categoryNames.length) return [];
    
    const categoryName = categoryNames[currentCategoryIndex];
    const ingredients: string[] = [];
    
    preferencesData.forEach(row => {
      const value = row[categoryName];
      if (value && typeof value === 'string') {
        const items = value.split(',').map(item => item.trim()).filter(item => item);
        ingredients.push(...items);
      }
    });
    
    return [...new Set(ingredients)];
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
    // AI generált képek placeholder URL-ek
    const imageMap: { [key: string]: string } = {
      // Húsfélék
      'Marha': '/placeholder.svg',
      'Sertés': '/placeholder.svg',
      'Csirke': '/placeholder.svg',
      'Pulyka': '/placeholder.svg',
      'Bárány': '/placeholder.svg',
      // Halak
      'Lazac': '/placeholder.svg',
      'Tonhal': '/placeholder.svg',
      'Pisztráng': '/placeholder.svg',
      'Hering': '/placeholder.svg',
      // Zöldségek
      'Paradicsom': '/placeholder.svg',
      'Uborka': '/placeholder.svg',
      'Paprika': '/placeholder.svg',
      'Hagyma': '/placeholder.svg',
      'Fokhagyma': '/placeholder.svg',
      // Tejtermékek
      'Tej': '/placeholder.svg',
      'Sajt': '/placeholder.svg',
      'Joghurt': '/placeholder.svg',
      'Vaj': '/placeholder.svg',
      // Gyümölcsök
      'Alma': '/placeholder.svg',
      'Banán': '/placeholder.svg',
      'Narancs': '/placeholder.svg',
      'Eper': '/placeholder.svg',
      // Gabonák
      'Rizs': '/placeholder.svg',
      'Tészta': '/placeholder.svg',
      'Kenyér': '/placeholder.svg',
      'Zab': '/placeholder.svg',
      // Olajok
      'Olívaolaj': '/placeholder.svg',
      'Napraforgóolaj': '/placeholder.svg',
      'Mogyoró': '/placeholder.svg',
      'Dió': '/placeholder.svg'
    };
    
    return imageMap[ingredient] || '/placeholder.svg';
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
