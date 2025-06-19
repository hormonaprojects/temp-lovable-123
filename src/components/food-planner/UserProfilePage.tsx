
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, User, Heart, Utensils, LogOut, Settings, Star } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { fetchUserPreferences, FoodPreference } from "@/services/foodPreferencesQueries";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface UserProfilePageProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
}

interface StarRating {
  recipe_name: string;
  rating: number;
  date: string;
}

export function UserProfilePage({ user, onClose, onLogout }: UserProfilePageProps) {
  const [profileData, setProfileData] = useState<any>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [preferencesData, setPreferencesData] = useState<FoodPreference[]>([]);
  const [totalIngredientsCount, setTotalIngredientsCount] = useState(0);
  const [starRatings, setStarRatings] = useState<StarRating[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    loadProfileData();
  }, [user.id]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Profil adatok betöltése
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profil betöltési hiba:', profileError);
      } else {
        setProfileData(profile);
      }

      // Kedvencek számának betöltése
      const { data: favorites, error: favoritesError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id);

      if (favoritesError) {
        console.error('Kedvencek betöltési hiba:', favoritesError);
      } else {
        setFavoritesCount(favorites?.length || 0);
      }

      // Preferenciák betöltése
      const preferences = await fetchUserPreferences(user.id);
      setPreferencesData(preferences);

      // Kategóriás statisztikák betöltése
      await loadCategoryStats(preferences);

      // Csillagos értékelések betöltése
      await loadStarRatings();

      // Összes alapanyag számának meghatározása
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('Ételkategóriák_Új')
        .select('*');

      if (!categoriesError && categoriesData) {
        let totalIngredients = 0;
        categoryNames.forEach(categoryName => {
          categoriesData.forEach(row => {
            const categoryValue = row[categoryName];
            if (categoryValue && typeof categoryValue === 'string' && categoryValue.trim() !== '' && categoryValue !== 'EMPTY') {
              totalIngredients++;
            }
          });
        });

        setTotalIngredientsCount(totalIngredients);
      }
      
    } catch (error) {
      console.error('Adatok betöltési hiba:', error);
      toast({
        title: "Hiba történt",
        description: "Nem sikerült betölteni a profil adatokat.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryStats = async (preferences: FoodPreference[]) => {
    try {
      const { data: categoriesData, error } = await supabase
        .from('Ételkategóriák_Új')
        .select('*');

      if (error || !categoriesData) return;

      const stats = categoryNames.map(categoryName => {
        // Kategóriához tartozó összes alapanyag
        const categoryIngredients: string[] = [];
        categoriesData.forEach(row => {
          const categoryValue = row[categoryName];
          if (categoryValue && typeof categoryValue === 'string' && categoryValue.trim() !== '' && categoryValue !== 'EMPTY') {
            categoryIngredients.push(categoryValue.trim());
          }
        });

        // Preferenciák számolása erre a kategóriára
        const categoryPrefs = preferences.filter(p => p.category === categoryName);
        const liked = categoryPrefs.filter(p => p.preference === 'like').length;
        const disliked = categoryPrefs.filter(p => p.preference === 'dislike').length;
        const neutral = categoryIngredients.length - liked - disliked;

        return {
          category: categoryName,
          Kedvelem: liked,
          'Nem szeretem': disliked,
          Semleges: neutral,
          total: categoryIngredients.length
        };
      });

      setCategoryStats(stats);
    } catch (error) {
      console.error('Kategória statisztikák betöltési hiba:', error);
    }
  };

  const loadStarRatings = async () => {
    try {
      const { data: ratings, error } = await supabase
        .from('Értékelések')
        .select('*')
        .order('Dátum', { ascending: false });

      if (error) {
        console.error('Értékelések betöltési hiba:', error);
        return;
      }

      // Az értékelések formázása
      const formattedRatings: StarRating[] = (ratings || []).map(rating => ({
        recipe_name: rating['Recept neve'] || 'Ismeretlen recept',
        rating: parseInt(rating['Értékelés']) || 0,
        date: new Date(rating['Dátum']).toLocaleDateString('hu-HU') || 'Ismeretlen dátum'
      })).filter(rating => rating.rating > 0);

      setStarRatings(formattedRatings);
    } catch (error) {
      console.error('Csillagos értékelések betöltési hiba:', error);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    toast({
      title: "Profil szerkesztés",
      description: "A profil szerkesztő funkció hamarosan elérhető lesz!",
    });
  };

  const handleShowFavorites = () => {
    onClose();
    // Navigate to favorites - this will be handled by the parent component
    window.dispatchEvent(new CustomEvent('navigate-to-favorites'));
  };

  const handleShowPreferences = () => {
    onClose();
    // Navigate to preferences - this will be handled by the parent component  
    window.dispatchEvent(new CustomEvent('navigate-to-preferences'));
  };

  const getPreferenceStats = () => {
    const liked = preferencesData.filter(p => p.preference === 'like').length;
    const disliked = preferencesData.filter(p => p.preference === 'dislike').length;
    const neutral = totalIngredientsCount - liked - disliked;
    
    return { 
      liked, 
      disliked, 
      neutral, 
      total: totalIngredientsCount,
      storedPreferences: preferencesData.length 
    };
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const preferenceStats = getPreferenceStats();

  // Chart colors
  const COLORS = ['#10B981', '#EF4444', '#6B7280']; // green, red, gray

  const chartConfig = {
    Kedvelem: {
      label: "Kedvelem",
      color: "#10B981",
    },
    'Nem szeretem': {
      label: "Nem szeretem", 
      color: "#EF4444",
    },
    Semleges: {
      label: "Semleges",
      color: "#6B7280",
    },
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="text-white border-white/50 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Vissza
            </Button>
            <div className="text-white">
              <h1 className="text-xl font-bold">👤 Profilom</h1>
              <p className="text-sm opacity-80">Személyes adatok és beállítások</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="text-white border-white/50 bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Kijelentkezés
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profil áttekintés */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              Profil áttekintés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                <AvatarImage src={profileData?.avatar_url || undefined} alt="Profil kép" />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-lg font-bold">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{user.fullName}</h2>
                <p className="text-gray-600 mb-4">{user.email}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {profileData?.age && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Életkor</p>
                      <p className="text-lg font-semibold text-blue-600">{profileData.age} év</p>
                    </div>
                  )}
                  {profileData?.weight && (
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Testsúly</p>
                      <p className="text-lg font-semibold text-green-600">{profileData.weight} kg</p>
                    </div>
                  )}
                  {profileData?.height && (
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Magasság</p>
                      <p className="text-lg font-semibold text-purple-600">{profileData.height} cm</p>
                    </div>
                  )}
                  {profileData?.activity_level && (
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Aktivitási szint</p>
                      <p className="text-lg font-semibold text-orange-600">{profileData.activity_level}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                onClick={handleEditProfile}
                variant="outline"
                size="sm"
                className="bg-blue-100 border-blue-400 text-blue-700 hover:bg-blue-200 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Szerkesztés
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statisztikák */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kedvenc receptek */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Kedvenc receptek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6">
                <div className="text-4xl font-bold text-red-500 mb-2">{favoritesCount}</div>
                <p className="text-gray-600">mentett recept</p>
                <Button
                  onClick={handleShowFavorites}
                  variant="outline"
                  size="sm"
                  className="mt-4 bg-red-100 border-red-400 text-red-700 hover:bg-red-200"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Mutatsd
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ételpreferenciák */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-green-500" />
                Ételpreferenciák
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-green-500 mb-2">{preferenceStats.total}</div>
                  <p className="text-gray-600">összesen alapanyag</p>
                  <p className="text-xs text-gray-500">{preferenceStats.storedPreferences} beállított preferencia</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Kedvelem</span>
                    <Badge className="bg-green-100 text-green-800">
                      {preferenceStats.liked} db
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nem szeretem</span>
                    <Badge className="bg-red-100 text-red-800">
                      {preferenceStats.disliked} db
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Semleges</span>
                    <Badge className="bg-gray-100 text-gray-800">
                      {preferenceStats.neutral} db
                    </Badge>
                  </div>
                </div>
                
                <Button
                  onClick={handleShowPreferences}
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 bg-green-100 border-green-400 text-green-700 hover:bg-green-200"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Részletek
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preferenciák diagram kategóriánként */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
              <Utensils className="w-6 h-6 text-green-600" />
              Ételpreferenciák kategóriánként
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis 
                    dataKey="category" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="Kedvelem" fill="#10B981" />
                  <Bar dataKey="Nem szeretem" fill="#EF4444" />
                  <Bar dataKey="Semleges" fill="#6B7280" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Csillagos értékelések */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Receptértékeléseim
            </CardTitle>
          </CardHeader>
          <CardContent>
            {starRatings.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {starRatings.slice(0, 9).map((rating, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2 truncate">{rating.recipe_name}</h4>
                      <div className="flex items-center gap-2 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rating.rating 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600">({rating.rating}/5)</span>
                      </div>
                      <p className="text-xs text-gray-500">{rating.date}</p>
                    </div>
                  ))}
                </div>
                
                {starRatings.length > 9 && (
                  <div className="text-center pt-4">
                    <p className="text-gray-600">
                      És még {starRatings.length - 9} értékelés...
                    </p>
                  </div>
                )}
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Összes értékelés:</span>
                    <span className="font-semibold text-blue-600">{starRatings.length} db</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Átlagos értékelés:</span>
                    <span className="font-semibold text-blue-600">
                      {starRatings.length > 0 
                        ? (starRatings.reduce((sum, r) => sum + r.rating, 0) / starRatings.length).toFixed(1)
                        : '0'
                      } ⭐
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Még nem értékeltél egyetlen receptet sem.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Az értékeléseid itt fognak megjelenni, miután csillagokkal értékelsz recepteket.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
