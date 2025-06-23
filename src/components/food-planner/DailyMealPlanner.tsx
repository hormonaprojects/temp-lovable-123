import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, Utensils } from "lucide-react";
import { DailyMealHeader } from "./DailyMealHeader";
import { MealSelectionCard } from "./MealSelectionCard";
import { GeneratedMealPlan } from "./GeneratedMealPlan";
import { MealPlanGenerationButton } from "./MealPlanGenerationButton";
import { useMultiDayPlanGeneration } from "@/hooks/useMultiDayPlanGeneration";

interface DailyMealPlannerProps {
  selectedMeals: string[];
  categories: Record<string, string[]>;
  getFilteredIngredients: (category: string) => string[];
  getRecipesByMealType: (mealType: string) => any[];
  user: any;
  onGenerateSimilar?: (recipe: any, mealType: string) => void;
}

export function DailyMealPlanner({ 
  selectedMeals, 
  categories, 
  getFilteredIngredients, 
  getRecipesByMealType,
  user,
  onGenerateSimilar 
}: DailyMealPlannerProps) {
  const [generatedRecipes, setGeneratedRecipes] = useState<any[]>([]);
  const { generateDailyPlan } = useMultiDayPlanGeneration();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateDailyPlan = async () => {
    setIsLoading(true);
    try {
      const recipes = await generateDailyPlan(selectedMeals);
      setGeneratedRecipes(recipes);
    } catch (error) {
      console.error("Error generating daily meal plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasSelectedMeals = useMemo(() => {
    return selectedMeals.length > 0;
  }, [selectedMeals]);

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <DailyMealHeader />

      <Card className="bg-white/5 backdrop-blur-lg border-white/20 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Utensils className="w-4 h-4 text-yellow-400" />
            Válaszd ki a napi étkezéseket:
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(categories).map(([mealType, ingredients]) => (
              <MealSelectionCard
                key={mealType}
                mealType={mealType}
                ingredients={ingredients}
                getFilteredIngredients={getFilteredIngredients}
                getRecipesByMealType={getRecipesByMealType}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <MealPlanGenerationButton 
        hasSelectedMeals={hasSelectedMeals}
        isLoading={isLoading}
        onGenerateDailyPlan={handleGenerateDailyPlan}
      />

      {generatedRecipes.length > 0 && (
        <GeneratedMealPlan 
          generatedRecipes={generatedRecipes} 
          user={user}
          onGenerateSimilar={onGenerateSimilar}
        />
      )}
    </div>
  );
}
