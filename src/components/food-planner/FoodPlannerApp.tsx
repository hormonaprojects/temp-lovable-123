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
import { User, Settings, Shield, Star, ChefHat, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchUserProfile } from "@/services/profileQueries";
import { checkUserHasPreferences } from "@/services/foodPreferencesQueries";
import { checkIsAdmin } from "@/services/adminQueries";
import { getFavorites } from "@/services/favoritesQueries";

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
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [profile, preferencesExist, adminStatus, favorites] = await Promise.all([
          fetchUserProfile(user.id),
          checkUserHasPreferences(user.id),
          checkIsAdmin(user.id),
          getFavorites(user.id)
        ]);
        
        setUserProfile(profile);
        setHasPreferences(preferencesExist);
        setIsAdmin(adminStatus);
        setFavoritesCount(favorites?.length || 0);
        
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

  // Kedvencek számának frissítése amikor a kedvencek oldalra váltunk
  useEffect(() => {
    const updateFavoritesCount = async () => {
      if (currentView === 'favorites') {
        try {
          const favorites = await getFavorites(user.id);
          setFavoritesCount(favorites?.length || 0);
        } catch (error) {
          console.error('Kedvencek számának frissítési hiba:', error);
        }
      }
    };

    updateFavoritesCount();
  }, [currentView, user.id]);

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
  };

  // Ha nincs preferencia beállítva, mutassuk a setup oldalt
  if (hasPreferences === false && currentView === 'preference-setup') {
    return (
      <PreferenceSetup
        userId={user.id}
        onComplete={handlePreferenceSetupComplete}
      />
    );
  }

  const getPageTitle = () => {
    switch (currentView) {
      case 'favorites':
        return {
          icon: <Star className="w-6 h-6 text-yellow-400 fill-current" />,
          title: "Kedvenc Receptek",
          subtitle: `${favoritesCount} kedvenc recept`
        };
      case 'preferences':
        return {
          icon: <Settings className="w-6 h-6 text-green-400" />,
          title: "Ételpreferenciáim",
          subtitle: "Kezeld az ételpreferenciáidat",
          action: (
            <Button
              variant="outline"
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-500"
            >
              <Settings className="w-4 h-4 mr-2" />
              Szerkesztés
            </Button>
          )
        };
      case 'profile':
        return {
          icon: <User className="w-6 h-6 text-purple-400" />,
          title: "Profilom",
          subtitle: "Személyes adatok és beállítások"
        };
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'single':
        return (
          <SingleRecipeApp
            user={user}
            onToggleDailyPlanner={() => setCurrentView('daily')}
          />
        );
      case 'daily':
        return (
          <DailyMealPlanner
            user={user}
            onBackToSingle={() => setCurrentView('single')}
          />
        );
      case 'profile':
        return (
          <div className="max-w-6xl mx-auto p-3 sm:p-6">
            <UserProfilePage
              user={user}
              onClose={() => setCurrentView('single')}
              onLogout={onLogout}
            />
          </div>
        );
      case 'favorites':
        return (
          <div className="max-w-6xl mx-auto p-3 sm:p-6">
            <FavoritesPage
              user={user}
              onClose={() => setCurrentView('single')}
            />
          </div>
        );
      case 'preferences':
        return (
          <div className="max-w-6xl mx-auto p-3 sm:p-6">
            <PreferencesPage
              user={user}
              onClose={() => setCurrentView('single')}
            />
          </div>
        );
      case 'admin':
        return (
          <AdminDashboard
            user={user}
            onLogout={onLogout}
            onBackToApp={() => setCurrentView('single')}
          />
        );
      default:
        return (
          <SingleRecipeApp
            user={user}
            onToggleDailyPlanner={() => setCurrentView('daily')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* Sticky Header with Modern Admin-style Design */}
      <div className="sticky top-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          {/* Top Row - Brand and User Info */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-white">
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                🍽️ Ételtervező
              </h1>
              <p className="text-sm sm:text-base text-white/70">Ételek és receptek tervezése</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right text-white/90">
                <div className="font-medium">{user.fullName}</div>
                <div className="text-sm text-white/60">Felhasználó</div>
              </div>
              
              <Avatar className="w-10 h-10 border-2 border-white/30">
                <AvatarImage src={userProfile?.avatar_url || undefined} alt="Profilkép" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                  {getInitials(userProfile?.full_name || user.fullName)}
                </AvatarFallback>
              </Avatar>
              
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

          {/* Tab Navigation */}
          <div className="flex items-center">
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-1 flex space-x-1">
              <button
                onClick={() => setCurrentView('single')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm whitespace-nowrap
                  ${currentView === 'single' || currentView === 'daily'
                    ? 'bg-white/20 text-white shadow-lg border border-white/20' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <ChefHat className="w-4 h-4" />
                Receptgenerátor
              </button>

              <button
                onClick={() => setCurrentView('favorites')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm whitespace-nowrap
                  ${currentView === 'favorites'
                    ? 'bg-white/20 text-white shadow-lg border border-white/20' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <Star className="w-4 h-4" />
                Kedvencek
              </button>

              <button
                onClick={() => setCurrentView('preferences')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm whitespace-nowrap
                  ${currentView === 'preferences'
                    ? 'bg-white/20 text-white shadow-lg border border-white/20' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <Settings className="w-4 h-4" />
                Preferenciák
              </button>

              <button
                onClick={() => setCurrentView('profile')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm whitespace-nowrap
                  ${currentView === 'profile'
                    ? 'bg-white/20 text-white shadow-lg border border-white/20' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <User className="w-4 h-4" />
                Profil
              </button>

              {/* Admin - csak adminoknak */}
              {isAdmin && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm whitespace-nowrap
                    ${currentView === 'admin'
                      ? 'bg-white/20 text-white shadow-lg border border-white/20' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </button>
              )}
            </div>
          </div>

          {/* Page-specific header */}
          {getPageTitle() && (
            <div className="mt-6 flex justify-between items-center">
              <div className="text-white flex items-center gap-2">
                {getPageTitle()?.icon}
                <div>
                  <h2 className="text-xl font-bold">{getPageTitle()?.title}</h2>
                  <p className="text-sm text-white/70">{getPageTitle()?.subtitle}</p>
                </div>
              </div>
              {getPageTitle()?.action}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - dinamikusan változó tartalom */}
      <div className="py-6 sm:py-8">
        {renderContent()}
      </div>
    </div>
  );
}
