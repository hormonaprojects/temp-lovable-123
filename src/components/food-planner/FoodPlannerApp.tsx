
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SingleRecipeApp } from "./SingleRecipeApp";
import { DailyMealPlanner } from "./DailyMealPlanner";

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
  const [currentView, setCurrentView] = useState<'single' | 'daily'>('single');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-xl font-bold">🍽️ Ételtervező</h1>
            <p className="text-sm opacity-80">Üdv, {user.fullName}!</p>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="text-white border-white/30 hover:bg-white/10 bg-white/10"
          >
            Kijelentkezés
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
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
