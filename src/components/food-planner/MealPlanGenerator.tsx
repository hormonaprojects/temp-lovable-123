
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, Calendar, Utensils } from "lucide-react";
import { MealTypeCardSelector } from "./MealTypeCardSelector";
import { DailyMealPlanner } from "./DailyMealPlanner";
import { MultiDayMealPlanGenerator } from "./MultiDayMealPlanGenerator";
import { useSupabaseData } from "@/hooks/useSupabaseData";

interface MealPlanGeneratorProps {
  user?: any;
  onGenerateSimilar?: (recipe: any, mealType: string) => void;
}

export function MealPlanGenerator({ user, onGenerateSimilar }: MealPlanGeneratorProps) {
  const [activeFunction, setActiveFunction] = useState<'daily' | 'multi-day'>('daily');
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const { categories, getFilteredIngredients, getRecipesByMealType } = useSupabaseData();

  useEffect(() => {
    console.log('Kategóriák betöltve:', categories);
  }, [categories]);

  const handleMealSelect = (mealType: string) => {
    setSelectedMeals(prev => {
      if (prev.includes(mealType)) {
        return prev.filter(item => item !== mealType);
      } else {
        return [...prev, mealType];
      }
    });
  };

  const getRecipeCount = (mealType: string) => {
    return getRecipesByMealType(mealType).length;
  };

  return (
    <div className="space-y-8">
      <section>
        <Card className="bg-black/20 backdrop-blur-sm border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-white">
              <Utensils className="w-5 h-5" /> Funkció választó
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant={activeFunction === 'daily' ? 'default' : 'outline'}
                onClick={() => setActiveFunction('daily')}
                className="text-white"
              >
                Napi Étrend
              </Button>
              <Button
                variant={activeFunction === 'multi-day' ? 'default' : 'outline'}
                onClick={() => setActiveFunction('multi-day')}
                className="text-white"
              >
                Többnapos Étrend
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {activeFunction === 'daily' && (
        <section>
          <Card className="bg-black/20 backdrop-blur-sm border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5" /> Napi étkezések
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MealTypeCardSelector
                selectedMeals={selectedMeals}
                onMealToggle={handleMealSelect}
                getRecipeCount={getRecipeCount}
              />
            </CardContent>
          </Card>
        </section>
      )}

      {activeFunction === 'daily' && (
        <DailyMealPlanner
          selectedMeals={selectedMeals}
          categories={categories}
          getFilteredIngredients={getFilteredIngredients}
          getRecipesByMealType={getRecipesByMealType}
          user={user}
          onGenerateSimilar={onGenerateSimilar}
        />
      )}

      {activeFunction === 'multi-day' && (
        <MultiDayMealPlanGenerator user={user} />
      )}
    </div>
  );
}
