
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SingleRecipeApp } from "./SingleRecipeApp";
import { DailyMealPlanner } from "./DailyMealPlanner";
import { UserProfilePage } from "./UserProfilePage";
import { UserProfileModal } from "./UserProfileModal";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchUserProfile } from "@/services/profileQueries";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface FoodPlannerAppProps {
  user: User;
  onLogout: () => void;
}

export function FoodPlannerApp({ user, onLogout }: FoodPlannerAppProps) {
  const [currentView, setCurrentView] = useState<'single' | 'daily' | 'profile'>('single');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await fetchUserProfile(user.id);
        setUserProfile(profile);
      } catch (error) {
        console.error('Profil betöltési hiba:', error);
      }
    };

    loadUserProfile();
  }, [user.id]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (currentView === 'profile') {
    return (
      <UserProfilePage
        user={user}
        onClose={() => setCurrentView('single')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
          <div className="text-white text-center sm:text-left">
            <h1 className="text-lg sm:text-xl font-bold">🍽️ Ételtervező</h1>
            <p className="text-xs sm:text-sm opacity-80">Üdv, {user.fullName}!</p>
          </div>
          
          {/* Jobb oldali gombok */}
          <div className="flex items-center gap-3">
            {/* Profil gomb profilképpel */}
            <Button
              onClick={() => setShowProfileModal(true)}
              variant="outline"
              size="sm"
              className="text-white border-white/30 hover:bg-white/10 bg-white/10 flex items-center gap-2 pl-2"
            >
              <Avatar className="w-6 h-6 border border-white/30">
                <AvatarImage src={userProfile?.avatar_url || undefined} alt="Profilkép" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                  {getInitials(userProfile?.full_name || user.fullName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">Profil</span>
            </Button>
            
            {/* Kijelentkezés gomb */}
            <Button
              onClick={onLogout}
              variant="outline"
              className="text-white border-white/30 hover:bg-white/10 bg-white/10 text-sm px-4 py-2"
            >
              Kijelentkezés
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-4 sm:py-8">
        {currentView === 'single' ? (
          <SingleRecipeApp
            user={user}
            onToggleDailyPlanner={() => setCurrentView('daily')}
          />
        ) : (
          <DailyMealPlanner
            user={user}
            onBackToSingle={() => setCurrentView('single')}
          />
        )}
      </div>

      {/* Profil Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onOpenFullProfile={() => {
          setShowProfileModal(false);
          setCurrentView('profile');
        }}
      />
    </div>
  );
}
