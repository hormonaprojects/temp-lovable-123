import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronDown, Clock, Users, Calendar, Target, X, RefreshCw } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { StarRating } from "./StarRating";
import { LoadingChef } from "@/components/ui/LoadingChef";
import { MealSelectionCard } from "./MealSelectionCard";

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
  const [regeneratingMeal, setRegeneratingMeal] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [openMeals, setOpenMeals] = useState<Record<string, boolean>>({});
  const [fullScreenRecipe, setFullScreenRecipe] = useState<{recipe: any, mealType: string} | null>(null);
  const { toast } = useToast();

  const { 
    mealTypes,
    categories,
    getRecipesByMealType,
    getRecipesByCategory,
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

  const getIngredientsByCategory = (category: string): string[] => {
    return categories?.[category] || [];
  };

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

  const generateRecipeForMeal = (mealType: string, category?: string, ingredient?: string) => {
    console.log(`🔍 Recept keresése: ${mealType}`, { category, ingredient });
    
    let foundRecipes = [];
    
    if (category && ingredient) {
      // Specifikus kategória és hozzávaló alapján - ÉTKEZÉSI TÍPUSSAL SZŰRVE
      foundRecipes = getRecipesByCategory(category, ingredient, mealType);
      console.log(`🎯 Specifikus keresés eredménye: ${foundRecipes.length} recept`);
    } else if (category) {
      // Csak kategória alapján - ÉTKEZÉSI TÍPUSSAL SZŰRVE
      foundRecipes = getRecipesByCategory(category, undefined, mealType);
      console.log(`🎯 Kategória keresés eredménye: ${foundRecipes.length} recept`);
    } else {
      // Random recept az étkezés típus alapján
      foundRecipes = getRecipesByMealType(mealType);
      console.log(`🎯 Étkezési típus keresés eredménye: ${foundRecipes.length} recept`);
    }
    
    if (foundRecipes.length > 0) {
      // Random kiválasztás a megfelelő receptek közül
      const randomIndex = Math.floor(Math.random() * foundRecipes.length);
      const selectedRecipe = foundRecipes[randomIndex];
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

  const regenerateSpecificMeal = async (mealType: string, category: string, ingredient: string) => {
    setRegeneratingMeal(mealType);
    
    try {
      console.log(`🔄 ${mealType} újragenerálása...`, { category, ingredient });
      
      // Minimum 3 másodperces betöltési idő
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 3000));
      
      const recipe = generateRecipeForMeal(mealType, category, ingredient);

      await minLoadingTime;

      if (recipe) {
        setDailyPlan(prev => ({
          ...prev,
          [mealType]: {
            mealType,
            recipe
          }
        }));

        toast({
          title: "Újragenerálás kész!",
          description: `${mealType} új recepttel frissítve.`,
        });
      } else {
        toast({
          title: "Nincs találat",
          description: "Nem található recept a megadott feltételekkel.",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error(`❌ Hiba a ${mealType} újragenerálásában:`, error);
      toast({
        title: "Hiba",
        description: "Hiba történt az újragenerálás közben.",
        variant: "destructive"
      });
    } finally {
      setRegeneratingMeal(null);
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

  const openFullScreenRecipe = (recipe: any, mealType: string) => {
    setFullScreenRecipe({ recipe, mealType });
  };

  const closeFullScreenRecipe = () => {
    setFullScreenRecipe(null);
  };

  if (dataLoading) {
    return <LoadingChef />;
  }

  const availableCategories = categories ? Object.keys(categories) : [];

  return (
    <>
      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            <h1 className="text-2xl sm:text-4xl font-bold text-white">Napi Étrendtervező</h1>
          </div>
          <p className="text-white/80 text-base sm:text-lg px-4">Tervezd meg a teljes napodat személyre szabott receptekkel</p>
        </div>

        {/* Back Button */}
        <div className="mb-6 sm:mb-8">
          <Button
            onClick={onBackToSingle}
            className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300 shadow-lg text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza az egyedi receptekhez
          </Button>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Meal Selection Cards */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <CardTitle className="text-xl sm:text-2xl font-bold text-white">Válaszd ki és szabd személyre az étkezéseket</CardTitle>
              </div>
              <p className="text-white/70 text-sm sm:text-base">Jelöld be az étkezéseket és válassz kategóriát vagy alapanyagot személyre szabáshoz</p>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {mealOptions.map((meal) => (
                  <MealSelectionCard
                    key={meal.key}
                    mealType={meal.key}
                    mealLabel={meal.label.replace(/^[^\s]+\s/, '')}
                    emoji={meal.emoji}
                    isSelected={selectedMeals.includes(meal.key)}
                    onToggle={handleMealToggle}
                    categories={availableCategories}
                    getIngredientsByCategory={getIngredientsByCategory}
                    onGetRecipe={regenerateSpecificMeal}
                    isGenerating={regeneratingMeal === meal.key}
                    showRecipeButton={dailyPlan[meal.key]?.recipe !== undefined}
                  />
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
                <Button
                  onClick={generateDailyMealPlan}
                  disabled={isGenerating || selectedMeals.length === 0}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                      Generálás...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Napi Étrend Generálása
                    </>
                  )}
                </Button>
                
                {showResults && (
                  <Button
                    onClick={regenerateAllMeals}
                    disabled={isGenerating}
                    className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 px-4 py-3 sm:px-6 sm:py-4 text-base sm:text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    🔄 Összes Újragenerálás
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loading Chef animáció */}
          {(isGenerating || regeneratingMeal) && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
              <LoadingChef />
            </div>
          )}

          {/* Daily Meal Results */}
          {showResults && !isGenerating && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">🍽️ Mai Étrendem</h3>
                <p className="text-white/70 text-base sm:text-lg px-4">Személyre szabott receptek az egész napra</p>
              </div>
              
              <div className="grid gap-4 sm:gap-6">
                {Object.entries(dailyPlan).map(([mealType, mealData]) => {
                  const mealOption = mealOptions.find(m => m.key === mealType);
                  const isOpen = openMeals[mealType] || false;
                  
                  return (
                    <Card key={mealType} className="bg-gradient-to-r from-indigo-500/90 to-purple-600/90 backdrop-blur-sm text-white shadow-2xl overflow-hidden border border-white/20">
                      <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
                            <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0">
                              <span className="text-2xl sm:text-3xl">{mealOption?.emoji}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 min-w-0 flex-1">
                              <div className="min-w-0">
                                <CardTitle className="text-white text-lg sm:text-2xl font-bold truncate">
                                  {mealOption?.label?.replace(/^[^\s]+\s/, '') || mealType}
                                </CardTitle>
                                {mealData.recipe && (
                                  <p className="text-white/90 text-base sm:text-xl font-semibold mt-1 sm:mt-2 truncate">{mealData.recipe.név}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {mealData.recipe && (
                            <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                              {/* Recipe image in circle */}
                              {mealData.recipe.képUrl && (
                                <div className="relative">
                                  <img 
                                    src={mealData.recipe.képUrl} 
                                    alt={mealData.recipe.név}
                                    className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-full shadow-lg border-2 sm:border-3 border-white/40 cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-xl"
                                    onClick={() => openFullScreenRecipe(mealData.recipe, mealType)}
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
                              <div className="hidden sm:flex flex-col gap-2">
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
                              className="w-full justify-between text-white hover:bg-white/10 px-4 py-2 sm:px-6 sm:py-3 text-base sm:text-lg font-medium"
                            >
                              <span>Kattints a részletekért</span>
                              <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                            </Button>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                            {/* ... keep existing code (recipe details display) the same ... */}
                            <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                              {mealData.recipe.képUrl && (
                                <div className="text-center">
                                  <img 
                                    src={mealData.recipe.képUrl} 
                                    alt={mealData.recipe.név}
                                    className="w-48 h-48 sm:w-56 sm:h-56 object-cover rounded-2xl mx-auto shadow-2xl border-4 border-white/30 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-3xl"
                                    onClick={() => openFullScreenRecipe(mealData.recipe, mealType)}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              
                              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                                <h5 className="font-bold mb-3 sm:mb-4 text-white text-base sm:text-lg flex items-center gap-2">
                                  🥘 Hozzávalók ({mealData.recipe.hozzávalók?.length || 0} db)
                                </h5>
                                <ul className="space-y-2">
                                  {mealData.recipe.hozzávalók?.map((ingredient, idx) => (
                                    <li key={idx} className="text-white/90 flex items-start bg-white/5 p-2 rounded-lg text-sm sm:text-base">
                                      <span className="text-green-300 mr-3 font-bold">•</span>
                                      {ingredient}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                                <h5 className="font-bold mb-3 sm:mb-4 text-white text-base sm:text-lg flex items-center gap-2">
                                  👨‍🍳 Elkészítés
                                </h5>
                                <div 
                                  className="text-white/90 leading-relaxed text-sm sm:text-base"
                                  dangerouslySetInnerHTML={{ 
                                    __html: mealData.recipe.elkészítés?.replace(/(\d+\.\s)/g, '<br><strong class="text-yellow-300">$1</strong>') || '' 
                                  }}
                                />
                              </div>

                              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-blue-300/30">
                                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🍞</div>
                                  <div className="text-xs sm:text-sm text-blue-200 mb-1">Szénhidrát</div>
                                  <div className="font-bold text-white text-sm sm:text-xl">{mealData.recipe.szénhidrát}g</div>
                                </div>
                                <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-red-300/30">
                                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🥩</div>
                                  <div className="text-xs sm:text-sm text-red-200 mb-1">Fehérje</div>
                                  <div className="font-bold text-white text-sm sm:text-xl">{mealData.recipe.fehérje}g</div>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-yellow-300/30">
                                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🥑</div>
                                  <div className="text-xs sm:text-sm text-yellow-200 mb-1">Zsír</div>
                                  <div className="font-bold text-white text-sm sm:text-xl">{mealData.recipe.zsír}g</div>
                                </div>
                              </div>

                              <div className="text-center pt-4 sm:pt-6 border-t border-white/20">
                                <p className="text-white/80 mb-2 sm:mb-3 font-medium text-sm sm:text-base">Értékeld a receptet:</p>
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
                        <CardContent className="text-center py-6 sm:py-8 px-4 sm:px-6">
                          <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-red-300/30">
                            <p className="text-white/80 text-base sm:text-lg">
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

      {/* Full Screen Recipe Modal */}
      {fullScreenRecipe && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={closeFullScreenRecipe}
        >
          <div className="relative max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-scale-in">
            <button
              onClick={closeFullScreenRecipe}
              className="absolute -top-8 sm:-top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            
            <div className="bg-gradient-to-br from-indigo-600/90 to-purple-700/90 backdrop-blur-sm rounded-2xl p-4 sm:p-8 text-white shadow-2xl border border-white/20">
              <div className="text-center mb-6 sm:mb-8">
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <span className="text-3xl sm:text-4xl">{mealOptions.find(m => m.key === fullScreenRecipe.mealType)?.emoji}</span>
                  <h2 className="text-2xl sm:text-4xl font-bold text-white break-words">{fullScreenRecipe.recipe.név}</h2>
                </div>
                
                {fullScreenRecipe.recipe.képUrl && (
                  <div className="mb-6 sm:mb-8">
                    <img 
                      src={fullScreenRecipe.recipe.képUrl} 
                      alt={fullScreenRecipe.recipe.név}
                      className="max-w-full max-h-60 sm:max-h-80 mx-auto rounded-2xl shadow-2xl border-4 border-white/30"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    📝 Hozzávalók ({fullScreenRecipe.recipe.hozzávalók?.length || 0} db)
                  </h3>
                  <ul className="text-white/90 space-y-2 sm:space-y-3">
                    {fullScreenRecipe.recipe.hozzávalók?.map((ingredient, index) => (
                      <li key={index} className="flex items-start bg-white/5 p-2 sm:p-3 rounded-lg">
                        <span className="text-green-400 mr-2 sm:mr-3 font-bold text-base sm:text-lg">•</span>
                        <span className="text-sm sm:text-lg break-words">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    👨‍🍳 Elkészítés
                  </h3>
                  <div 
                    className="text-white/90 leading-relaxed text-sm sm:text-lg break-words"
                    dangerouslySetInnerHTML={{ 
                      __html: fullScreenRecipe.recipe.elkészítés?.replace(/(\d+\.\s)/g, '<br><strong class="text-yellow-300">$1</strong>') || '' 
                    }}
                  />
                </div>
              </div>

              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">📊 Táp értékek</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-3 sm:p-6 text-center border border-blue-300/30">
                    <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">⏱️</div>
                    <div className="text-white font-semibold text-xs sm:text-lg break-words">{fullScreenRecipe.recipe.elkészítésiIdő}</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-xl p-3 sm:p-6 text-center border border-red-300/30">
                    <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🥩</div>
                    <div className="text-white font-semibold text-xs sm:text-lg">{fullScreenRecipe.recipe.fehérje}g fehérje</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-xl p-3 sm:p-6 text-center border border-yellow-300/30">
                    <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🍞</div>
                    <div className="text-white font-semibold text-xs sm:text-lg">{fullScreenRecipe.recipe.szénhidrát}g szénhidrát</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-3 sm:p-6 text-center border border-green-300/30">
                    <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🥑</div>
                    <div className="text-white font-semibold text-xs sm:text-lg">{fullScreenRecipe.recipe.zsír}g zsír</div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4 sm:pt-6 border-t border-white/20">
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">⭐ Értékeld a receptet:</h3>
                <StarRating 
                  recipeName={fullScreenRecipe.recipe.név} 
                  onRate={(rating) => handleRating(fullScreenRecipe.recipe.név, rating)}
                />
              </div>
              
              <div className="text-center mt-6 sm:mt-8">
                <p className="text-white/70 text-sm sm:text-lg">Kattints bárhova a bezáráshoz</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
