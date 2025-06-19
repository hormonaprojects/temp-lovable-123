
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
import { PreferencesCategorySelector } from "./PreferencesCategorySelector";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface PreferencesPageProps {
  user: User;
}

export function PreferencesPage({ user }: PreferencesPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [userPreferences, setUserPreferences] = useState<FoodPreference[]>([]);
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
    loadUserPreferences();
  }, [user.id]);

  const loadUserPreferences = async () => {
    try {
      setLoading(true);
      console.log('🔄 Preferenciák betöltése...');
      
      const preferences = await fetchUserPreferences(user.id);
      setUserPreferences(preferences);
      
      console.log('✅ Preferenciák betöltve:', preferences.length, 'db');
    } catch (error) {
      console.error('❌ Preferenciák betöltési hiba:', error);
      toast({
        title: "Hiba történt",
        description: "Nem sikerült betölteni a preferenciákat.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceUpdate = async (ingredient: string, category: string, preference: 'like' | 'dislike' | 'neutral') => {
    try {
      console.log('🔄 Preferencia frissítése:', { ingredient, category, preference });
      
      // Update in database
      await updateUserPreference(user.id, ingredient, category, preference);
      
      // Update local state
      setUserPreferences(prev => {
        const existingIndex = prev.findIndex(p => 
          p.ingredient === ingredient && p.category === category
        );
        
        if (preference === 'neutral') {
          // Remove the preference if it exists
          return prev.filter(p => !(p.ingredient === ingredient && p.category === category));
        } else {
          // Add or update the preference
          const newPreference: FoodPreference = {
            id: existingIndex >= 0 ? prev[existingIndex].id : '',
            user_id: user.id,
            ingredient,
            category,
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

  const getStatsForCategory = (category: string) => {
    const categoryPrefs = userPreferences.filter(p => p.category === category);
    return {
      liked: categoryPrefs.filter(p => p.preference === 'like').length,
      disliked: categoryPrefs.filter(p => p.preference === 'dislike').length
    };
  };

  const getTotalStats = () => {
    return {
      liked: userPreferences.filter(p => p.preference === 'like').length,
      disliked: userPreferences.filter(p => p.preference === 'dislike').length,
      total: userPreferences.length
    };
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          <Card className="bg-purple-600/20 border-purple-400/50 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{totalStats.total}</div>
              <div className="text-white/80">Összes beállítás</div>
            </CardContent>
          </Card>
        </div>

        {/* Category Selection */}
        <Card className="bg-white/10 border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Utensils className="w-6 h-6 text-green-400" />
              Ételkategóriák
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map((category) => {
                const stats = getStatsForCategory(category);
                const isSelected = selectedCategory === category;
                
                return (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(isSelected ? "" : category)}
                    variant="outline"
                    className={`h-auto p-4 flex-col gap-2 transition-all duration-200 ${
                      isSelected
                        ? 'bg-purple-600/30 border-purple-400/50 text-white shadow-lg'
                        : 'bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="font-semibold text-center leading-tight">{category}</div>
                    <div className="flex gap-4 text-xs">
                      <Badge className="bg-green-600/30 text-green-400 border-green-400/50">
                        ❤️ {stats.liked}
                      </Badge>
                      <Badge className="bg-red-600/30 text-red-400 border-red-400/50">
                        👎 {stats.disliked}
                      </Badge>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Category Ingredient Selector */}
        {selectedCategory && (
          <PreferencesCategorySelector
            category={selectedCategory}
            userPreferences={userPreferences}
            onPreferenceUpdate={handlePreferenceUpdate}
          />
        )}
      </div>
    </div>
  );
}
