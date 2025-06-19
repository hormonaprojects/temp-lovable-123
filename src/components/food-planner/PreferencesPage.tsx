
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Heart, X, Save, Edit3 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { fetchUserPreferences, saveUserPreferences, FoodPreference } from "@/services/foodPreferencesQueries";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface PreferencesPageProps {
  user: User;
  onClose: () => void;
}

interface PreferenceState {
  [key: string]: 'like' | 'dislike' | 'neutral';
}

export function PreferencesPage({ user, onClose }: PreferencesPageProps) {
  const [preferencesData, setPreferencesData] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<PreferenceState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
    const loadData = async () => {
      try {
        console.log('🔄 Adatok betöltése az új táblából...');
        
        const { data: preferencesDataResult, error: preferencesError } = await supabase
          .from('Ételkategóriák_Új')
          .select('*');
        
        console.log('📊 Ételkategóriák_Új lekérdezés eredménye:', { 
          data: preferencesDataResult, 
          error: preferencesError,
          dataLength: preferencesDataResult?.length
        });
        
        if (preferencesError) {
          console.error('❌ Ételkategóriák_Új lekérdezési hiba:', preferencesError);
          throw preferencesError;
        }
        
        console.log('✅ Ételkategóriák_Új adatok sikeresen betöltve:', preferencesDataResult);
        setPreferencesData(preferencesDataResult || []);
        
        // Felhasználói preferenciák betöltése
        const userPreferences = await fetchUserPreferences(user.id);
        console.log('👤 Felhasználói preferenciák betöltve:', userPreferences.length, 'db');
        console.log('📝 Preferenciák részletei:', userPreferences);
        
        // Preferenciák átalakítása objektummá
        const prefsObj: PreferenceState = {};
        
        // Először minden alapanyagot 'neutral'-ra állítunk
        categoryNames.forEach(categoryName => {
          const ingredients = getCategoryIngredients(categoryName, preferencesDataResult || []);
          ingredients.forEach(ingredient => {
            const key = `${categoryName}-${ingredient}`;
            prefsObj[key] = 'neutral';
          });
        });
        
        // Aztán felülírjuk a tárolt preferenciákkal
        userPreferences.forEach((pref: FoodPreference) => {
          const key = `${pref.category}-${pref.ingredient}`;
          prefsObj[key] = pref.preference;
          console.log(`🎯 Preferencia beállítva: ${key} -> ${pref.preference}`);
        });
        
        setPreferences(prefsObj);
        
        console.log('🎯 Összes preferencia betöltve:', Object.keys(prefsObj).length, 'alapanyag');
        
        // Debug: preferenciák számlálása
        const stats = {
          like: Object.values(prefsObj).filter(p => p === 'like').length,
          dislike: Object.values(prefsObj).filter(p => p === 'dislike').length,
          neutral: Object.values(prefsObj).filter(p => p === 'neutral').length
        };
        console.log('📊 Preferencia statisztikák:', stats);
        
      } catch (error) {
        console.error('❌ Adatok betöltési hiba:', error);
        toast({
          title: "Hiba történt",
          description: "Nem sikerült betölteni az adatokat.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user.id, toast]);

  const getCategoryIngredients = (categoryName: string, data: any[] = preferencesData) => {
    const ingredients: string[] = [];
    
    console.log('🔍 Kategória keresése:', categoryName);
    
    // Végigmegyünk az összes soron
    data.forEach((row, rowIndex) => {
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

  const handlePreferenceChange = (category: string, ingredient: string, preference: 'like' | 'dislike' | 'neutral') => {
    const key = `${category}-${ingredient}`;
    setPreferences(prev => ({
      ...prev,
      [key]: preference
    }));
    
    console.log(`🔄 Preferencia változott: ${ingredient} (${category}) -> ${preference}`);
  };

  const getPreferenceForIngredient = (category: string, ingredient: string): 'like' | 'dislike' | 'neutral' => {
    const key = `${category}-${ingredient}`;
    return preferences[key] || 'neutral';
  };

  const handleSave = async () => {
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

      console.log('💾 Mentendő preferenciák:', preferencesToSave.length, 'db');
      
      await saveUserPreferences(user.id, preferencesToSave);
      
      toast({
        title: "Preferenciák mentve! ✅",
        description: "Sikeresen frissítettük az ételpreferenciáidat!",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('❌ Preferenciák mentési hiba:', error);
      toast({
        title: "Hiba történt",
        description: "Nem sikerült menteni a preferenciákat.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getIngredientImage = (ingredient: string): string => {
    return '/placeholder.svg';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="text-white border-white/30 hover:bg-white/10 bg-white/10 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Vissza</span>
            </Button>
            <div className="text-white">
              <h1 className="text-xl font-bold">🍽️ Ételpreferenciáim</h1>
              <p className="text-sm opacity-80">Kezeld az ételpreferenciáidat</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="text-white border-white/30 hover:bg-white/10 bg-white/10 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Szerkesztés
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="sm"
                  className="text-white border-white/30 hover:bg-white/10 bg-white/10"
                >
                  Mégse
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Mentés...' : 'Mentés'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {categoryNames.map((categoryName) => {
          const ingredients = getCategoryIngredients(categoryName);
          if (ingredients.length === 0) {
            console.log(`⚠️ Nincs alapanyag a kategóriában: ${categoryName}`);
            return (
              <div key={categoryName} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  {categoryName}
                </h2>
                <div className="text-center p-8 bg-yellow-100 rounded-lg">
                  <p className="text-yellow-800">
                    Nincsenek alapanyagok ebben a kategóriában: {categoryName}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div key={categoryName} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                {categoryName} ({ingredients.length} alapanyag)
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {ingredients.map((ingredient) => {
                  const preference = getPreferenceForIngredient(categoryName, ingredient);
                  return (
                    <Card
                      key={ingredient}
                      className={`
                        relative overflow-hidden transition-all duration-300
                        ${preference === 'like' ? 'bg-green-100 border-green-300 scale-105 shadow-lg' : ''}
                        ${preference === 'dislike' ? 'bg-red-100 border-red-300 scale-95 opacity-70' : ''}
                        ${preference === 'neutral' ? 'bg-white border-gray-200' : ''}
                        ${isEditing ? 'cursor-pointer hover:scale-105' : ''}
                      `}
                    >
                      <div className="p-4">
                        {/* Ingredient Image */}
                        <div className="w-full h-16 mb-3 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
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
                        {isEditing ?  (
                          <div className="flex justify-center gap-2">
                            <Button
                              onClick={() => handlePreferenceChange(categoryName, ingredient, 'like')}
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
                              onClick={() => handlePreferenceChange(categoryName, ingredient, 'dislike')}
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
                        ) : (
                          <div className="flex justify-center">
                            {preference === 'like' && (
                              <div className="flex items-center text-green-600 text-sm font-medium">
                                <Heart className="w-4 h-4 fill-current mr-1" />
                                Szeretem
                              </div>
                            )}
                            {preference === 'dislike' && (
                              <div className="flex items-center text-red-600 text-sm font-medium">
                                <X className="w-4 h-4 mr-1" />
                                Nem szeretem
                              </div>
                            )}
                            {preference === 'neutral' && (
                              <div className="text-gray-500 text-sm">
                                Semleges
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
