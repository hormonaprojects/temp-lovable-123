
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface DailyMealPlannerProps {
  user: User;
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

export function DailyMealPlanner({ user }: DailyMealPlannerProps) {
  const [selectedMeals, setSelectedMeals] = useState<string[]>(["reggeli", "ebéd", "vacsora"]);
  const [dailyPlan, setDailyPlan] = useState<MealPlan>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

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

  const generateMockRecipe = (mealType: string) => {
    const recipes = {
      reggeli: [
        { név: "Almás Muffin Répával", hozzávalók: ["alma", "répa", "liszt", "cukor", "tojás"], elkészítés: "Keverjük össze a hozzávalókat és süssük meg.", elkészítésiIdő: "30 perc", szénhidrát: "25g", fehérje: "8g", zsír: "12g" },
        { név: "Avokádó Saláta kovászos kenyérrel", hozzávalók: ["avokádó", "kovászos kenyér", "paradicsom", "só", "bors"], elkészítés: "Vágjuk fel az avokádót és tálaljuk a kenyérrel.", elkészítésiIdő: "10 perc", szénhidrát: "30g", fehérje: "10g", zsír: "15g" }
      ],
      tizórai: [
        { név: "Gyümölcs saláta", hozzávalók: ["alma", "banán", "narancs", "szőlő"], elkészítés: "Vágjuk fel a gyümölcsöket és keverjük össze.", elkészítésiIdő: "5 perc", szénhidrát: "20g", fehérje: "2g", zsír: "1g" },
        { név: "Joghurt müzlivel", hozzávalók: ["joghurt", "müzli", "méz"], elkészítés: "Keverjük össze a joghurtot a müzlivel.", elkészítésiIdő: "2 perc", szénhidrát: "25g", fehérje: "12g", zsír: "8g" }
      ],
      ebéd: [
        { név: "Ananászos Csirke", hozzávalók: ["csirkemell", "ananász", "rizs", "szójaszósz"], elkészítés: "Süssük meg a csirkét az ananásszal.", elkészítésiIdő: "45 perc", szénhidrát: "40g", fehérje: "35g", zsír: "18g" },
        { név: "Ázsiai lazacos quinoa", hozzávalók: ["lazac", "quinoa", "zöldségek", "szezám"], elkészítés: "Főzzük meg a quinoát és süssük meg a lazacot.", elkészítésiIdő: "35 perc", szénhidrát: "30g", fehérje: "40g", zsír: "22g" }
      ],
      uzsonna: [
        { név: "Almás pite", hozzávalók: ["alma", "liszt", "vaj", "cukor"], elkészítés: "Készítsünk tésztát és töltsük meg almával.", elkészítésiIdő: "60 perc", szénhidrát: "45g", fehérje: "6g", zsír: "20g" },
        { név: "Túrós pogácsa", hozzávalók: ["túró", "liszt", "vaj", "só"], elkészítés: "Gyúrjuk össze a tésztát és süssük meg.", elkészítésiIdő: "40 perc", szénhidrát: "30g", fehérje: "15g", zsír: "18g" }
      ],
      vacsora: [
        { név: "Avokádós Csirkés Tortilla", hozzávalók: ["tortilla", "csirkemell", "avokádó", "saláta"], elkészítés: "Töltsük meg a tortillát és tekerjük fel.", elkészítésiIdő: "20 perc", szénhidrát: "35g", fehérje: "28g", zsír: "16g" },
        { név: "Buddha tál", hozzávalók: ["quinoa", "sült zöldségek", "tahini", "csicseriborsó"], elkészítés: "Tálaljuk a quinoát a sült zöldségekkel.", elkészítésiIdő: "30 perc", szénhidrát: "40g", fehérje: "18g", zsír: "14g" }
      ]
    };

    const mealRecipes = recipes[mealType as keyof typeof recipes] || [];
    if (mealRecipes.length === 0) return null;
    
    return mealRecipes[Math.floor(Math.random() * mealRecipes.length)];
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
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newPlan: MealPlan = {};
    
    selectedMeals.forEach(mealType => {
      newPlan[mealType] = {
        mealType,
        recipe: generateMockRecipe(mealType)
      };
    });

    setDailyPlan(newPlan);
    setShowResults(true);
    setIsGenerating(false);

    toast({
      title: "Sikeres generálás!",
      description: "A napi étrendet sikeresen létrehoztuk.",
    });
  };

  const regenerateAllMeals = async () => {
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newPlan: MealPlan = {};
    
    Object.keys(dailyPlan).forEach(mealType => {
      newPlan[mealType] = {
        mealType,
        recipe: generateMockRecipe(mealType)
      };
    });

    setDailyPlan(newPlan);
    setIsGenerating(false);

    toast({
      title: "Újragenerálás kész!",
      description: "Az összes ételt újrageneráltuk.",
    });
  };

  return (
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
                "🎯 Random Napi Étrend"
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
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">
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
                            <span className="font-semibold">🍞 Szénhidrát:</span> {mealData.recipe.szénhidrát}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">🥩 Fehérje:</span> {mealData.recipe.fehérje}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">🥑 Zsír:</span> {mealData.recipe.zsír}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold mb-2">👨‍🍳 Elkészítés:</h5>
                        <p className="text-sm text-gray-600">{mealData.recipe.elkészítés}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Nem sikerült receptet találni ehhez az étkezéshez.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
