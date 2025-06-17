
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, User, Utensils, Calendar, Settings } from "lucide-react";
import { MealPlanGenerator } from "./MealPlanGenerator";
import { DailyMealPlanner } from "./DailyMealPlanner";
import { ProfileModal } from "./ProfileModal";

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
  const [showProfile, setShowProfile] = useState(false);
  const [showDailyPlanner, setShowDailyPlanner] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>("");

  const mealTypes = [
    { key: "reggeli", label: "🌅 Reggeli", icon: "🌅" },
    { key: "tizórai", label: "☕ Tízórai", icon: "☕" },
    { key: "ebéd", label: "🍛 Ebéd", icon: "🍛" },
    { key: "uzsonna", label: "🥨 Uzsonna", icon: "🥨" },
    { key: "vacsora", label: "🌙 Vacsora", icon: "🌙" },
    { key: "leves", label: "🍲 Leves", icon: "🍲" }
  ];

  const handleMealTypeSelect = (mealType: string) => {
    setSelectedMealType(mealType);
    setShowDailyPlanner(false);
  };

  const handleLogout = () => {
    if (confirm('Biztosan ki szeretnél jelentkezni?')) {
      onLogout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Fixed User Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 z-50 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">
              👋 Üdv, <strong>{user.fullName}</strong>!
            </span>
            <span className="text-xs text-gray-500">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowProfile(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-600 text-white border-none hover:from-purple-600 hover:to-blue-700"
            >
              <User className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="bg-gradient-to-r from-purple-500 to-blue-600 text-white border-none hover:from-purple-600 hover:to-blue-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* App Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🍽️</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Ételtervező</h1>
            <p className="text-xl text-gray-600">Mit szeretnél enni?</p>
          </div>

          {/* Meal Type Selection */}
          {!selectedMealType && !showDailyPlanner && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mealTypes.map((meal) => (
                  <Button
                    key={meal.key}
                    onClick={() => handleMealTypeSelect(meal.key)}
                    className="h-20 text-lg font-semibold bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white border-none shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  >
                    {meal.label}
                  </Button>
                ))}
              </div>

              {/* Daily Planner Toggle */}
              <div className="text-center">
                <Button
                  onClick={() => setShowDailyPlanner(true)}
                  className="bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white border-none shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  📅 Napi Étrend Tervező
                </Button>
              </div>
            </div>
          )}

          {/* Meal Plan Generator */}
          {selectedMealType && !showDailyPlanner && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {mealTypes.find(m => m.key === selectedMealType)?.label} választása
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedMealType("")}
                  className="hover:bg-gray-100"
                >
                  🔄 Új választás
                </Button>
              </div>
              <MealPlanGenerator 
                user={user} 
                selectedMealType={selectedMealType}
                onReset={() => setSelectedMealType("")}
              />
            </div>
          )}

          {/* Daily Meal Planner */}
          {showDailyPlanner && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">📅 Napi Étrend Tervező</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowDailyPlanner(false)}
                  className="hover:bg-gray-100"
                >
                  ❌ Bezárás
                </Button>
              </div>
              <DailyMealPlanner user={user} />
            </div>
          )}
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal 
        user={user} 
        open={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
    </div>
  );
}
