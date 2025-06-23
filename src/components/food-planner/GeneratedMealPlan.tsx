import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecipeContent } from "./RecipeContent";
import { NutritionInfo } from "./NutritionInfo";
import { RecipeActions } from "./RecipeActions";
import { ChefHat, Clock, Users, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";

interface GeneratedMealPlanProps {
  generatedRecipes: any[];
  user: any;
  onGenerateSimilar?: (recipe: any, mealType: string) => void;
}

const mealTypes = [
  { key: 'reggeli', label: 'Reggeli', emoji: '🍳', color: 'bg-orange-500/20 border-orange-400' },
  { key: 'tízórai', label: 'Tízórai', emoji: '🥪', color: 'bg-yellow-500/20 border-yellow-400' },
  { key: 'ebéd', label: 'Ebéd', emoji: '🍽️', color: 'bg-green-500/20 border-green-400' },
  { key: 'uzsonna', label: 'Uzsonna', emoji: '🧁', color: 'bg-pink-500/20 border-pink-400' },
  { key: 'vacsora', label: 'Vacsora', emoji: '🌮', color: 'bg-purple-500/20 border-purple-400' }
];

export function GeneratedMealPlan({ generatedRecipes, user, onGenerateSimilar }: GeneratedMealPlanProps) {
  const [expandedRecipes, setExpandedRecipes] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const { saveRating } = useSupabaseData(user?.id);

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

  const handleRating = async (recipe: any, rating: number) => {
    if (!recipe || !user?.id) {
      toast({
        title: "Hiba",
        description: "Be kell jelentkezni az értékeléshez.",
        variant: "destructive"
      });
      return;
    }

    const success = await saveRating(recipe.név, rating);
    
    if (success) {
      toast({
        title: "Köszönjük az értékelést!",
        description: `${rating}/5 csillag mentve az adatbázisba.`,
      });
    } else {
      toast({
        title: "Hiba",
        description: "Nem sikerült menteni az értékelést.",
        variant: "destructive"
      });
    }
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
        </CardContent>
      </Card>

      {/* Individual Recipe Cards - Same format as single recipe */}
      <div className="space-y-4 sm:space-y-6">
        {generatedRecipes.map((recipe, index) => {
          const mealTypeInfo = mealTypes.find(m => m.key === recipe.mealType);
          
          return (
            <Card key={index} className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl mx-2 sm:mx-0">
              <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-base sm:text-xl font-bold text-center text-white flex items-center justify-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-2xl">{mealTypeInfo?.emoji || '🍽️'}</span>
                  <span className="leading-tight capitalize">{mealTypeInfo?.label || recipe.mealType}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-4 mb-3 sm:mb-6">
                  <RecipeContent recipe={recipe} />
                  <NutritionInfo recipe={recipe} />
                  <RecipeActions
                    recipe={recipe}
                    user={user}
                    onRegenerate={() => {}}
                    onNewRecipe={() => {}}
                    onRating={(rating) => handleRating(recipe, rating)}
                    onGenerateSimilar={onGenerateSimilar ? () => onGenerateSimilar(recipe, recipe.mealType) : undefined}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
