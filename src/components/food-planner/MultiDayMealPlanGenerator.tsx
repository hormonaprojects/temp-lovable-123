
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChefHat, Clock, RotateCcw, Trash2 } from "lucide-react";
import { Recipe } from "@/types/recipe";
import { RecipeContent } from "./RecipeContent";
import { LoadingChef } from "@/components/ui/LoadingChef";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useMultiDayPlanGeneration } from "@/hooks/useMultiDayPlanGeneration";

interface MultiDayMealPlan {
  day: number;
  date: string;
  meals: {
    [mealType: string]: Recipe | null;
  };
}

interface MultiDayMealPlanGeneratorProps {
  user: any;
}

export function MultiDayMealPlanGenerator({ user }: MultiDayMealPlanGeneratorProps) {
  const [selectedDays, setSelectedDays] = useState(3);
  
  const {
    getRecipesByMealType,
    convertToStandardRecipe,
    loading: dataLoading
  } = useSupabaseData(user?.id);

  const {
    multiDayPlan,
    isGenerating,
    generateMultiDayPlan,
    clearPlan
  } = useMultiDayPlanGeneration({
    getRecipesByMealType,
    convertToStandardRecipe
  });

  const dayOptions = [3, 5, 7];
  const mealTypes = ['reggeli', 'ebéd', 'vacsora'];

  const handleGeneratePlan = async () => {
    console.log(`🎯 ${selectedDays} napos étrend generálás indítása`);
    await generateMultiDayPlan(selectedDays);
  };

  const handleRegeneratePlan = async () => {
    console.log(`🔄 ${selectedDays} napos étrend újragenerálása`);
    await generateMultiDayPlan(selectedDays);
  };

  const getMealTypeDisplayName = (mealType: string) => {
    switch (mealType) {
      case 'reggeli': return '🌅 Reggeli';
      case 'ebéd': return '🍽️ Ebéd';
      case 'vacsora': return '🌙 Vacsora';
      default: return mealType;
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <LoadingChef />
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <LoadingChef />
          <p className="text-white text-lg mt-4">
            {selectedDays} napos étrend generálása...
          </p>
          <p className="text-white/70 text-sm mt-2">
            Receptek kiválasztása preferenciáid alapján
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
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

            <div className="flex justify-center gap-4">
              <Button
                onClick={handleGeneratePlan}
                className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-700/90 hover:to-pink-700/90 backdrop-blur-sm border border-purple-300/20 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              >
                <ChefHat className="w-5 h-5 mr-2" />
                {selectedDays} napos étrend generálása
              </Button>

              {multiDayPlan.length > 0 && (
                <>
                  <Button
                    onClick={handleRegeneratePlan}
                    className="bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-700/90 hover:to-cyan-700/90 backdrop-blur-sm border border-blue-300/20 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Újragenerálás
                  </Button>

                  <Button
                    onClick={clearPlan}
                    variant="outline"
                    className="bg-red-600/20 border-red-400/50 text-red-200 hover:bg-red-600/30 hover:text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Törlés
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Meal Plan */}
      {multiDayPlan.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              🍽️ {multiDayPlan.length} napos étrendterv
            </h2>
            <p className="text-white/70 text-sm sm:text-base">
              Preferenciáid alapján összeállított receptek
            </p>
          </div>
          
          {multiDayPlan.map((dayPlan) => (
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
                          {getMealTypeDisplayName(mealType)}
                        </h3>
                        
                        {recipe ? (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer">
                            <RecipeContent recipe={recipe} compact />
                          </div>
                        ) : (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center text-white/60">
                            <p className="text-sm">Nincs elérhető recept</p>
                            <p className="text-xs mt-1">Próbáld újragenerálni az étrendet</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Summary Statistics */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <h3 className="text-white font-bold text-lg mb-3">📊 Étrend összesítő</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-white/80">
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {multiDayPlan.length}
                    </div>
                    <div className="text-sm">nap</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {multiDayPlan.reduce((acc, day) => acc + Object.values(day.meals).filter(recipe => recipe !== null).length, 0)}
                    </div>
                    <div className="text-sm">recept</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      {multiDayPlan.length * 3}
                    </div>
                    <div className="text-sm">étkezés</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {Math.round((multiDayPlan.reduce((acc, day) => acc + Object.values(day.meals).filter(recipe => recipe !== null).length, 0) / (multiDayPlan.length * 3)) * 100)}%
                    </div>
                    <div className="text-sm">lefedettség</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
