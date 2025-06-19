
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SingleRecipeApp } from "./SingleRecipeApp";
import { DailyMealPlanner } from "./DailyMealPlanner";
import { UserProfilePage } from "./UserProfilePage";
import { UserProfileModal } from "./UserProfileModal";
import { FavoritesPage } from "./FavoritesPage";
import { PreferenceSetup } from "./PreferenceSetup";
import { PreferencesPage } from "./PreferencesPage";
import { AdminDashboard } from "../admin/AdminDashboard";
import { User, Settings, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchUserProfile } from "@/services/profileQueries";
import { checkUserHasPreferences } from "@/services/foodPreferencesQueries";
import { checkIsAdmin } from "@/services/adminQueries";
import { Star } from "lucide-react";

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
  const [currentView, setCurrentView] = useState<'single' | 'daily' | 'profile' | 'favorites' | 'preference-setup' | 'preferences' | 'admin'>('single');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [hasPreferences, setHasPreferences] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [profile, preferencesExist, adminStatus] = await Promise.all([
          fetchUserProfile(user.id),
          checkUserHasPreferences(user.id),
          checkIsAdmin(user.id)
        ]);
        
        setUserProfile(profile);
        setHasPreferences(preferencesExist);
        setIsAdmin(adminStatus);
        
        // Ha nincs preferencia beállítva, mutassuk a setup oldalt
        if (!preferencesExist) {
          setCurrentView('preference-setup');
        }
        
      } catch (error) {
        console.error('Felhasználó adatok betöltési hiba:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user.id]);

  useEffect(() => {
    const handleNavigateToFavorites = () => {
      setCurrentView('favorites');
    };

    const handleNavigateToPreferences = () => {
      setCurrentView('preferences');
    };

    const handleNavigateToProfile = () => {
      setCurrentView('profile');
    };

    window.addEventListener('navigate-to-favorites', handleNavigateToFavorites);
    window.addEventListener('navigate-to-preferences', handleNavigateToPreferences);
    window.addEventListener('navigate-to-profile', handleNavigateToProfile);

    return () => {
      window.removeEventListener('navigate-to-favorites', handleNavigateToFavorites);
      window.removeEventListener('navigate-to-preferences', handleNavigateToPreferences);
      window.removeEventListener('navigate-to-profile', handleNavigateToProfile);
    };
  }, []);

  const handlePreferenceSetupComplete = () => {
    setHasPreferences(true);
    setCurrentView('single');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Betöltés...</p>
        </div>
      </div>
    );
  }

  // Ha nincs preferencia beállítva, mutassuk a setup oldalt
  if (hasPreferences === false && currentView === 'preference-setup') {
    return (
      <PreferenceSetup
        user={user}
        onComplete={handlePreferenceSetupComplete}
      />
    );
  }

  if (currentView === 'admin') {
    return (
      <AdminDashboard
        user={user}
        onLogout={onLogout}
        onBackToApp={() => setCurrentView('single')}
      />
    );
  }

  if (currentView === 'profile') {
    return (
      <UserProfilePage
        user={user}
        onClose={() => setCurrentView('single')}
        onLogout={onLogout}
      />
    );
  }

  if (currentView === 'favorites') {
    return (
      <FavoritesPage
        user={user}
        onClose={() => setCurrentView('single')}
      />
    );
  }

  if (currentView === 'preferences') {
    return (
      <PreferencesPage
        user={user}
        onClose={() => setCurrentView('single')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* Modern Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="text-white text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              🍽️ Ételtervező
            </h1>
            <p className="text-sm sm:text-base text-white/70">Üdv, {user.fullName}!</p>
          </div>
          
          {/* Modern Menu Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Kedvencek */}
            <Button
              onClick={() => setCurrentView('favorites')}
              variant="ghost"
              size="sm"
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:text-white transition-all duration-200 flex items-center gap-2 px-3 py-2"
            >
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="hidden sm:inline">Kedvencek</span>
            </Button>

            {/* Preferenciák */}
            <Button
              onClick={() => setCurrentView('preferences')}
              variant="ghost"
              size="sm"
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:text-white transition-all duration-200 flex items-center gap-2 px-3 py-2"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Preferenciák</span>
            </Button>

            {/* Admin - csak adminoknak */}
            {isAdmin && (
              <Button
                onClick={() => setCurrentView('admin')}
                variant="ghost"
                size="sm"
                className="bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 text-purple-200 hover:bg-purple-500/30 hover:text-white transition-all duration-200 flex items-center gap-2 px-3 py-2"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}

            {/* Profil */}
            <Button
              onClick={() => setCurrentView('profile')}
              variant="ghost"
              size="sm"
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:text-white transition-all duration-200 flex items-center gap-2 px-2 py-2"
            >
              <Avatar className="w-6 h-6 border border-white/30">
                <AvatarImage src={userProfile?.avatar_url || undefined} alt="Profilkép" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                  {getInitials(userProfile?.full_name || user.fullName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">Profil</span>
            </Button>
            
            {/* Kijelentkezés */}
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 hover:bg-red-500/30 hover:text-white transition-all duration-200 px-3 py-2"
            >
              Kijelentkezés
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6 sm:py-8">
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
    </div>
  );
}
