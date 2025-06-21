import { useState, useEffect } from "react";
import { MealTypeSelector } from "./MealTypeSelector";
import { CategoryIngredientSelector } from "./CategoryIngredientSelector";
import { RecipeDisplay } from "./RecipeDisplay";
import { MultiDayMealPlanGenerator } from "./MultiDayMealPlanGenerator";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/types/recipe";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { LoadingChef } from "@/components/ui/LoadingChef";

interface MultiDayMealPlan {
  day: number;
  date: string;
  meals: {
    [mealType: string]: Recipe | null;
  };
}

interface SingleRecipeAppProps {
  user: any;
  onToggleDailyPlanner: () => void;
}

export function SingleRecipeApp({ user, onToggleDailyPlanner }: SingleRecipeAppProps) {
  const [selectedMealType, setSelectedMealType] = useState("");
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'multi'>('single');
  const [multiDayPlan, setMultiDayPlan] = useState<MultiDayMealPlan[]>([]);
  const [isMultiDayLoading, setIsMultiDayLoading] = useState(false);
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
    convertToStandardRecipe
  } = useSupabaseData(user.id);

  const getRecipe = async (category: string, ingredient: string) => {
    if (!selectedMealType) return;

    setIsLoading(true);
    setCurrentRecipe(null);
    
    setLastSearchParams({ category, ingredient, mealType: selectedMealType });

    try {
      console.log('🔍 SZIGORÚ recept keresése preferenciákkal:', { selectedMealType, category, ingredient });
      
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 3000));
      
      let foundRecipes = [];

      if (category && ingredient) {
        foundRecipes = getRecipesByCategory(category, ingredient, selectedMealType);
        console.log(`🎯 SZIGORÚ specifikus keresés eredménye (preferenciákkal): ${foundRecipes.length} recept`);
      } else if (category) {
        foundRecipes = getRecipesByCategory(category, undefined, selectedMealType);
        console.log(`🎯 SZIGORÚ kategória keresés eredménye (preferenciákkal): ${foundRecipes.length} recept`);
      } else {
        foundRecipes = getRecipesByMealType(selectedMealType);
        console.log(`🎯 Random étkezési típus keresés eredménye (preferenciákkal prioritizálva): ${foundRecipes.length} recept`);
      }

      await minLoadingTime;

      if (foundRecipes.length > 0) {
        const randomIndex = Math.floor(Math.random() * foundRecipes.length);
        const selectedSupabaseRecipe = foundRecipes[randomIndex];
        const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
        
        setCurrentRecipe(standardRecipe);
        
        toast({
          title: "Recept betöltve!",
          description: `${standardRecipe.név} sikeresen betöltve az adatbázisból (preferenciáiddal).`,
        });
      } else {
        let errorMessage = "";
        if (category && ingredient) {
          errorMessage = `Nincs "${ingredient}" alapanyaggal recept "${selectedMealType}" étkezéshez a "${category}" kategóriában (preferenciáid szerint).`;
        } else if (category) {
          errorMessage = `Nincs recept "${selectedMealType}" étkezéshez a "${category}" kategóriában (preferenciáid szerint).`;
        } else {
          errorMessage = `Nincs recept "${selectedMealType}" étkezéshez (preferenciáid szerint).`;
        }
        
        toast({
          title: "Nincs megfelelő recept",
          description: errorMessage,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Hiba a recept kérésekor:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a receptet az adatbázisból.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMultipleRecipes = async (category: string, ingredients: string[]) => {
    if (!selectedMealType) return;

    setIsLoading(true);
    setCurrentRecipe(null);
    
    // Több alapanyag esetén a kategóriát és az első alapanyagot tároljuk
    setLastSearchParams({ category, ingredient: ingredients.join(", "), mealType: selectedMealType });

    try {
      console.log('🔍 TÖBB alapanyaggal recept keresése:', { selectedMealType, category, ingredients });
      
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 3000));
      
      // Receptek keresése az összes megadott alapanyag alapján
      let allFoundRecipes = [];
      
      for (const ingredient of ingredients) {
        const foundRecipes = getRecipesByCategory(category, ingredient, selectedMealType);
        allFoundRecipes.push(...foundRecipes);
      }
      
      // Duplikátumok eltávolítása
      const uniqueRecipes = allFoundRecipes.filter((recipe, index, self) =>
        index === self.findIndex(r => r['Recept_Neve'] === recipe['Recept_Neve'])
      );

      await minLoadingTime;

      if (uniqueRecipes.length > 0) {
        const randomIndex = Math.floor(Math.random() * uniqueRecipes.length);
        const selectedSupabaseRecipe = uniqueRecipes[randomIndex];
        const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
        
        setCurrentRecipe(standardRecipe);
        
        toast({
          title: "Recept betöltve!",
          description: `${standardRecipe.név} sikeresen betöltve (${ingredients.length} alapanyag alapján).`,
        });
      } else {
        toast({
          title: "Nincs megfelelő recept",
          description: `Nincs recept "${selectedMealType}" étkezéshez a kiválasztott alapanyagokkal.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Hiba a több alapanyagos recept kérésekor:', error);
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
        
        // Minden étkezési típusra generálunk egy receptet
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

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6">
      {/* Modern Hero Section */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 sm:mb-4">🍽️ Ételtervező</h1>
          <p className="text-white/80 text-lg sm:text-xl px-4 leading-relaxed">
            Válassz étkezést és készíts finom ételeket (preferenciáiddal)!
          </p>
        </div>
      </div>

      {/* Modern Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-8 sm:mb-10 px-4">
        <Button
          onClick={resetForm}
          className="bg-gradient-to-r from-red-500/80 to-pink-600/80 hover:from-red-600/90 hover:to-pink-700/90 backdrop-blur-sm border border-red-300/20 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 text-sm sm:text-base"
        >
          🔄 Új választás
        </Button>
        <Button
          onClick={() => setViewMode(viewMode === 'single' ? 'multi' : 'single')}
          className="bg-gradient-to-r from-green-500/80 to-emerald-600/80 hover:from-green-600/90 hover:to-emerald-700/90 backdrop-blur-sm border border-green-300/20 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 text-sm sm:text-base"
        >
          {viewMode === 'single' ? '📅 Többnapos tervező' : '🍽️ Egy recept'}
        </Button>
        <Button
          onClick={onToggleDailyPlanner}
          className="bg-gradient-to-r from-purple-500/80 to-indigo-600/80 hover:from-purple-600/90 hover:to-indigo-700/90 backdrop-blur-sm border border-purple-300/20 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 text-sm sm:text-base"
        >
          📅 Napi étrendtervező
        </Button>
      </div>

      {viewMode === 'multi' ? (
        <MultiDayMealPlanGenerator
          onGeneratePlan={generateMultiDayPlan}
          isLoading={isMultiDayLoading}
          mealPlan={multiDayPlan}
        />
      ) : (
        <>
          <MealTypeSelector
            selectedMealType={selectedMealType}
            onSelectMealType={setSelectedMealType}
            foodData={foodData}
          />

          {selectedMealType && (
            <CategoryIngredientSelector
              selectedMealType={selectedMealType}
              foodData={foodData}
              onGetRecipe={getRecipe}
              multipleIngredients={true}
              onGetMultipleRecipes={getMultipleRecipes}
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
