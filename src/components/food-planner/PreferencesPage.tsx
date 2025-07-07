
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Utensils } from "lucide-react";
import { 
  fetchUserPreferences, 
  updateUserPreference,
  FoodPreference 
} from "@/services/foodPreferencesQueries";
import { 
  getUserFavorites, 
  addUserFavorite, 
  removeUserFavorite, 
  UserFavorite 
} from "@/services/userFavorites";
import { IngredientsGrid } from "./IngredientsGrid";
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface PreferencesPageProps {
  user: User;
  onClose: () => void;
}

export function PreferencesPage({ user, onClose }: PreferencesPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [userPreferences, setUserPreferences] = useState<FoodPreference[]>([]);
  const [userFavorites, setUserFavorites] = useState<UserFavorite[]>([]);
  const [categoryIngredients, setCategoryIngredients] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const categories = [
    'Húsfélék',
    'Halak',
    'Zöldségek / Vegetáriánus',
    'Tejtermékek',
    'Gyümölcsök',
    'Gabonák és Tészták',
    'Olajok és Magvak'
  ];

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 ÚJ: Preferenciák, kedvencek és kategória adatok betöltése...');
      
      // ÚJ: Minden adat egyidejű betöltése az új táblákból
      const [preferences, favorites, categoriesData, ingredientsData] = await Promise.all([
        fetchUserPreferences(user.id),
        getUserFavorites(user.id),
        supabase.from('elelmiszer_kategoriak').select('*').order('Kategoriak'),
        supabase.from('elelmiszer_kep').select('*').order('Elelmiszer_nev')
      ]);

      if (categoriesData.error) {
        throw categoriesData.error;
      }
      
      if (ingredientsData.error) {
        throw ingredientsData.error;
      }

      // ÚJ: Kategória alapanyagok feldolgozása az új táblákból
      const categoryIngredientsMap: Record<string, string[]> = {};
      
      categories.forEach(categoryName => {
        // Megkeressük a kategóriát a kategoriak táblában
        const categoryData = categoriesData.data?.find(cat => cat.Kategoriak === categoryName);
        
        if (categoryData) {
          // Megkeressük az ehhez a kategóriához tartozó élelmiszereket
          const categoryIngredients = ingredientsData.data?.filter(ing => 
            ing.Kategoria_ID === categoryData.Kategoria_ID
          ) || [];
          
          // Élelmiszer nevek kinyerése
          const ingredients = categoryIngredients
            .map(ing => ing.Elelmiszer_nev)
            .filter(name => name && name.trim() !== '')
            .sort();
          
          categoryIngredientsMap[categoryName] = ingredients;
          console.log(`✅ ÚJ: ${categoryName} - ${ingredients.length} alapanyag`);
        } else {
          console.warn(`⚠️ Kategória nem található: ${categoryName}`);
          categoryIngredientsMap[categoryName] = [];
        }
      });

      setUserPreferences(preferences);
      setUserFavorites(favorites);
      setCategoryIngredients(categoryIngredientsMap);
      
      console.log('✅ ÚJ adatok betöltve:', {
        preferences: preferences.length,
        favorites: favorites.length,
        categories: Object.keys(categoryIngredientsMap).length,
        totalIngredients: Object.values(categoryIngredientsMap).reduce((sum, arr) => sum + arr.length, 0)
      });
      
    } catch (error) {
      console.error('❌ Adatok betöltési hiba:', error);
      toast({
        title: "Hiba történt",
        description: "Nem sikerült betölteni a preferenciákat.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    
    // Görgessünk le az alapanyagokhoz
    setTimeout(() => {
      const ingredientsSection = document.querySelector('[data-scroll-target="category-ingredients"]');
      if (ingredientsSection) {
        ingredientsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  const handlePreferenceUpdate = async (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => {
    if (!selectedCategory) return;
    
    try {
      console.log('🔄 Preferencia frissítése:', { ingredient, category: selectedCategory, preference });
      
      // Update in database
      await updateUserPreference(user.id, ingredient, selectedCategory, preference);
      
      // Update local state
      setUserPreferences(prev => {
        const existingIndex = prev.findIndex(p => 
          p.ingredient === ingredient && p.category === selectedCategory
        );
        
        if (preference === 'neutral') {
          // Remove the preference if it exists
          return prev.filter(p => !(p.ingredient === ingredient && p.category === selectedCategory));
        } else {
          // Add or update the preference
          const newPreference: FoodPreference = {
            id: existingIndex >= 0 ? prev[existingIndex].id : crypto.randomUUID(),
            user_id: user.id,
            ingredient,
            category: selectedCategory,
            preference,
            created_at: existingIndex >= 0 ? prev[existingIndex].created_at : new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          if (existingIndex >= 0) {
            // Update existing
            const updated = [...prev];
            updated[existingIndex] = newPreference;
            return updated;
          } else {
            // Add new
            return [...prev, newPreference];
          }
        }
      });
      
      console.log('✅ Preferencia sikeresen frissítve');
    } catch (error) {
      console.error('❌ Preferencia frissítési hiba:', error);
      toast({
        title: "Hiba történt",
        description: "Nem sikerült frissíteni a preferenciát.",
        variant: "destructive"
      });
    }
  };

  const handleFavoriteChange = async (ingredient: string, isFavorite: boolean) => {
    if (!selectedCategory) return;
    
    try {
      console.log('🔄 Kedvenc frissítése:', { ingredient, category: selectedCategory, isFavorite });
      
      if (isFavorite) {
        // Add to favorites
        const success = await addUserFavorite(user.id, selectedCategory, ingredient);
        if (success) {
          // Update local state
          const newFavorite: UserFavorite = {
            id: crypto.randomUUID(),
            user_id: user.id,
            category: selectedCategory,
            ingredient,
            created_at: new Date().toISOString()
          };
          setUserFavorites(prev => [...prev, newFavorite]);
          
          // If favorite, also set preference to like
          if (getPreferenceForIngredient(ingredient) !== 'like') {
            await handlePreferenceUpdate(ingredient, 'like');
          }
          
          console.log('✅ Kedvenc hozzáadva');
        }
      } else {
        // Remove from favorites
        const success = await removeUserFavorite(user.id, selectedCategory, ingredient);
        if (success) {
          // Update local state
          setUserFavorites(prev => 
            prev.filter(fav => !(fav.ingredient === ingredient && fav.category === selectedCategory))
          );
          console.log('✅ Kedvenc eltávolítva');
        }
      }
    } catch (error) {
      console.error('❌ Kedvenc kezelési hiba:', error);
      toast({
        title: "Hiba történt",
        description: "Nem sikerült frissíteni a kedvencet.",
        variant: "destructive"
      });
    }
  };

  const getStatsForCategory = (category: string) => {
    const availableIngredients = categoryIngredients[category] || [];
    const categoryPrefs = userPreferences.filter(p => 
      p.category === category && availableIngredients.includes(p.ingredient)
    );
    const categoryFavs = userFavorites.filter(f => 
      f.category === category && availableIngredients.includes(f.ingredient)
    );
    
    return {
      liked: categoryPrefs.filter(p => p.preference === 'like').length,
      disliked: categoryPrefs.filter(p => p.preference === 'dislike').length,
      favorites: categoryFavs.length
    };
  };

  const getTotalStats = () => {
    let totalLiked = 0;
    let totalDisliked = 0;
    let totalFavorites = 0;
    
    categories.forEach(category => {
      const stats = getStatsForCategory(category);
      totalLiked += stats.liked;
      totalDisliked += stats.disliked;
      totalFavorites += stats.favorites;
    });
    
    return {
      liked: totalLiked,
      disliked: totalDisliked,
      favorites: totalFavorites,
      total: totalLiked + totalDisliked
    };
  };

  const getPreferenceForIngredient = (ingredient: string): 'like' | 'dislike' | 'neutral' => {
    if (!selectedCategory) return 'neutral';
    
    const preference = userPreferences.find(p => 
      p.ingredient === ingredient && p.category === selectedCategory
    );
    return preference?.preference || 'neutral';
  };

  const getFavoriteForIngredient = (ingredient: string): boolean => {
    if (!selectedCategory) return false;
    
    return userFavorites.some(f => 
      f.ingredient === ingredient && f.category === selectedCategory
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Preferenciák betöltése...</p>
        </div>
      </div>
    );
  }

  const totalStats = getTotalStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Settings className="w-8 h-8 text-green-400" />
            Ételpreferenciáim
          </h1>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-green-600/20 border-green-400/50 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{totalStats.liked}</div>
              <div className="text-white/80">Kedvelt alapanyag</div>
            </CardContent>
          </Card>
          <Card className="bg-red-600/20 border-red-400/50 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-red-400 mb-2">{totalStats.disliked}</div>
              <div className="text-white/80">Nem kedvelt alapanyag</div>
            </CardContent>
          </Card>
          <Card className="bg-pink-600/20 border-pink-400/50 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-pink-400 mb-2">{totalStats.favorites}</div>
              <div className="text-white/80">Kedvenc alapanyag</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-600/20 border-purple-400/50 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{totalStats.total}</div>
              <div className="text-white/80">Összes beállítás</div>
            </CardContent>
          </Card>
        </div>

        {/* Category Selection */}
        <Card className="bg-white/10 border-white/20 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Utensils className="w-6 h-6 text-green-400" />
              Ételkategóriák
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {categories.map((category) => {
                const stats = getStatsForCategory(category);
                const isSelected = selectedCategory === category;
                
                return (
                  <Button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    variant="outline"
                    className={`h-auto p-3 sm:p-4 flex-col gap-2 transition-all duration-200 text-sm sm:text-base ${
                      isSelected
                        ? 'bg-purple-600/30 border-purple-400/50 text-white shadow-lg ring-2 ring-purple-400/50'
                        : 'bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="font-medium text-center leading-tight whitespace-normal break-words w-full">
                      {category}
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge className="bg-green-600/30 text-green-400 border-green-400/50 text-xs px-2 py-1">
                        ❤️ {stats.liked}
                      </Badge>
                      <Badge className="bg-red-600/30 text-red-400 border-red-400/50 text-xs px-2 py-1">
                        👎 {stats.disliked}
                      </Badge>
                      <Badge className="bg-pink-600/30 text-pink-400 border-pink-400/50 text-xs px-2 py-1">
                        💖 {stats.favorites}
                      </Badge>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ingredients for Selected Category */}
        {selectedCategory && (
          <div data-scroll-target="category-ingredients">
            <Card className="bg-white/10 border-white/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-xl text-center">
                  {selectedCategory} alapanyagai
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <IngredientsGrid
                  ingredients={categoryIngredients[selectedCategory] || []}
                  categoryName={selectedCategory}
                  getPreferenceForIngredient={getPreferenceForIngredient}
                  getFavoriteForIngredient={getFavoriteForIngredient}
                  onPreferenceChange={handlePreferenceUpdate}
                  onFavoriteChange={handleFavoriteChange}
                  hideDisliked={false}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
