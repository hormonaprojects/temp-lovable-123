import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, ThumbsDown, ChevronRight, ChevronLeft, ChefHat } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { saveUserPreferences } from "@/services/foodPreferencesQueries";
import { PreferenceInfoModal } from "./PreferenceInfoModal";

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
  const [showInfoModal, setShowInfoModal] = useState(true);
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
    const currentPreference = preferences[key] || 'neutral';
    
    // Ha már be van jelölve ugyanaz a preferencia, akkor neutral-ra állítjuk
    const newPreference = currentPreference === preference ? 'neutral' : preference;
    
    setPreferences(prev => ({
      ...prev,
      [key]: newPreference
    }));
  };

  const getPreferenceForIngredient = (ingredient: string): 'like' | 'dislike' | 'neutral' => {
    const key = `${categoryNames[currentCategoryIndex]}-${ingredient}`;
    return preferences[key] || 'neutral';
  };

  const getIngredientImage = (ingredient: string): string | null => {
    // Csak az ékezetek eltávolítása, szóközök megtartása
    const normalizedIngredient = ingredient
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // ékezetek eltávolítása
      .replace(/\./g, ''); // pontok eltávolítása
    
    console.log('🖼️ Kép keresés:', ingredient, '->', normalizedIngredient);
    
    // Először JPG-t próbáljuk, majd PNG-t
    const jpgUrl = supabase.storage.from('alapanyag').getPublicUrl(`${normalizedIngredient}.jpg`).data.publicUrl;
    const pngUrl = supabase.storage.from('alapanyag').getPublicUrl(`${normalizedIngredient}.png`).data.publicUrl;
    
    console.log('🔗 Generált JPG URL:', jpgUrl);
    console.log('🔗 Generált PNG URL:', pngUrl);
    
    // Visszaadjuk mindkét URL-t, először a JPG-t próbáljuk
    return jpgUrl;
  };

  const getPngImageUrl = (ingredient: string): string => {
    const normalizedIngredient = ingredient
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // ékezetek eltávolítása
      .replace(/\./g, ''); // pontok eltávolítása
    
    return supabase.storage.from('alapanyag').getPublicUrl(`${normalizedIngredient}.png`).data.publicUrl;
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
      // Csak azokat a preferenciákat mentjük el, amelyek nem neutral-ak
      const preferencesToSave = Object.entries(preferences)
        .filter(([key, preference]) => preference !== 'neutral')
        .map(([key, preference]) => {
          const [category, ingredient] = key.split('-', 2);
          return {
            category,
            ingredient,
            preference
          };
        });

      console.log('💾 Mentendő preferenciák:', preferencesToSave);

      // Ha vannak preferenciák, akkor mentjük őket
      if (preferencesToSave.length > 0) {
        await saveUserPreferences(user.id, preferencesToSave);
        toast({
          title: "Preferenciák mentve! ✅",
          description: `${preferencesToSave.length} preferencia sikeresen elmentve!`,
        });
      } else {
        // Ha nincs beállítva semmi, akkor is engedjük befejezni
        console.log('ℹ️ Nincsenek beállítva preferenciák, de ez rendben van');
        toast({
          title: "Beállítás befejezve! ✅",
          description: "Később bármikor beállíthatod a preferenciáidat a beállításokban.",
        });
      }
      
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* Info Modal */}
      <PreferenceInfoModal 
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)} 
      />

      {/* Modern Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Ételpreferenciák Beállítása</h1>
            </div>
            <p className="text-sm sm:text-base text-white/80">
              Állítsd be az ételpreferenciáidat a személyre szabott receptajánlásokhoz!
            </p>
            <p className="text-xs text-white/60 mt-1">
              Opcionális: Ha nem jelölsz meg semmit, később bármikor beállíthatod.
            </p>
            <button
              onClick={() => setShowInfoModal(true)}
              className="mt-2 text-xs text-blue-300 hover:text-blue-200 underline"
            >
              Segítség a beállításokhoz
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6 bg-white/10 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center text-white/80 text-sm mt-2 font-medium">
            {currentCategoryIndex + 1} / {categoryNames.length} kategória
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8">
          {/* Category Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {categoryNames[currentCategoryIndex]}
            </h2>
            <p className="text-gray-600 text-lg">
              Jelöld meg, hogy mely alapanyagokat szereted!
            </p>
          </div>

          {currentIngredients.length === 0 && (
            <div className="text-center mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-yellow-800 font-medium">
                Nincsenek alapanyagok betöltve ehhez a kategóriához: {categoryNames[currentCategoryIndex]}
              </p>
            </div>
          )}

          {/* Ingredients Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {currentIngredients.map((ingredient, index) => {
              const preference = getPreferenceForIngredient(ingredient);
              const jpgImageUrl = getIngredientImage(ingredient);
              const pngImageUrl = getPngImageUrl(ingredient);
              
              return (
                <Card
                  key={ingredient}
                  className={`
                    relative overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 animate-fadeInUp border-2
                    ${preference === 'like' ? 'bg-green-50 border-green-300 scale-110 shadow-lg ring-2 ring-green-200' : ''}
                    ${preference === 'dislike' ? 'bg-red-50 border-red-300 scale-90 opacity-70 ring-2 ring-red-200' : ''}
                    ${preference === 'neutral' ? 'bg-white border-gray-200 hover:shadow-md hover:border-purple-300' : ''}
                  `}
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <div className="p-4">
                    {/* Ingredient Image - Now 1:1 aspect ratio */}
                    <div className="w-full aspect-square mb-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                      <img
                        src={jpgImageUrl}
                        alt={ingredient}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          console.log('❌ JPG kép betöltési hiba, próbálkozás PNG-vel:', ingredient);
                          // Ha JPG hiba van, próbáljuk meg a PNG-t
                          (e.target as HTMLImageElement).src = pngImageUrl;
                          (e.target as HTMLImageElement).onerror = () => {
                            console.log('❌ PNG kép is hibás:', ingredient);
                            // Ha mindkettő hibás, elrejtjük a képet
                            (e.target as HTMLImageElement).style.display = 'none';
                          };
                        }}
                        onLoad={() => {
                          console.log('✅ Kép sikeresen betöltve:', ingredient);
                        }}
                      />
                    </div>
                    
                    {/* Ingredient Name */}
                    <h3 className="text-sm font-semibold text-gray-800 text-center mb-3 truncate min-h-[1.25rem]">
                      {ingredient}
                    </h3>
                    
                    {/* Preference Buttons */}
                    <div className="flex justify-center gap-2">
                      <Button
                        onClick={() => handlePreferenceChange(ingredient, 'like')}
                        variant={preference === 'like' ? 'default' : 'outline'}
                        size="sm"
                        className={`
                          w-8 h-8 p-0 transition-all duration-200 rounded-full
                          ${preference === 'like' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg' 
                            : 'hover:bg-green-50 hover:border-green-300 hover:text-green-600'
                          }
                        `}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        onClick={() => handlePreferenceChange(ingredient, 'dislike')}
                        variant={preference === 'dislike' ? 'default' : 'outline'}
                        size="sm"
                        className={`
                          w-8 h-8 p-0 transition-all duration-200 rounded-full
                          ${preference === 'dislike' 
                            ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg' 
                            : 'hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                          }
                        `}
                      >
                        <ThumbsDown className="w-4 h-4" />
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
              className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Előző
            </Button>

            {isLastCategory ? (
              <Button
                onClick={handleFinish}
                disabled={saving}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mentés...
                  </>
                ) : (
                  <>
                    Befejezés ✅
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Következő
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="mt-6 flex justify-center">
            <div className="flex gap-2">
              {categoryNames.map((_, index) => (
                <div
                  key={index}
                  className={`
                    w-3 h-3 rounded-full transition-all duration-300
                    ${index === currentCategoryIndex 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-125' 
                      : index < currentCategoryIndex 
                        ? 'bg-green-400' 
                        : 'bg-gray-300'
                    }
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
