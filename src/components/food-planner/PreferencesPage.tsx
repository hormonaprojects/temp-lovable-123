
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Utensils, Heart, X, Plus, Minus } from "lucide-react";
import { CategoryIngredientSelector } from "./CategoryIngredientSelector";
import { 
  fetchUserPreferences, 
  updateUserPreference, 
  FoodPreference 
} from "@/services/foodPreferencesQueries";
import { useToast } from "@/hooks/use-toast";
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

interface CategorySummary {
  category: string;
  liked: number;
  disliked: number;
  total: number;
}

export function PreferencesPage({ user, onClose }: PreferencesPageProps) {
  const [preferences, setPreferences] = useState<FoodPreference[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
    loadPreferences();
  }, [user.id]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      
      // Preferenciák betöltése
      const userPrefs = await fetchUserPreferences(user.id);
      setPreferences(userPrefs);

      // Kategóriás összesítések számítása
      await calculateCategorySummaries(userPrefs);
      
    } catch (error) {
      console.error('Preferenciák betöltési hiba:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a preferenciákat.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCategorySummaries = async (userPrefs: FoodPreference[]) => {
    try {
      const { data: categoriesData, error } = await supabase
        .from('Ételkategóriák_Új')
        .select('*');

      if (error || !categoriesData) return;

      const summaries = categoryNames.map(categoryName => {
        // Kategóriához tartozó összes alapanyag
        const categoryIngredients: string[] = [];
        categoriesData.forEach(row => {
          const categoryValue = row[categoryName];
          if (categoryValue && typeof categoryValue === 'string' && categoryValue.trim() !== '' && categoryValue !== 'EMPTY') {
            categoryIngredients.push(categoryValue.trim());
          }
        });

        // Preferenciák számolása erre a kategóriára
        const categoryPrefs = userPrefs.filter(p => p.category === categoryName);
        const liked = categoryPrefs.filter(p => p.preference === 'like').length;
        const disliked = categoryPrefs.filter(p => p.preference === 'dislike').length;

        return {
          category: categoryName,
          liked,
          disliked,
          total: categoryIngredients.length
        };
      });

      setCategorySummaries(summaries);
    } catch (error) {
      console.error('Kategória összesítések számítási hiba:', error);
    }
  };

  const handlePreferenceUpdate = async (ingredient: string, category: string, preference: 'like' | 'dislike' | 'neutral') => {
    try {
      await updateUserPreference(user.id, ingredient, category, preference);
      
      // Frissítjük a helyi állapotot
      setPreferences(prev => {
        const filtered = prev.filter(p => !(p.ingredient === ingredient && p.category === category));
        if (preference !== 'neutral') {
          const newPreference: FoodPreference = {
            id: `temp_${Date.now()}`,
            user_id: user.id,
            ingredient,
            category,
            preference,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          return [...filtered, newPreference];
        }
        return filtered;
      });

      // Újraszámoljuk a kategória összesítéseket
      const updatedPrefs = preferences.filter(p => !(p.ingredient === ingredient && p.category === category));
      if (preference !== 'neutral') {
        const newPreference: FoodPreference = {
          id: `temp_${Date.now()}`,
          user_id: user.id,
          ingredient,
          category,
          preference,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        updatedPrefs.push(newPreference);
      }
      await calculateCategorySummaries(updatedPrefs);

    } catch (error) {
      console.error('Preferencia frissítési hiba:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült frissíteni a preferenciát.",
        variant: "destructive"
      });
    }
  };

  const getTotalStats = () => {
    const totalLiked = categorySummaries.reduce((sum, cat) => sum + cat.liked, 0);
    const totalDisliked = categorySummaries.reduce((sum, cat) => sum + cat.disliked, 0);
    const totalIngredients = categorySummaries.reduce((sum, cat) => sum + cat.total, 0);
    const totalNeutral = totalIngredients - totalLiked - totalDisliked;
    
    return { totalLiked, totalDisliked, totalNeutral, totalIngredients };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Preferenciák betöltése...</p>
        </div>
      </div>
    );
  }

  const stats = getTotalStats();

  if (selectedCategory) {
    return (
      <div>
        <div className="mb-6">
          <Button
            onClick={() => setSelectedCategory(null)}
            variant="ghost"
            size="sm"
            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:text-white transition-all duration-200 mb-4"
          >
            ← Vissza a kategóriákhoz
          </Button>
          
          <h2 className="text-2xl font-bold text-white mb-2">{selectedCategory}</h2>
          <p className="text-white/70">Válaszd ki, mit szeretsz és mit nem</p>
        </div>

        <CategoryIngredientSelector
          selectedCategory={selectedCategory}
          userPreferences={preferences}
          onPreferenceUpdate={handlePreferenceUpdate}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Összefoglaló statisztikák */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Összes alapanyag</p>
                <p className="text-2xl font-bold">{stats.totalIngredients}</p>
              </div>
              <Utensils className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Kedvelem</p>
                <p className="text-2xl font-bold text-green-400">{stats.totalLiked}</p>
              </div>
              <Plus className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Nem szeretem</p>
                <p className="text-2xl font-bold text-red-400">{stats.totalDisliked}</p>
              </div>
              <Minus className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Semleges</p>
                <p className="text-2xl font-bold text-gray-400">{stats.totalNeutral}</p>
              </div>
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kategóriák listája */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categorySummaries.map((category) => (
          <Card 
            key={category.category}
            className="bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group"
            onClick={() => setSelectedCategory(category.category)}
          >
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="text-lg">{category.category}</span>
                <Settings className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Összes alapanyag</span>
                  <Badge className="bg-blue-600/20 text-blue-400 border-blue-400/50">
                    {category.total} db
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Kedvelem</span>
                  <Badge className="bg-green-600/20 text-green-400 border-green-400/50">
                    {category.liked} db
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Nem szeretem</span>
                  <Badge className="bg-red-600/20 text-red-400 border-red-400/50">
                    {category.disliked} db
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Semleges</span>
                  <Badge className="bg-gray-600/20 text-gray-400 border-gray-400/50">
                    {category.total - category.liked - category.disliked} db
                  </Badge>
                </div>

                {/* Haladás sáv */}
                <div className="mt-4">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="flex h-full rounded-full overflow-hidden">
                      <div 
                        className="bg-green-500"
                        style={{ width: `${(category.liked / category.total) * 100}%` }}
                      />
                      <div 
                        className="bg-red-500"
                        style={{ width: `${(category.disliked / category.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    {Math.round(((category.liked + category.disliked) / category.total) * 100)}% beállítva
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
