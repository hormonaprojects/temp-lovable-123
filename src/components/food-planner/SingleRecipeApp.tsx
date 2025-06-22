import { useState, useEffect } from "react";
import { MealTypeSelector } from "./MealTypeSelector";
import { MultiCategoryIngredientSelector } from "./MultiCategoryIngredientSelector";
import { RecipeDisplay } from "./RecipeDisplay";
import { MultiDayMealPlanGenerator } from "./MultiDayMealPlanGenerator";
import { DailyMealPlanner } from "./DailyMealPlanner";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/types/recipe";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { LoadingChef } from "@/components/ui/LoadingChef";
import { ChefHat, Calendar, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiDayMealPlan {
  day: number;
  date: string;
  meals: {
    [mealType: string]: Recipe | null;
  };
}

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

interface SingleRecipeAppProps {
  user: any;
  onToggleDailyPlanner: () => void;
}

export function SingleRecipeApp({ user, onToggleDailyPlanner }: SingleRecipeAppProps) {
  const [selectedMealType, setSelectedMealType] = useState("");
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'daily' | 'multi'>('single');
  const [multiDayPlan, setMultiDayPlan] = useState<MultiDayMealPlan[]>([]);
  const [isMultiDayLoading, setIsMultiDayLoading] = useState(false);
  const [showIngredientSelection, setShowIngredientSelection] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState<{
    category: string;
    ingredient: string;
    mealType: string;
  }>({ category: "", ingredient: "", mealType: "" });
  const { toast } = useToast();
  
  const { 
    categories, 
    mealTypes, 
    loading: dataLoading, 
    getRecipesByMealType,
    getRecipesByCategory,
    getRandomRecipe,
    getFilteredIngredients,
    convertToStandardRecipe,
    getFavoriteForIngredient,
    refreshFavorites,
    recipes
  } = useSupabaseData(user.id);

  // Kedvencek újratöltése amikor a komponens mountálódik
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Kedvencek újratöltése SingleRecipeApp-ben...');
      refreshFavorites();
    }
  }, [user?.id, refreshFavorites]);

  // AUTOMATIKUS receptgenerálás amikor meal type változik
  useEffect(() => {
    if (selectedMealType && !showIngredientSelection) {
      console.log('🎯 Meal type változott, automatikus receptgenerálás:', selectedMealType);
      handleAutoGenerateRecipe();
    }
  }, [selectedMealType]);

  const handleAutoGenerateRecipe = async () => {
    if (!selectedMealType) return;
    
    setIsLoading(true);
    setCurrentRecipe(null);
    
    try {
      console.log('🔍 AUTOMATIKUS recept generálás preferenciákkal:', selectedMealType);
      
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
      
      const foundRecipes = getRecipesByMealType(selectedMealType);
      console.log(`🎯 Automatikus keresés eredménye: ${foundRecipes.length} recept`);

      await minLoadingTime;

      if (foundRecipes.length > 0) {
        const randomIndex = Math.floor(Math.random() * foundRecipes.length);
        const selectedSupabaseRecipe = foundRecipes[randomIndex];
        const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
        
        setCurrentRecipe(standardRecipe);
        setLastSearchParams({ category: "", ingredient: "", mealType: selectedMealType });
        
        toast({
          title: "Recept betöltve!",
          description: `${standardRecipe.név} automatikusan betöltve (preferenciáiddal).`,
        });
      } else {
        toast({
          title: "Nincs megfelelő recept",
          description: `Nincs recept "${selectedMealType}" étkezéshez (preferenciáid szerint).`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Hiba az automatikus recept generálásakor:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült automatikusan betölteni a receptet.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMultipleCategoryRecipes = async (selectedIngredients: SelectedIngredient[]) => {
    if (!selectedMealType || selectedIngredients.length === 0) return;

    setIsLoading(true);
    setCurrentRecipe(null);
    
    const ingredientsText = selectedIngredients.map(ing => `${ing.ingredient} (${ing.category})`).join(", ");
    setLastSearchParams({ category: "Több kategória", ingredient: ingredientsText, mealType: selectedMealType });

    try {
      console.log('🔍 TÖBB KATEGÓRIÁS alapanyaggal recept keresése:', { selectedMealType, selectedIngredients });
      
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 3000));
      
      // JAVÍTOTT logika: olyan recepteket keresünk, amelyek MINDEN kiválasztott alapanyagot tartalmazzák
      const mealTypeRecipes = getRecipesByMealType(selectedMealType);
      console.log(`📋 ${selectedMealType} étkezéshez tartozó receptek:`, mealTypeRecipes.length);
      
      // Ellenőrizzük minden receptet, hogy tartalmazza-e az ÖSSZES kiválasztott alapanyagot
      const getAllRecipeIngredients = (recipe: any): string[] => {
        return [
          recipe['Hozzavalo_1'], recipe['Hozzavalo_2'], recipe['Hozzavalo_3'],
          recipe['Hozzavalo_4'], recipe['Hozzavalo_5'], recipe['Hozzavalo_6'],
          recipe['Hozzavalo_7'], recipe['Hozzavalo_8'], recipe['Hozzavalo_9'],
          recipe['Hozzavalo_10'], recipe['Hozzavalo_11'], recipe['Hozzavalo_12'],
          recipe['Hozzavalo_13'], recipe['Hozzavalo_14'], recipe['Hozzavalo_15'],
          recipe['Hozzavalo_16'], recipe['Hozzavalo_17'], recipe['Hozzavalo_18']
        ].filter(Boolean).map(ing => ing?.toString() || '');
      };

      const normalizeText = (text: string): string => {
        return text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, '')
          .trim();
      };

      const hasIngredient = (recipeIngredients: string[], searchIngredient: string): boolean => {
        const searchNormalized = normalizeText(searchIngredient);
        return recipeIngredients.some(recipeIng => {
          const recipeIngNormalized = normalizeText(recipeIng);
          return recipeIngNormalized.includes(searchNormalized) || searchNormalized.includes(recipeIngNormalized);
        });
      };

      const validRecipes = mealTypeRecipes.filter(recipe => {
        const recipeIngredients = getAllRecipeIngredients(recipe);
        console.log(`\n🔍 Recept vizsgálata: ${recipe['Recept_Neve']}`);
        console.log(`📝 Hozzávalók:`, recipeIngredients);
        
        // Ellenőrizzük, hogy MINDEN kiválasztott alapanyag szerepel-e a receptben
        const hasAllIngredients = selectedIngredients.every(selectedIng => {
          const found = hasIngredient(recipeIngredients, selectedIng.ingredient);
          console.log(`${found ? '✅' : '❌'} "${selectedIng.ingredient}" ${found ? 'MEGTALÁLVA' : 'HIÁNYZIK'}`);
          return found;
        });
        
        if (hasAllIngredients) {
          console.log(`✅ ✅ ✅ ELFOGADVA: "${recipe['Recept_Neve']}" TARTALMAZZA az ÖSSZES kiválasztott alapanyagot!`);
        } else {
          console.log(`❌ ❌ ❌ ELUTASÍTVA: "${recipe['Recept_Neve']}" NEM tartalmazza az összes alapanyagot!`);
        }
        
        return hasAllIngredients;
      });

      await minLoadingTime;

      if (validRecipes.length > 0) {
        const randomIndex = Math.floor(Math.random() * validRecipes.length);
        const selectedSupabaseRecipe = validRecipes[randomIndex];
        const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
        
        setCurrentRecipe(standardRecipe);
        
        console.log(`✅ SIKERES TALÁLAT: "${standardRecipe.név}" receptben minden alapanyag megtalálható!`);
        
        toast({
          title: "Recept betöltve!",
          description: `${standardRecipe.név} sikeresen betöltve (${selectedIngredients.length} alapanyag több kategóriából).`,
        });
      } else {
        console.log('❌ NINCS OLYAN RECEPT, ami minden kiválasztott alapanyagot tartalmazná!');
        toast({
          title: "Nincs megfelelő recept",
          description: `Nincs olyan recept "${selectedMealType}" étkezéshez, amely minden kiválasztott alapanyagot tartalmazná.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Hiba a több kategóriás recept kérésekor:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a receptet.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMultiDayPlan = async (days: number): Promise<MultiDayMealPlan[]> => {
    setIsMultiDayLoading(true);
    
    try {
      const mealTypesArray = ['reggeli', 'ebéd', 'vacsora'];
      const newPlan: MultiDayMealPlan[] = [];
      
      for (let day = 1; day <= days; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day - 1);
        const formattedDate = date.toLocaleDateString('hu-HU');
        
        const dayPlan: MultiDayMealPlan = {
          day,
          date: formattedDate,
          meals: {}
        };
        
        for (const mealType of mealTypesArray) {
          const foundRecipes = getRecipesByMealType(mealType);
          if (foundRecipes.length > 0) {
            const randomIndex = Math.floor(Math.random() * foundRecipes.length);
            const selectedSupabaseRecipe = foundRecipes[randomIndex];
            const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
            dayPlan.meals[mealType] = standardRecipe;
          } else {
            dayPlan.meals[mealType] = null;
          }
        }
        
        newPlan.push(dayPlan);
      }
      
      setMultiDayPlan(newPlan);
      
      toast({
        title: "Többnapos étrend generálva!",
        description: `${days} napos étrend sikeresen elkészült.`,
      });
      
      return newPlan;
      
    } catch (error) {
      console.error('❌ Hiba a többnapos étrend generálásakor:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült generálni a többnapos étrendet.",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsMultiDayLoading(false);
    }
  };

  const regenerateRecipe = async () => {
    if (selectedMealType) {
      setIsLoading(true);
      setCurrentRecipe(null);
      
      try {
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🔄 SZIGORÚ újragenerálás ugyanazokkal a paraméterekkel (preferenciákkal):', lastSearchParams);
        
        let foundRecipes = [];
        
        if (lastSearchParams.category && lastSearchParams.ingredient) {
          foundRecipes = getRecipesByCategory(lastSearchParams.category, lastSearchParams.ingredient, selectedMealType);
        } else if (lastSearchParams.category) {
          foundRecipes = getRecipesByCategory(lastSearchParams.category, undefined, selectedMealType);
        } else {
          foundRecipes = getRecipesByMealType(selectedMealType);
        }

        await minLoadingTime;

        if (foundRecipes.length > 0) {
          const randomIndex = Math.floor(Math.random() * foundRecipes.length);
          const selectedSupabaseRecipe = foundRecipes[randomIndex];
          const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
          
          setCurrentRecipe(standardRecipe);
          
          toast({
            title: "Új recept betöltve!",
            description: `${standardRecipe.név} sikeresen betöltve az adatbázisból (preferenciáiddal).`,
          });
        } else {
          let errorMessage = "";
          if (lastSearchParams.category && lastSearchParams.ingredient) {
            errorMessage = `Nincs több "${lastSearchParams.ingredient}" alapanyaggal recept "${selectedMealType}" étkezéshez a "${lastSearchParams.category}" kategóriában (preferenciáid szerint).`;
          } else if (lastSearchParams.category) {
            errorMessage = `Nincs több recept "${selectedMealType}" étkezéshez a "${lastSearchParams.category}" kategóriában (preferenciáid szerint).`;
          } else {
            errorMessage = `Nincs több recept "${selectedMealType}" étkezéshez (preferenciáid szerint).`;
          }
          
          toast({
            title: "Nincs megfelelő recept",
            description: errorMessage,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('❌ Hiba az újrageneráláskor:', error);
        toast({
          title: "Hiba",
          description: "Nem sikerült újragenerálni a receptet.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetForm = () => {
    setSelectedMealType("");
    setCurrentRecipe(null);
    setMultiDayPlan([]);
    setViewMode('single');
    setShowIngredientSelection(false);
    setLastSearchParams({ category: "", ingredient: "", mealType: "" });
  };

  // Transform mealTypes to match FoodData interface
  const transformedMealTypes = Object.keys(mealTypes).reduce((acc, mealType) => {
    acc[mealType] = {
      categories: categories
    };
    return acc;
  }, {} as { [key: string]: { categories: { [key: string]: string[] } } });

  const foodData = {
    mealTypes: transformedMealTypes,
    categories: categories,
    getFilteredIngredients: getFilteredIngredients,
    getRecipesByMealType: getRecipesByMealType
  };

  console.log('🗂️ FoodData átadva komponenseknek:', foodData);

  if (dataLoading) {
    return <LoadingChef />;
  }

  const handleMealTypeSelect = (mealType: string) => {
    console.log('🎯 Meal type kiválasztás (SingleRecipeApp):', mealType);
    setSelectedMealType(mealType);
    setShowIngredientSelection(false);
    setCurrentRecipe(null);
  };

  const handleGetRandomRecipe = async () => {
    console.log('🎲 Manuális random recept kérés');
    if (selectedMealType) {
      setShowIngredientSelection(false);
      await handleAutoGenerateRecipe();
    }
  };

  const handleShowIngredientSelection = () => {
    setShowIngredientSelection(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6">
      {/* Modern Hero Section */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 sm:mb-4">🍽️ Ételtervező</h1>
          <p className="text-white/80 text-lg sm:text-xl px-4 leading-relaxed">
            Válassz funkciót és kezdd el az ételek tervezését!
          </p>
        </div>
      </div>

      {/* Function Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 sm:mb-10">
        {/* Single Recipe Card */}
        <div
          onClick={() => setViewMode('single')}
          className={cn(
            "group cursor-pointer transition-all duration-300 hover:scale-105",
            viewMode === 'single' ? "ring-4 ring-purple-400" : ""
          )}
        >
          <div className={cn(
            "bg-gradient-to-br rounded-2xl p-6 h-40 flex flex-col items-center justify-center text-center border shadow-xl transition-all duration-300",
            viewMode === 'single' 
              ? "from-purple-500/40 to-pink-500/40 border-purple-400 shadow-2xl" 
              : "from-white/10 to-white/5 border-white/20 hover:from-white/20 hover:to-white/10"
          )}>
            <ChefHat className="h-12 w-12 text-white mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">Egy recept</h3>
            <p className="text-white/70 text-sm">Generálj egy receptet alapanyagok alapján</p>
          </div>
        </div>

        {/* Daily Planner Card */}
        <div
          onClick={() => setViewMode('daily')}
          className={cn(
            "group cursor-pointer transition-all duration-300 hover:scale-105",
            viewMode === 'daily' ? "ring-4 ring-blue-400" : ""
          )}
        >
          <div className={cn(
            "bg-gradient-to-br rounded-2xl p-6 h-40 flex flex-col items-center justify-center text-center border shadow-xl transition-all duration-300",
            viewMode === 'daily' 
              ? "from-blue-500/40 to-cyan-500/40 border-blue-400 shadow-2xl" 
              : "from-white/10 to-white/5 border-white/20 hover:from-white/20 hover:to-white/10"
          )}>
            <Calendar className="h-12 w-12 text-white mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">Napi étrendtervező</h3>
            <p className="text-white/70 text-sm">Tervezz egy teljes napot étkezésekkel</p>
          </div>
        </div>

        {/* Multi-day Planner Card */}
        <div
          onClick={() => setViewMode('multi')}
          className={cn(
            "group cursor-pointer transition-all duration-300 hover:scale-105",
            viewMode === 'multi' ? "ring-4 ring-green-400" : ""
          )}
        >
          <div className={cn(
            "bg-gradient-to-br rounded-2xl p-6 h-40 flex flex-col items-center justify-center text-center border shadow-xl transition-all duration-300",
            viewMode === 'multi' 
              ? "from-green-500/40 to-emerald-500/40 border-green-400 shadow-2xl" 
              : "from-white/10 to-white/5 border-white/20 hover:from-white/20 hover:to-white/10"
          )}>
            <CalendarDays className="h-12 w-12 text-white mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">Többnapos tervező</h3>
            <p className="text-white/70 text-sm">Készíts több napra szóló étrendet</p>
          </div>
        </div>
      </div>

      {viewMode === 'multi' ? (
        <MultiDayMealPlanGenerator
          onGeneratePlan={generateMultiDayPlan}
          isLoading={isMultiDayLoading}
          mealPlan={multiDayPlan}
        />
      ) : viewMode === 'daily' ? (
        <DailyMealPlanner
          user={user}
          onToggleSingleRecipe={() => setViewMode('single')}
        />
      ) : (
        <>
          <MealTypeSelector
            selectedMealType={selectedMealType}
            onSelectMealType={handleMealTypeSelect}
            foodData={foodData}
            onGetRandomRecipe={handleGetRandomRecipe}
            onShowMultiCategorySelection={handleShowIngredientSelection}
          />

          {selectedMealType && showIngredientSelection && (
            <MultiCategoryIngredientSelector
              selectedMealType={selectedMealType}
              foodData={foodData}
              onGetMultipleCategoryRecipes={getMultipleCategoryRecipes}
              getFavoriteForIngredient={(ingredient: string, category: string) => {
                console.log('🔍 SingleRecipeApp - Multi kategória kedvenc ellenőrzés:', { ingredient, category });
                const result = getFavoriteForIngredient(ingredient, category);
                console.log('✅ SingleRecipeApp - Multi kategória kedvenc eredmény:', result);
                return result;
              }}
            />
          )}

          <RecipeDisplay
            recipe={currentRecipe}
            isLoading={isLoading}
            onRegenerate={regenerateRecipe}
            onNewRecipe={resetForm}
            user={user}
          />
        </>
      )}
    </div>
  );
}
