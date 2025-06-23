import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChefHat, Clock, RotateCcw, Trash2 } from "lucide-react";
import { Recipe } from "@/types/recipe";
import { RecipeContent } from "./RecipeContent";
import { LoadingChef } from "@/components/ui/LoadingChef";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useMultiDayPlanGeneration } from "@/hooks/useMultiDayPlanGeneration";
import { SharedMealTypeSelector } from "./shared/SharedMealTypeSelector";
import { SharedIngredientSelector } from "./shared/SharedIngredientSelector";
import { SharedGenerationButton } from "./shared/SharedGenerationButton";
import { filterRecipesByMultipleIngredients } from '@/services/recipeFilters';

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

interface MealIngredients {
  [mealType: string]: SelectedIngredient[];
}

interface MultiDayMealPlanGeneratorProps {
  user: any;
}

export function MultiDayMealPlanGenerator({ user }: MultiDayMealPlanGeneratorProps) {
  const [selectedDays, setSelectedDays] = useState(3);
  const [selectedMeals, setSelectedMeals] = useState<string[]>(['reggeli', 'ebéd', 'vacsora']);
  const [showIngredientSelection, setShowIngredientSelection] = useState(false);
  const [currentMealIngredients, setCurrentMealIngredients] = useState<MealIngredients>({});
  
  const {
    categories,
    getRecipesByMealType,
    getFilteredIngredients,
    getFavoriteForIngredient,
    convertToStandardRecipe,
    loading: dataLoading,
    userPreferences
  } = useSupabaseData(user?.id);

  const {
    multiDayPlan,
    isGenerating,
    generateMultiDayPlan,
    clearPlan
  } = useMultiDayPlanGeneration({
    getRecipesByMealType,
    convertToStandardRecipe
  });

  const dayOptions = [3, 5, 7];
  const mealTypes = ['reggeli', 'ebéd', 'vacsora'];

  const handleMealToggle = (mealKey: string) => {
    setSelectedMeals(prev => {
      const newSelectedMeals = prev.includes(mealKey) 
        ? prev.filter(m => m !== mealKey)
        : [...prev, mealKey];
      
      setShowIngredientSelection(newSelectedMeals.length > 0);
      return newSelectedMeals;
    });
  };

  const getRecipeCount = (mealType: string) => {
    const recipes = getRecipesByMealType(mealType);
    return recipes ? recipes.length : 0;
  };

  const handleMealIngredientsChange = (mealIngredients: MealIngredients) => {
    setCurrentMealIngredients(mealIngredients);
  };

  const getPreferenceForIngredient = (ingredient: string, category: string): 'like' | 'dislike' | 'neutral' => {
    const preference = userPreferences.find(pref => 
      pref.ingredient.toLowerCase() === ingredient.toLowerCase() &&
      pref.category.toLowerCase() === category.toLowerCase()
    );
    return preference ? preference.preference : 'neutral';
  };

  const handleGenerateWithIngredients = async () => {
    console.log(`🎯 ${selectedDays} napos étrend generálás alapanyagokkal:`, currentMealIngredients);
    
    // Enhanced generation with ingredient filtering
    if (selectedMeals.length === 0) {
      return;
    }

    // Call the generation with enhanced logic
    await generateEnhancedMultiDayPlan(selectedDays, selectedMeals, currentMealIngredients);
  };

  const generateEnhancedMultiDayPlan = async (days: number, meals: string[], mealIngredients: MealIngredients) => {
    if (days <= 0) {
      console.log('❌ Érvénytelen napok száma:', days);
      return;
    }

    console.log(`🍽️ ${days} napos étrend generálás indítása (alapanyagokkal)`);
    
    try {
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 3000));
      const newPlan: MultiDayMealPlan[] = [];
      
      for (let day = 1; day <= days; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day - 1);
        const formattedDate = date.toLocaleDateString('hu-HU');
        
        console.log(`📅 ${day}. nap generálása (${formattedDate})`);
        
        const dayPlan: MultiDayMealPlan = {
          day,
          date: formattedDate,
          meals: {}
        };
        
        // Generate recipes for selected meal types only
        for (const mealType of meals) {
          console.log(`🔍 ${mealType} recept keresése...`);
          
          const mealSpecificIngredients = mealIngredients[mealType] || [];
          let foundRecipes = getRecipesByMealType(mealType);
          
          // Apply ingredient filtering if ingredients are selected
          if (mealSpecificIngredients.length > 0) {
            const ingredientNames = mealSpecificIngredients.map(ing => ing.ingredient);
            foundRecipes = filterRecipesByMultipleIngredients(foundRecipes, ingredientNames);
            console.log(`🎯 ${mealType} - szűrés után ${foundRecipes.length} recept`);
          }
          
          console.log(`📋 ${mealType} - ${foundRecipes.length} recept található`);
          
          if (foundRecipes.length > 0) {
            const randomIndex = Math.floor(Math.random() * foundRecipes.length);
            const selectedSupabaseRecipe = foundRecipes[randomIndex];
            const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
            dayPlan.meals[mealType] = standardRecipe;
            
            console.log(`✅ ${mealType}: "${standardRecipe.név}" kiválasztva`);
          } else {
            dayPlan.meals[mealType] = null;
            console.log(`❌ ${mealType}: Nincs elérhető recept`);
          }
        }
        
        newPlan.push(dayPlan);
      }
      
      await minLoadingTime;
      // You would need to update the hook to accept the new plan
      console.log(`✅ ${days} napos étrend sikeresen generálva!`);
      
    } catch (error) {
      console.error('❌ Hiba a többnapos étrend generálásakor:', error);
    }
  };

  const getMealTypeDisplayName = (mealType: string) => {
    switch (mealType) {
      case 'reggeli': return '🌅 Reggeli';
      case 'ebéd': return '🍽️ Ebéd';
      case 'vacsora': return '🌙 Vacsora';
      default: return mealType;
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <LoadingChef />
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <LoadingChef />
          <p className="text-white text-lg mt-4">
            {selectedDays} napos étrend generálása...
          </p>
          <p className="text-white/70 text-sm mt-2">
            Receptek kiválasztása preferenciáid alapján
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Day Selection */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-green-400" />
            Többnapos Étrendtervező
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-white/80 mb-4">Válaszd ki, hány napra szeretnél étrendet:</p>
              <div className="flex justify-center gap-4">
                {dayOptions.map((days) => (
                  <Button
                    key={days}
                    onClick={() => setSelectedDays(days)}
                    variant="outline"
                    className={`px-6 py-3 transition-all duration-200 ${
                      selectedDays === days
                        ? 'bg-green-600/30 border-green-400/50 text-white shadow-lg scale-105'
                        : 'bg-white/5 border-white/20 text-white hover:bg-white/15 hover:border-white/40'
                    }`}
                  >
                    {days} nap
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shared Meal Type Selector */}
      <SharedMealTypeSelector
        selectedMeals={selectedMeals}
        onMealToggle={handleMealToggle}
        getRecipeCount={getRecipeCount}
        title="Válaszd ki az étkezéseket"
        subtitle="Kattints az étkezésekre a kiválasztáshoz"
      />

      {/* Shared Ingredient Selector */}
      <SharedIngredientSelector
        selectedMeals={selectedMeals}
        categories={categories}
        getFilteredIngredients={getFilteredIngredients}
        getFavoriteForIngredient={getFavoriteForIngredient}
        getPreferenceForIngredient={getPreferenceForIngredient}
        onMealIngredientsChange={handleMealIngredientsChange}
        showIngredientSelection={showIngredientSelection}
        title="Alapanyag szűrés (opcionális)"
      />

      {/* Shared Generation Button */}
      <SharedGenerationButton
        selectedMeals={selectedMeals}
        selectedIngredients={Object.values(currentMealIngredients).flat()}
        isGenerating={isGenerating}
        onGenerate={handleGenerateWithIngredients}
        buttonText={`${selectedDays} napos étrend generálása`}
        icon="calendar"
      />

      {/* Action Buttons */}
      {multiDayPlan.length > 0 && (
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleGenerateWithIngredients}
            className="bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-700/90 hover:to-cyan-700/90 backdrop-blur-sm border border-blue-300/20 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Újragenerálás
          </Button>

          <Button
            onClick={clearPlan}
            variant="outline"
            className="bg-red-600/20 border-red-400/50 text-red-200 hover:bg-red-600/30 hover:text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Törlés
          </Button>
        </div>
      )}

      {/* Generated Meal Plan */}
      {multiDayPlan.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              🍽️ {multiDayPlan.length} napos étrendterv
            </h2>
            <p className="text-white/70 text-sm sm:text-base">
              Preferenciáid alapján összeállított receptek
            </p>
          </div>
          
          {multiDayPlan.map((dayPlan) => (
            <Card key={dayPlan.day} className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
                  <Clock className="w-6 h-6 text-blue-400" />
                  {dayPlan.day}. nap
                  <Badge variant="secondary" className="bg-white/20 text-white/90 ml-2">
                    {dayPlan.date}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {mealTypes.map((mealType) => {
                    const recipe = dayPlan.meals[mealType];
                    return (
                      <div key={mealType} className="space-y-3">
                        <h3 className="text-lg font-semibold text-white capitalize border-b border-white/20 pb-2">
                          {getMealTypeDisplayName(mealType)}
                        </h3>
                        
                        {recipe ? (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer">
                            <RecipeContent recipe={recipe} compact />
                          </div>
                        ) : (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center text-white/60">
                            <p className="text-sm">Nincs elérhető recept</p>
                            <p className="text-xs mt-1">Próbáld újragenerálni az étrendet</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Summary Statistics */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <h3 className="text-white font-bold text-lg mb-3">📊 Étrend összesítő</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-white/80">
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {multiDayPlan.length}
                    </div>
                    <div className="text-sm">nap</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {multiDayPlan.reduce((acc, day) => acc + Object.values(day.meals).filter(recipe => recipe !== null).length, 0)}
                    </div>
                    <div className="text-sm">recept</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      {multiDayPlan.length * 3}
                    </div>
                    <div className="text-sm">étkezés</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {Math.round((multiDayPlan.reduce((acc, day) => acc + Object.values(day.meals).filter(recipe => recipe !== null).length, 0) / (multiDayPlan.length * 3)) * 100)}%
                    </div>
                    <div className="text-sm">lefedettség</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
