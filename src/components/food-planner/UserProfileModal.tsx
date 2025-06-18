
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Edit3, ExternalLink, ArrowLeft } from "lucide-react";
import { fetchUserProfile, updateUserProfile, UserProfile } from "@/services/profileQueries";
import { AvatarUpload } from "./AvatarUpload";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  onOpenFullProfile?: () => void;
}

export function UserProfileModal({ isOpen, onClose, user, onOpenFullProfile }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen, user.id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const profileData = await fetchUserProfile(user.id);
      if (profileData) {
        setProfile(profileData);
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

    setIsSaving(true);
    try {
      await updateUserProfile(user.id, {
        full_name: profile.full_name,
        age: profile.age,
        weight: profile.weight
      });
      
      setIsEditing(false);
      toast({
        title: "Profil mentve! ✅",
        description: "Az alapadatok sikeresen frissítve lettek.",
      });
    } catch (error) {
      console.error('Profil mentési hiba:', error);
      toast({
        title: "Hiba történt",
        description: "Nem sikerült menteni a profil adatokat.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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

  const handleInputChange = (field: keyof UserProfile, value: string | number | null) => {
    if (profile) {
      setProfile(prev => prev ? {
        ...prev,
        [field]: value
      } : null);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto bg-white rounded-xl shadow-2xl border-0">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Betöltés...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white rounded-xl shadow-2xl border-0">
        <DialogHeader className="text-center pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex-1">
              Felhasználói Profil
            </DialogTitle>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Profilkép */}
          <div className="flex justify-center">
            <AvatarUpload
              currentAvatarUrl={profile?.avatar_url}
              userId={user.id}
              onAvatarUpdate={handleAvatarUpdate}
              userName={profile?.full_name || user.fullName}
            />
          </div>

          {/* Teljes Név */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Teljes Név
            </Label>
            <Input
              id="fullName"
              value={profile?.full_name || ''}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              disabled={!isEditing}
              className={`transition-all duration-200 ${
                isEditing 
                  ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            />
          </div>

          {/* Email cím (nem szerkeszthető) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email cím
            </Label>
            <Input
              id="email"
              value={user.email}
              disabled={true}
              className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">Az email cím nem módosítható</p>
          </div>

          {/* Kor */}
          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm font-medium text-gray-700">
              Kor (év)
            </Label>
            <Input
              id="age"
              type="number"
              value={profile?.age || ''}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || null)}
              disabled={!isEditing}
              placeholder="Például: 25"
              className={`transition-all duration-200 ${
                isEditing 
                  ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            />
          </div>

          {/* Súly */}
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
              Súly (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={profile?.weight || ''}
              onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || null)}
              disabled={!isEditing}
              placeholder="Például: 70"
              className={`transition-all duration-200 ${
                isEditing 
                  ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            />
          </div>
        </div>

        {/* Gombok */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
          {/* Részletes profil gomb */}
          {onOpenFullProfile && (
            <Button
              onClick={() => {
                onOpenFullProfile();
                onClose();
              }}
              variant="outline"
              className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <ExternalLink className="w-4 h-4" />
              Részletes profil megnyitása
            </Button>
          )}

          {/* Szerkesztés/Mentés gombok */}
          <div className="flex justify-center gap-3">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Edit3 className="w-4 h-4" />
                Szerkesztés
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="px-6 py-2 rounded-lg font-medium border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  Mégse
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Mentés...' : 'Mentés'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
