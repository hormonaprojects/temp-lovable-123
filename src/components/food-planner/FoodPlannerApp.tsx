
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SingleRecipeApp } from "./SingleRecipeApp";
import { DailyMealPlanner } from "./DailyMealPlanner";
import { UserProfilePage } from "./UserProfilePage";
import { User } from "lucide-react";

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
            {/* Profil gomb */}
            <Button
              onClick={() => setCurrentView('profile')}
              variant="outline"
              size="sm"
              className="text-white border-white/30 hover:bg-white/10 bg-white/10 flex items-center gap-2"
            >
              <User className="w-4 h-4" />
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
    </div>
  );
}
