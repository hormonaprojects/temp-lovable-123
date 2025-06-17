
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronDown, Clock, Users, Calendar, Target } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { StarRating } from "./StarRating";
import { LoadingChef } from "@/components/ui/LoadingChef";

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
      
      // Minimum 4 másodperces betöltési idő
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 4000));

      const newPlan: MealPlan = {};
      
      selectedMeals.forEach(mealType => {
        const recipe = generateRecipeForMeal(mealType);
        newPlan[mealType] = {
          mealType,
          recipe
        };
      });

      await minLoadingTime;

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
      
      // Minimum 3 másodperces betöltési idő
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 3000));
      
      const newPlan: MealPlan = {};
      
      Object.keys(dailyPlan).forEach(mealType => {
        const recipe = generateRecipeForMeal(mealType);
        newPlan[mealType] = {
          mealType,
          recipe
        };
      });

      await minLoadingTime;

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
    return <LoadingChef />;
  }

  return (
    <div className="max-w-5xl mx-auto px-6">
      {/* Header Section with modern gradient */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Calendar className="w-8 h-8 text-white" />
          <h1 className="text-4xl font-bold text-white">Napi Étrendtervező</h1>
        </div>
        <p className="text-white/80 text-lg">Tervezd meg a teljes napodat személyre szabott receptekkel</p>
      </div>

      {/* Back Button - Modern design */}
      <div className="mb-8">
        <Button
          onClick={onBackToSingle}
          className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza az egyedi receptekhez
        </Button>
      </div>

      <div className="space-y-8">
        {/* Meal Selection Card - Modern glassmorphism design */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Target className="w-6 h-6 text-white" />
              <CardTitle className="text-2xl font-bold text-white">Válaszd ki a főétkezéseket</CardTitle>
            </div>
            <p className="text-white/70">Jelöld be azokat az étkezéseket, amelyekre recepteket szeretnél</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {mealOptions.map((meal) => (
                <div key={meal.key} className="group">
                  <label className="flex items-center p-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group-hover:scale-105">
                    <Checkbox
                      id={`daily-${meal.key}`}
                      checked={selectedMeals.includes(meal.key)}
                      onCheckedChange={() => handleMealToggle(meal.key)}
                      className="mr-4 border-white/50 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{meal.emoji}</span>
                      <span className="text-white font-medium text-lg">{meal.label.replace(/^[^\s]+\s/, '')}</span>
                    </div>
                  </label>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Button
                onClick={generateDailyMealPlan}
                disabled={isGenerating || selectedMeals.length === 0}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Generálás...
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5 mr-2" />
                    Napi Étrend Adatbázisból
                  </>
                )}
              </Button>
              
              {showResults && (
                <Button
                  onClick={regenerateAllMeals}
                  disabled={isGenerating}
                  className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 px-6 py-4 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  🔄 Összes Újragenerálás
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading Chef animáció */}
        {isGenerating && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <LoadingChef />
          </div>
        )}

        {/* Daily Meal Results - Enhanced modern design */}
        {showResults && !isGenerating && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">🍽️ Mai Étrendem</h3>
              <p className="text-white/70 text-lg">Személyre szabott receptek az egész napra</p>
            </div>
            
            <div className="grid gap-6">
              {Object.entries(dailyPlan).map(([mealType, mealData]) => {
                const mealOption = mealOptions.find(m => m.key === mealType);
                const isOpen = openMeals[mealType] || false;
                
                return (
                  <Card key={mealType} className="bg-gradient-to-r from-indigo-500/90 to-purple-600/90 backdrop-blur-sm text-white shadow-2xl overflow-hidden border border-white/20">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="bg-white/20 p-3 rounded-full">
                            <span className="text-3xl">{mealOption?.emoji}</span>
                          </div>
                          <div className="flex items-center gap-6">
                            <div>
                              <CardTitle className="text-white text-2xl font-bold">
                                {mealOption?.label?.replace(/^[^\s]+\s/, '') || mealType}
                              </CardTitle>
                              {mealData.recipe && (
                                <p className="text-white/90 text-xl font-semibold mt-2">{mealData.recipe.név}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {mealData.recipe && (
                          <div className="flex items-center gap-6">
                            {/* Recipe image in circle */}
                            {mealData.recipe.képUrl && (
                              <div className="relative">
                                <img 
                                  src={mealData.recipe.képUrl} 
                                  alt={mealData.recipe.név}
                                  className="w-16 h-16 object-cover rounded-full shadow-lg border-3 border-white/40 cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-xl"
                                  onClick={() => toggleMealDetails(mealType)}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">KLIK</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Enhanced meal info layout */}
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-white/90 text-sm bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                                <Clock className="w-4 h-4 text-blue-300" />
                                <span className="font-medium">{mealData.recipe.elkészítésiIdő}</span>
                              </div>
                              <div className="flex items-center gap-2 text-white/90 text-sm bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                                <Users className="w-4 h-4 text-green-300" />
                                <span className="font-medium">{mealData.recipe.hozzávalók?.length || 0} hozzávaló</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    {mealData.recipe ? (
                      <Collapsible open={isOpen} onOpenChange={() => toggleMealDetails(mealType)}>
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-between text-white hover:bg-white/10 px-6 py-3 text-lg font-medium"
                          >
                            <span>Kattints a részletekért</span>
                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="px-6 pb-6">
                          <div className="space-y-6 mt-6">
                            {mealData.recipe.képUrl && (
                              <div className="text-center">
                                <img 
                                  src={mealData.recipe.képUrl} 
                                  alt={mealData.recipe.név}
                                  className="w-56 h-56 object-cover rounded-2xl mx-auto shadow-2xl border-4 border-white/30 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-3xl"
                                  onClick={() => {
                                    // Image modal functionality would go here
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                              <h5 className="font-bold mb-4 text-white text-lg flex items-center gap-2">
                                🥘 Hozzávalók ({mealData.recipe.hozzávalók?.length || 0} db)
                              </h5>
                              <ul className="space-y-2">
                                {mealData.recipe.hozzávalók?.map((ingredient, idx) => (
                                  <li key={idx} className="text-white/90 flex items-start bg-white/5 p-2 rounded-lg">
                                    <span className="text-green-300 mr-3 font-bold">•</span>
                                    {ingredient}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                              <h5 className="font-bold mb-4 text-white text-lg flex items-center gap-2">
                                👨‍🍳 Elkészítés
                              </h5>
                              <div 
                                className="text-white/90 leading-relaxed text-base"
                                dangerouslySetInnerHTML={{ 
                                  __html: mealData.recipe.elkészítés?.replace(/(\d+\.\s)/g, '<br><strong class="text-yellow-300">$1</strong>') || '' 
                                }}
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 text-center border border-blue-300/30">
                                <div className="text-2xl mb-2">🍞</div>
                                <div className="text-sm text-blue-200 mb-1">Szénhidrát</div>
                                <div className="font-bold text-white text-xl">{mealData.recipe.szénhidrát}g</div>
                              </div>
                              <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-xl p-4 text-center border border-red-300/30">
                                <div className="text-2xl mb-2">🥩</div>
                                <div className="text-sm text-red-200 mb-1">Fehérje</div>
                                <div className="font-bold text-white text-xl">{mealData.recipe.fehérje}g</div>
                              </div>
                              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-xl p-4 text-center border border-yellow-300/30">
                                <div className="text-2xl mb-2">🥑</div>
                                <div className="text-sm text-yellow-200 mb-1">Zsír</div>
                                <div className="font-bold text-white text-xl">{mealData.recipe.zsír}g</div>
                              </div>
                            </div>

                            <div className="text-center pt-6 border-t border-white/20">
                              <p className="text-white/80 mb-3 font-medium">Értékeld a receptet:</p>
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
                      <CardContent className="text-center py-8">
                        <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-6 border border-red-300/30">
                          <p className="text-white/80 text-lg">
                            Nem sikerült receptet találni ehhez az étkezéshez az adatbázisban.
                          </p>
                        </div>
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
