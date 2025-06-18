
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Profil betöltése...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Vissza
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Felhasználói Profil</h1>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Mentés...' : 'Mentés'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Header Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AvatarUpload
                currentAvatarUrl={profile.avatar_url}
                userId={user.id}
                onAvatarUpdate={handleAvatarUpdate}
                userName={profile.full_name || user.fullName}
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.full_name || user.fullName}
                </h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Alapadatok */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Alapadatok
              </CardTitle>
              <CardDescription>
                Személyes információk és fizikai adatok
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Teljes név</Label>
                <Input
                  id="fullName"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  placeholder="Teljes név"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Kor (év)</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age || ''}
                    onChange={(e) => setProfile({...profile, age: parseInt(e.target.value) || null})}
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Súly (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={profile.weight || ''}
                    onChange={(e) => setProfile({...profile, weight: parseFloat(e.target.value) || null})}
                    placeholder="70"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Magasság (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={profile.height || ''}
                  onChange={(e) => setProfile({...profile, height: parseFloat(e.target.value) || null})}
                  placeholder="175"
                />
              </div>
            </CardContent>
          </Card>

          {/* Aktivitási szint */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Aktivitási szint
              </CardTitle>
              <CardDescription>
                Napi fizikai aktivitás mértéke
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={profile.activity_level || ''}
                onValueChange={(value) => setProfile({...profile, activity_level: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válassz aktivitási szintet" />
                </SelectTrigger>
                <SelectContent>
                  {activityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm text-gray-500">{level.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Étkezési preferenciák */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                Étkezési preferenciák
              </CardTitle>
              <CardDescription>
                Speciális étrendek és preferenciák
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {commonDietaryPreferences.map((pref) => (
                  <Badge
                    key={pref}
                    variant={selectedDietaryPrefs.includes(pref) ? "default" : "outline"}
                    className="cursor-pointer"
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Allergiák és intoleranciák
              </CardTitle>
              <CardDescription>
                Kerülendő összetevők és allergiák
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {commonAllergies.map((allergy) => (
                  <Badge
                    key={allergy}
                    variant={selectedAllergies.includes(allergy) ? "destructive" : "outline"}
                    className="cursor-pointer"
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
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Fiók információk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Email cím:</span>
                <span className="text-gray-600">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Profil létrehozva:</span>
                <span className="text-gray-600">
                  {new Date(profile.created_at).toLocaleDateString('hu-HU')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Utolsó frissítés:</span>
                <span className="text-gray-600">
                  {new Date(profile.updated_at).toLocaleDateString('hu-HU')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
