
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronDown, Clock, Users } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { StarRating } from "./StarRating";

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
  const [openMeals, setOpenMeals] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const { 
    mealTypes,
    getRecipesByMealType,
    getRandomRecipe,
    convertToStandardRecipe,
    saveRating,
    loading: dataLoading
  } = useSupabaseData();

  const mealOptions = [
    { key: "reggeli", label: "🌅 Reggeli", emoji: "🌅" },
    { key: "tizórai", label: "☕ Tízórai", emoji: "☕" },
    { key: "ebéd", label: "🍛 Ebéd", emoji: "🍛" },
    { key: "uzsonna", label: "🥨 Uzsonna", emoji: "🥨" },
    { key: "vacsora", label: "🌙 Vacsora", emoji: "🌙" }
  ];

  const handleMealToggle = (mealKey: string) => {
    setSelectedMeals(prev => 
      prev.includes(mealKey) 
        ? prev.filter(m => m !== mealKey)
        : [...prev, mealKey]
    );
  };

  const toggleMealDetails = (mealType: string) => {
    setOpenMeals(prev => ({
      ...prev,
      [mealType]: !prev[mealType]
    }));
  };

  const handleRating = async (recipeName: string, rating: number) => {
    const success = await saveRating(recipeName, rating);
    
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
          className="text-white border-white/30 hover:bg-white/10 bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza az egyedi receptekhez
        </Button>
      </div>

      <div className="space-y-6">
        {/* Meal Selection */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-gray-800">Válaszd ki a főétkezéseket:</CardTitle>
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
                    className="text-sm font-medium cursor-pointer text-gray-700"
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
                  className="hover:bg-gray-100 border-gray-300"
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
            
            <div className="grid gap-4">
              {Object.entries(dailyPlan).map(([mealType, mealData]) => {
                const mealOption = mealOptions.find(m => m.key === mealType);
                const isOpen = openMeals[mealType] || false;
                
                return (
                  <Card key={mealType} className="bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{mealOption?.emoji}</span>
                          <div className="flex items-center gap-4">
                            <div>
                              <CardTitle className="text-white text-xl">
                                {mealOption?.label?.replace(/^[^\s]+\s/, '') || mealType}
                              </CardTitle>
                              {mealData.recipe && (
                                <p className="text-white/80 text-lg font-semibold mt-1">{mealData.recipe.név}</p>
                              )}
                            </div>
                            {mealData.recipe?.képUrl && (
                              <img 
                                src={mealData.recipe.képUrl} 
                                alt={mealData.recipe.név}
                                className="w-16 h-16 object-cover rounded-lg shadow-md"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        </div>
                        
                        {mealData.recipe && (
                          <div className="flex items-center gap-2 text-white/80 text-sm">
                            <Clock className="w-4 h-4" />
                            {mealData.recipe.elkészítésiIdő}
                            <Users className="w-4 h-4 ml-2" />
                            {mealData.recipe.hozzávalók?.length || 0} hozzávaló
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    {mealData.recipe ? (
                      <Collapsible open={isOpen} onOpenChange={() => toggleMealDetails(mealType)}>
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-between text-white hover:bg-white/10 px-6 py-2"
                          >
                            <span className="text-sm">Kattints a részletekért</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="px-6 pb-6">
                          <div className="space-y-4 mt-4">
                            {mealData.recipe.képUrl && (
                              <div className="text-center">
                                <img 
                                  src={mealData.recipe.képUrl} 
                                  alt={mealData.recipe.név}
                                  className="w-48 h-48 object-cover rounded-lg mx-auto shadow-md"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            
                            <div className="bg-white/10 rounded-lg p-4">
                              <h5 className="font-semibold mb-2 text-white">🥘 Hozzávalók ({mealData.recipe.hozzávalók?.length || 0} db):</h5>
                              <ul className="space-y-1">
                                {mealData.recipe.hozzávalók?.map((ingredient, idx) => (
                                  <li key={idx} className="text-sm text-white/90 flex items-start">
                                    <span className="text-green-300 mr-2">•</span>
                                    {ingredient}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-white/10 rounded-lg p-4">
                              <h5 className="font-semibold mb-2 text-white">👨‍🍳 Elkészítés:</h5>
                              <div 
                                className="text-sm text-white/90 leading-relaxed"
                                dangerouslySetInnerHTML={{ 
                                  __html: mealData.recipe.elkészítés?.replace(/(\d+\.\s)/g, '<br><strong>$1</strong>') || '' 
                                }}
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-white/10 rounded-lg p-2">
                                <div className="text-xs text-white/70">Szénhidrát</div>
                                <div className="font-semibold text-white">{mealData.recipe.szénhidrát}g</div>
                              </div>
                              <div className="bg-white/10 rounded-lg p-2">
                                <div className="text-xs text-white/70">Fehérje</div>
                                <div className="font-semibold text-white">{mealData.recipe.fehérje}g</div>
                              </div>
                              <div className="bg-white/10 rounded-lg p-2">
                                <div className="text-xs text-white/70">Zsír</div>
                                <div className="font-semibold text-white">{mealData.recipe.zsír}g</div>
                              </div>
                            </div>

                            <div className="text-center pt-4 border-t border-white/20">
                              <p className="text-sm text-white/80 mb-2">Értékeld a receptet:</p>
                              <StarRating 
                                recipeName={mealData.recipe.név} 
                                onRate={(rating) => handleRating(mealData.recipe!.név, rating)}
                                className="justify-center"
                              />
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <CardContent>
                        <p className="text-white/70 text-center py-4">
                          Nem sikerült receptet találni ehhez az étkezéshez az adatbázisban.
                        </p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
