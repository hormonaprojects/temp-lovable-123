import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, Calendar, Utensils } from "lucide-react";
import { FunctionSelector } from "./FunctionSelector";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <header className="bg-black/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-yellow-400" />
            <h1 className="text-xl font-bold">Étrendtervező</h1>
          </div>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Button variant="ghost">Profil</Button>
              </li>
              <li>
                <Button variant="ghost">Beállítások</Button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <Card className="bg-black/20 backdrop-blur-sm border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Utensils className="w-5 h-5" /> Funkció választó</CardTitle>
            </CardHeader>
            <CardContent>
              <FunctionSelector onSelect={setActiveFunction} />
            </CardContent>
          </Card>
        </section>

        {activeFunction === 'daily' && (
          <section className="mb-8">
            <Card className="bg-black/20 backdrop-blur-sm border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><Calendar className="w-5 h-5" /> Napi étkezések</CardTitle>
              </CardHeader>
              <CardContent>
                <MealTypeCardSelector
                  selectedMeals={selectedMeals}
                  onSelect={handleMealSelect}
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
          <MultiDayMealPlanGenerator
            selectedMeals={selectedMeals}
            categories={categories}
            getFilteredIngredients={getFilteredIngredients}
            getRecipesByMealType={getRecipesByMealType}
          />
        )}
      </div>
    </div>
  );
}
