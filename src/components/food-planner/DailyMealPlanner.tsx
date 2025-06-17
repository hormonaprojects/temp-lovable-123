
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface DailyMealPlannerProps {
  user: User;
  onBackToSingle: () => void;
}

interface MealPlan {
  [key: string]: {
    mealType: string;
    recipe: {
      név: string;
      hozzávalók: string[];
      elkészítés: string;
      elkészítésiIdő: string;
      szénhidrát: string;
      fehérje: string;
      zsír: string;
      képUrl?: string;
    } | null;
  };
}

export function DailyMealPlanner({ user, onBackToSingle }: DailyMealPlannerProps) {
  const [selectedMeals, setSelectedMeals] = useState<string[]>(["reggeli", "ebéd", "vacsora"]);
  const [dailyPlan, setDailyPlan] = useState<MealPlan>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const { 
    mealTypes,
    getRecipesByMealType,
    getRandomRecipe,
    convertToStandardRecipe,
    loading: dataLoading
  } = useSupabaseData();

  const mealOptions = [
    { key: "reggeli", label: "🌅 Reggeli" },
    { key: "tizórai", label: "☕ Tízórai" },
    { key: "ebéd", label: "🍛 Ebéd" },
    { key: "uzsonna", label: "🥨 Uzsonna" },
    { key: "vacsora", label: "🌙 Vacsora" }
  ];

  const handleMealToggle = (mealKey: string) => {
    setSelectedMeals(prev => 
      prev.includes(mealKey) 
        ? prev.filter(m => m !== mealKey)
        : [...prev, mealKey]
    );
  };

  const generateRecipeForMeal = (mealType: string) => {
    console.log(`🔍 Recept keresése: ${mealType}`);
    
    // Próbáljunk receptet találni az étkezés típus alapján
    const mealRecipes = getRecipesByMealType(mealType);
    
    if (mealRecipes.length > 0) {
      // Random kiválasztás a megfelelő receptek közül
      const randomIndex = Math.floor(Math.random() * mealRecipes.length);
      const selectedRecipe = mealRecipes[randomIndex];
      return convertToStandardRecipe(selectedRecipe);
    }
    
    // Ha nincs specifikus recept, próbáljunk random receptet
    const randomRecipe = getRandomRecipe();
    if (randomRecipe) {
      return convertToStandardRecipe(randomRecipe);
    }
    
    return null;
  };

  const generateDailyMealPlan = async () => {
    if (selectedMeals.length === 0) {
      toast({
        title: "Hiba",
        description: "Válassz legalább egy étkezést!",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('🍽️ Napi étrend generálása az adatbázisból...', selectedMeals);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newPlan: MealPlan = {};
      
      selectedMeals.forEach(mealType => {
        const recipe = generateRecipeForMeal(mealType);
        newPlan[mealType] = {
          mealType,
          recipe
        };
      });

      setDailyPlan(newPlan);
      setShowResults(true);

      const successfulRecipes = Object.values(newPlan).filter(meal => meal.recipe !== null).length;
      
      toast({
        title: "Sikeres generálás!",
        description: `${successfulRecipes} recept betöltve az adatbázisból.`,
      });
      
    } catch (error) {
      console.error('❌ Hiba a napi étrend generálásában:', error);
      toast({
        title: "Hiba",
        description: "Hiba történt az étrend generálása közben.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateAllMeals = async () => {
    setIsGenerating(true);
    
    try {
      console.log('🔄 Összes étel újragenerálása...');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newPlan: MealPlan = {};
      
      Object.keys(dailyPlan).forEach(mealType => {
        const recipe = generateRecipeForMeal(mealType);
        newPlan[mealType] = {
          mealType,
          recipe
        };
      });

      setDailyPlan(newPlan);

      toast({
        title: "Újragenerálás kész!",
        description: "Az összes ételt újrageneráltuk az adatbázisból.",
      });
      
    } catch (error) {
      console.error('❌ Hiba az újragenerálásban:', error);
      toast({
        title: "Hiba",
        description: "Hiba történt az újragenerálás közben.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
        <div className="text-white text-xl font-semibold">Adatok betöltése az adatbázisból...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          onClick={onBackToSingle}
          variant="outline"
          className="text-white border-white/30 hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza az egyedi receptekhez
        </Button>
      </div>

      <div className="space-y-6">
        {/* Meal Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Válaszd ki a főétkezéseket:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {mealOptions.map((meal) => (
                <div key={meal.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`daily-${meal.key}`}
                    checked={selectedMeals.includes(meal.key)}
                    onCheckedChange={() => handleMealToggle(meal.key)}
                  />
                  <label 
                    htmlFor={`daily-${meal.key}`} 
                    className="text-sm font-medium cursor-pointer"
                  >
                    {meal.label}
                  </label>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={generateDailyMealPlan}
                disabled={isGenerating || selectedMeals.length === 0}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generálás...
                  </>
                ) : (
                  "🎯 Napi Étrend Adatbázisból"
                )}
              </Button>
              
              {showResults && (
                <Button
                  onClick={regenerateAllMeals}
                  disabled={isGenerating}
                  variant="outline"
                  className="hover:bg-gray-100"
                >
                  🔄 Összes Újragenerálás
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily Meal Results */}
        {showResults && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-center text-white mb-6">
              🍽️ Mai Étrendem
            </h3>
            
            <div className="grid gap-6">
              {Object.entries(dailyPlan).map(([mealType, mealData]) => (
                <Card key={mealType} className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {mealOptions.find(m => m.key === mealType)?.label || mealType}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {mealData.recipe ? (
                      <div className="space-y-4">
                        <h4 className="text-xl font-semibold text-green-700">
                          {mealData.recipe.név}
                        </h4>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-semibold mb-2">🥘 Hozzávalók:</h5>
                            <ul className="list-disc list-inside space-y-1">
                              {mealData.recipe.hozzávalók.map((ingredient, idx) => (
                                <li key={idx} className="text-sm text-gray-600">
                                  {ingredient}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-semibold">⏱️ Elkészítési idő:</span> {mealData.recipe.elkészítésiIdő}
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">🍞 Szénhidrát:</span> {mealData.recipe.szénhidrát}g
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">🥩 Fehérje:</span> {mealData.recipe.fehérje}g
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">🥑 Zsír:</span> {mealData.recipe.zsír}g
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold mb-2">👨‍🍳 Elkészítés:</h5>
                          <p className="text-sm text-gray-600">{mealData.recipe.elkészítés}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">Nem sikerült receptet találni ehhez az étkezéshez az adatbázisban.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
