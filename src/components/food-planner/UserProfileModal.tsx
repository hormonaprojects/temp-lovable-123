
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Edit3 } from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

interface UserProfile {
  fullName: string;
  email: string;
  age: string;
  weight: string;
}

export function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile>({
    fullName: user.fullName,
    email: user.email,
    age: '',
    weight: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Betöltjük a mentett profil adatokat localStorage-ból
    const savedProfile = localStorage.getItem(`userProfile_${user.id}`);
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile({
          ...parsedProfile,
          email: user.email // Email-t mindig az aktuális session-ből vesszük
        });
      } catch (error) {
        console.error('Profil betöltési hiba:', error);
      }
    }
  }, [user.id, user.email]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Mentjük a profil adatokat localStorage-ba
      const profileToSave = {
        fullName: profile.fullName,
        age: profile.age,
        weight: profile.weight
      };
      localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(profileToSave));
      
      setIsEditing(false);
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
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white rounded-xl shadow-2xl border-0">
        <DialogHeader className="text-center pb-4 border-b border-gray-100">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Felhasználói Profil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Teljes Név */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Teljes Név
            </Label>
            <Input
              id="fullName"
              value={profile.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
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
              value={profile.email}
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
              value={profile.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
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
              value={profile.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
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
        <div className="flex justify-center gap-3 pt-4 border-t border-gray-100">
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
      </DialogContent>
    </Dialog>
  );
}
