
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecipeDisplay } from "./RecipeDisplay";
import { ChefHat, Clock, Users, Eye, EyeOff } from "lucide-react";

interface GeneratedMealPlanProps {
  generatedRecipes: any[];
  user: any;
}

const mealTypes = [
  { key: 'reggeli', label: 'Reggeli', emoji: '🍳', color: 'bg-orange-500/20 border-orange-400' },
  { key: 'tízórai', label: 'Tízórai', emoji: '🥪', color: 'bg-yellow-500/20 border-yellow-400' },
  { key: 'ebéd', label: 'Ebéd', emoji: '🍽️', color: 'bg-green-500/20 border-green-400' },
  { key: 'uzsonna', label: 'Uzsonna', emoji: '🧁', color: 'bg-pink-500/20 border-pink-400' },
  { key: 'vacsora', label: 'Vacsora', emoji: '🌮', color: 'bg-purple-500/20 border-purple-400' }
];

export function GeneratedMealPlan({ generatedRecipes, user }: GeneratedMealPlanProps) {
  const [expandedRecipes, setExpandedRecipes] = useState<Set<number>>(new Set());

  if (generatedRecipes.length === 0) {
    return null;
  }

  const toggleRecipeExpanded = (index: number) => {
    setExpandedRecipes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Összegzés számítása
  const totalCalories = generatedRecipes.reduce((sum, recipe) => {
    const protein = parseFloat(recipe.fehérje || '0');
    const carbs = parseFloat(recipe.szénhidrát || '0');
    const fat = parseFloat(recipe.zsír || '0');
    return sum + (protein * 4) + (carbs * 4) + (fat * 9);
  }, 0);

  const totalProtein = generatedRecipes.reduce((sum, recipe) => 
    sum + parseFloat(recipe.fehérje || '0'), 0);
  const totalCarbs = generatedRecipes.reduce((sum, recipe) => 
    sum + parseFloat(recipe.szénhidrát || '0'), 0);
  const totalFat = generatedRecipes.reduce((sum, recipe) => 
    sum + parseFloat(recipe.zsír || '0'), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Összegzés */}
      <Card className="bg-gradient-to-br from-indigo-600/90 to-purple-700/90 backdrop-blur-lg border-purple-300/30 shadow-xl mx-2 sm:mx-0">
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-lg sm:text-2xl font-bold text-center text-white flex items-center justify-center gap-2 sm:gap-3">
            <ChefHat className="w-5 h-5 sm:w-8 sm:h-8 text-purple-300" />
            <span className="leading-tight">Napi Étrend Összegzés</span>
          </CardTitle>
          <CardDescription className="text-center text-white/80 text-xs sm:text-base">
            {generatedRecipes.length} étkezés sikeresen generálva
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-center border border-white/30">
              <div className="text-lg sm:text-2xl font-bold text-white">{Math.round(totalCalories)}</div>
              <div className="text-white/80 text-xs sm:text-sm">Kalória</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-center border border-white/30">
              <div className="text-lg sm:text-2xl font-bold text-blue-300">{Math.round(totalProtein)}g</div>
              <div className="text-white/80 text-xs sm:text-sm">Fehérje</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-center border border-white/30">
              <div className="text-lg sm:text-2xl font-bold text-green-300">{Math.round(totalCarbs)}g</div>
              <div className="text-white/80 text-xs sm:text-sm">Szénhidrát</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-center border border-white/30">
              <div className="text-lg sm:text-2xl font-bold text-yellow-300">{Math.round(totalFat)}g</div>
              <div className="text-white/80 text-xs sm:text-sm">Zsír</div>
            </div>
          </div>

          {/* Étkezések listája */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">📋 Étkezések:</h3>
            <div className="grid gap-2 sm:gap-3">
              {generatedRecipes.map((recipe, index) => {
                const mealTypeInfo = mealTypes.find(m => m.key === recipe.mealType);
                const isExpanded = expandedRecipes.has(index);
                
                return (
                  <div 
                    key={index} 
                    className="bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 p-3 sm:p-4 hover:bg-white/25 transition-all cursor-pointer"
                    onClick={() => toggleRecipeExpanded(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <span className="text-lg sm:text-2xl">{mealTypeInfo?.emoji || '🍽️'}</span>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-white capitalize text-xs sm:text-base">
                            {mealTypeInfo?.label || recipe.mealType}
                          </h4>
                          <p className="text-white/90 font-medium text-xs sm:text-base truncate">{recipe.név}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {recipe.elkészítésiIdő && (
                          <Badge variant="outline" className="text-white border-white/40 bg-white/10 text-xs px-1 py-0">
                            <Clock className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                            <span className="hidden sm:inline">{recipe.elkészítésiIdő}</span>
                            <span className="sm:hidden">{recipe.elkészítésiIdő.split(' ')[0]}</span>
                          </Badge>
                        )}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRecipeExpanded(index);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20 px-2 py-1 h-6 sm:h-8 text-xs sm:text-sm"
                        >
                          {isExpanded ? (
                            <>
                              <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Bezár</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Részletek</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20" onClick={(e) => e.stopPropagation()}>
                        <RecipeDisplay
                          recipe={recipe}
                          isLoading={false}
                          onRegenerate={() => {}}
                          onNewRecipe={() => {}}
                          user={user}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
