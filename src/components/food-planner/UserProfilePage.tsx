
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, User, Heart, Utensils, LogOut, Settings } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { fetchUserPreferences, FoodPreference } from "@/services/foodPreferencesQueries";

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

export function UserProfilePage({ user, onClose, onLogout }: UserProfilePageProps) {
  const [profileData, setProfileData] = useState<any>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [preferencesData, setPreferencesData] = useState<FoodPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      console.log('📊 Profil oldalon betöltött preferenciák:', preferences.length, 'db');
      console.log('📝 Preferenciák részletei:', preferences.slice(0, 5));
      
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

  const getPreferenceStats = () => {
    const liked = preferencesData.filter(p => p.preference === 'like').length;
    const disliked = preferencesData.filter(p => p.preference === 'dislike').length;
    const neutral = preferencesData.filter(p => p.preference === 'neutral').length;
    
    return { liked, disliked, neutral, total: preferencesData.length };
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const preferenceStats = getPreferenceStats();

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
              className="text-white border-white/30 hover:bg-white/10 bg-white/10"
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
              className="text-white border-white/30 hover:bg-white/10 bg-white/10 flex items-center gap-2"
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
                variant="outline"
                size="sm"
                className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 flex items-center gap-2"
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
                  variant="outline"
                  size="sm"
                  className="mt-4 bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Részletek
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
                  <p className="text-gray-600">beállított preferencia</p>
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
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Részletek
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug információk (fejlesztés során) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-800">Debug - Preferenciák</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-yellow-700">
                <p>Összes preferencia: {preferencesData.length}</p>
                <p>Kedvelem: {preferenceStats.liked}</p>
                <p>Nem szeretem: {preferenceStats.disliked}</p>
                <p>Semleges: {preferenceStats.neutral}</p>
                {preferencesData.length > 0 && (
                  <details className="mt-2">
                    <summary>Preferenciák részletei</summary>
                    <pre className="text-xs mt-2 bg-yellow-100 p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(preferencesData.slice(0, 5), null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
