
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChefHat, Clock } from "lucide-react";
import { Recipe } from "@/types/recipe";
import { RecipeContent } from "./RecipeContent";
import { LoadingChef } from "@/components/ui/LoadingChef";

interface MultiDayMealPlan {
  day: number;
  date: string;
  meals: {
    [mealType: string]: Recipe | null;
  };
}

interface MultiDayMealPlanGeneratorProps {
  onGeneratePlan: (days: number) => Promise<MultiDayMealPlan[]>;
  isLoading: boolean;
  mealPlan: MultiDayMealPlan[];
}

export function MultiDayMealPlanGenerator({
  onGeneratePlan,
  isLoading,
  mealPlan
}: MultiDayMealPlanGeneratorProps) {
  const [selectedDays, setSelectedDays] = useState(3);
  
  const dayOptions = [3, 5, 7];
  const mealTypes = ['reggeli', 'ebéd', 'vacsora'];

  const handleGeneratePlan = () => {
    onGeneratePlan(selectedDays);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <LoadingChef />
          <p className="text-white text-lg mt-4">Többnapos étrend generálása...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Day Selection */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-green-400" />
            Többnapos Étrendtervező
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-white/80 mb-4">Válaszd ki, hány napra szeretnél étrendet:</p>
              <div className="flex justify-center gap-4">
                {dayOptions.map((days) => (
                  <Button
                    key={days}
                    onClick={() => setSelectedDays(days)}
                    variant="outline"
                    className={`px-6 py-3 transition-all duration-200 ${
                      selectedDays === days
                        ? 'bg-green-600/30 border-green-400/50 text-white shadow-lg scale-105'
                        : 'bg-white/5 border-white/20 text-white hover:bg-white/15 hover:border-white/40'
                    }`}
                  >
                    {days} nap
                  </Button>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={handleGeneratePlan}
                className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-700/90 hover:to-pink-700/90 backdrop-blur-sm border border-purple-300/20 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              >
                <ChefHat className="w-5 h-5 mr-2" />
                {selectedDays} napos étrend generálása
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Meal Plan */}
      {mealPlan.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            🍽️ {mealPlan.length} napos étrendterv
          </h2>
          
          {mealPlan.map((dayPlan) => (
            <Card key={dayPlan.day} className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
                  <Clock className="w-6 h-6 text-blue-400" />
                  {dayPlan.day}. nap
                  <Badge variant="secondary" className="bg-white/20 text-white/90 ml-2">
                    {dayPlan.date}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {mealTypes.map((mealType) => {
                    const recipe = dayPlan.meals[mealType];
                    return (
                      <div key={mealType} className="space-y-3">
                        <h3 className="text-lg font-semibold text-white capitalize border-b border-white/20 pb-2">
                          {mealType === 'reggeli' ? '🌅 Reggeli' : 
                           mealType === 'ebéd' ? '🍽️ Ebéd' : '🌙 Vacsora'}
                        </h3>
                        
                        {recipe ? (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <RecipeContent recipe={recipe} compact />
                          </div>
                        ) : (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center text-white/60">
                            Nincs recept generálva
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
