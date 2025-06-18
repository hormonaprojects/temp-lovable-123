
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, User, Activity, Heart, AlertTriangle } from 'lucide-react';
import { fetchUserProfile, updateUserProfile, UserProfile } from '@/services/profileQueries';
import { AvatarUpload } from './AvatarUpload';

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface UserProfilePageProps {
  user: User;
  onClose: () => void;
}

const activityLevels = [
  { value: 'sedentary', label: 'Ülő életmód', description: 'Kevés vagy semmi sport' },
  { value: 'lightly_active', label: 'Enyhén aktív', description: 'Könnyű sport 1-3 nap/hét' },
  { value: 'moderately_active', label: 'Mérsékelten aktív', description: 'Közepes sport 3-5 nap/hét' },
  { value: 'very_active', label: 'Nagyon aktív', description: 'Intenzív sport 6-7 nap/hét' },
  { value: 'extra_active', label: 'Rendkívül aktív', description: 'Napi 2x edzés vagy fizikai munka' }
];

const commonDietaryPreferences = [
  'Vegetáriánus', 'Vegán', 'Gluténmentes', 'Laktózmentes', 'Keto', 'Paleo', 'Mediterrán'
];

const commonAllergies = [
  'Dió', 'Mogyoró', 'Tej', 'Tojás', 'Szója', 'Búza', 'Tengeri herkentyűk', 'Hal'
];

export function UserProfilePage({ user, onClose }: UserProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDietaryPrefs, setSelectedDietaryPrefs] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, [user.id]);

  const loadProfile = async () => {
    try {
      const profileData = await fetchUserProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        setSelectedDietaryPrefs(profileData.dietary_preferences || []);
        setSelectedAllergies(profileData.allergies || []);
      }
    } catch (error) {
      console.error('Profil betöltési hiba:', error);
      toast({
        title: "Hiba történt",
        description: "Nem sikerült betölteni a profil adatokat.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        ...profile,
        dietary_preferences: selectedDietaryPrefs,
        allergies: selectedAllergies
      });

      toast({
        title: "Profil mentve! ✅",
        description: "Az adatok sikeresen frissítve lettek.",
      });
    } catch (error) {
      console.error('Profil mentési hiba:', error);
      toast({
        title: "Hiba történt",
        description: "Nem sikerült menteni a profil adatokat.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpdate = async (newAvatarUrl: string) => {
    if (profile) {
      const updatedProfile = { ...profile, avatar_url: newAvatarUrl };
      setProfile(updatedProfile);
      
      try {
        await updateUserProfile(user.id, { avatar_url: newAvatarUrl });
      } catch (error) {
        console.error('Avatar URL mentési hiba:', error);
      }
    }
  };

  const toggleDietaryPref = (pref: string) => {
    setSelectedDietaryPrefs(prev => 
      prev.includes(pref) 
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    );
  };

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev => 
      prev.includes(allergy) 
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Profil betöltése...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Nem sikerült betölteni a profil adatokat.</p>
            <Button onClick={onClose} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Vissza
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header - mobil optimalizált */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Mobil header */}
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 p-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Vissza</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Save className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{saving ? 'Mentés...' : 'Mentés'}</span>
            </Button>
          </div>
          
          {/* Cím és email */}
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Felhasználói Profil</h1>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Content - mobil optimalizált padding */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Profile Header Card - mobil optimalizált */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
              <AvatarUpload
                currentAvatarUrl={profile.avatar_url}
                userId={user.id}
                onAvatarUpdate={handleAvatarUpdate}
                userName={profile.full_name || user.fullName}
              />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {profile.full_name || user.fullName}
                </h2>
                <p className="text-gray-600 text-sm sm:text-base truncate max-w-xs sm:max-w-none">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kártyák grid - mobil optimalizált */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Alapadatok */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Alapadatok
              </CardTitle>
              <CardDescription className="text-sm">
                Személyes információk és fizikai adatok
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm">Teljes név</Label>
                <Input
                  id="fullName"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  placeholder="Teljes név"
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm">Kor (év)</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age || ''}
                    onChange={(e) => setProfile({...profile, age: parseInt(e.target.value) || null})}
                    placeholder="25"
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm">Súly (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={profile.weight || ''}
                    onChange={(e) => setProfile({...profile, weight: parseFloat(e.target.value) || null})}
                    placeholder="70"
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="text-sm">Magasság (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={profile.height || ''}
                  onChange={(e) => setProfile({...profile, height: parseFloat(e.target.value) || null})}
                  placeholder="175"
                  className="text-sm sm:text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Aktivitási szint */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                Aktivitási szint
              </CardTitle>
              <CardDescription className="text-sm">
                Napi fizikai aktivitás mértéke
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={profile.activity_level || ''}
                onValueChange={(value) => setProfile({...profile, activity_level: value})}
              >
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Válassz aktivitási szintet" />
                </SelectTrigger>
                <SelectContent>
                  {activityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className="font-medium text-sm">{level.label}</div>
                        <div className="text-xs text-gray-500">{level.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Étkezési preferenciák */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                Étkezési preferenciák
              </CardTitle>
              <CardDescription className="text-sm">
                Speciális étrendek és preferenciák
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {commonDietaryPreferences.map((pref) => (
                  <Badge
                    key={pref}
                    variant={selectedDietaryPrefs.includes(pref) ? "default" : "outline"}
                    className="cursor-pointer text-xs sm:text-sm py-1 px-2 sm:px-3"
                    onClick={() => toggleDietaryPref(pref)}
                  >
                    {pref}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Allergiák */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                Allergiák és intoleranciák
              </CardTitle>
              <CardDescription className="text-sm">
                Kerülendő összetevők és allergiák
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {commonAllergies.map((allergy) => (
                  <Badge
                    key={allergy}
                    variant={selectedAllergies.includes(allergy) ? "destructive" : "outline"}
                    className="cursor-pointer text-xs sm:text-sm py-1 px-2 sm:px-3"
                    onClick={() => toggleAllergy(allergy)}
                  >
                    {allergy}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fiók információk */}
        <Card className="mt-6 sm:mt-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Fiók információk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-4 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="font-medium text-gray-700 mb-1 sm:mb-0">Email cím:</span>
                <span className="text-gray-600 break-all sm:break-normal">{user.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="font-medium text-gray-700 mb-1 sm:mb-0">Profil létrehozva:</span>
                <span className="text-gray-600">
                  {new Date(profile.created_at).toLocaleDateString('hu-HU')}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="font-medium text-gray-700 mb-1 sm:mb-0">Utolsó frissítés:</span>
                <span className="text-gray-600">
                  {new Date(profile.updated_at).toLocaleDateString('hu-HU')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobil mentés gomb alul - csak mobilon látható */}
        <div className="mt-6 sm:hidden">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Mentés...' : 'Mentés'}
          </Button>
        </div>

        {/* Extra padding alul mobil navigációnak */}
        <div className="h-6 sm:h-0"></div>
      </div>
    </div>
  );
}
