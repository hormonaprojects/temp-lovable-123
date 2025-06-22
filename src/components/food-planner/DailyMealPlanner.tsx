import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MealSelectionCard } from "./MealSelectionCard";
import { Recipe } from "@/types/recipe";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { LoadingChef } from "@/components/ui/LoadingChef";
import { RecipeDisplay } from "./RecipeDisplay";

interface MealPlan {
  mealType: string;
  category: string;
  ingredient: string;
  recipe: Recipe | null;
}

interface DailyMealPlannerProps {
  user: any;
  onToggleSingleRecipe: () => void;
}

export function DailyMealPlanner({ user, onToggleSingleRecipe }: DailyMealPlannerProps) {
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  const [mealSelections, setMealSelections] = useState<Record<string, { category: string; ingredient: string }>>({});
  const [generatedPlan, setGeneratedPlan] = useState<Record<string, MealPlan>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentlyRegeneratingMeal, setCurrentlyRegeneratingMeal] = useState<string | null>(null);
  const { toast } = useToast();

  const { 
    categories, 
    loading: dataLoading, 
    getRecipesByMealType,
    getRecipesByCategory,
    getFilteredIngredients,
    convertToStandardRecipe,
    getFavoriteForIngredient
  } = useSupabaseData(user.id);

  const mealTypes = [
    { key: 'reggeli', label: 'Reggeli', emoji: '🍳' },
    { key: 'ebéd', label: 'Ebéd', emoji: '🍽️' },
    { key: 'vacsora', label: 'Vacsora', emoji: '🌙' }
  ];

  const handleMealTypeToggle = (mealKey: string) => {
    setSelectedMealTypes(prev => {
      if (prev.includes(mealKey)) {
        const newSelected = prev.filter(key => key !== mealKey);
        // Remove from selections when unchecked
        setMealSelections(prevSelections => {
          const newSelections = { ...prevSelections };
          delete newSelections[mealKey];
          return newSelections;
        });
        return newSelected;
      } else {
        return [...prev, mealKey];
      }
    });
  };

  const handleSelectionChange = (mealType: string, category: string, ingredient: string) => {
    setMealSelections(prev => ({
      ...prev,
      [mealType]: { category, ingredient }
    }));
  };

  const generateMealPlan = async () => {
    if (selectedMealTypes.length === 0) {
      toast({
        title: "Hiba",
        description: "Válasszon ki legalább egy étkezési típust!",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedPlan({});
    
    try {
      const newMealPlan: Record<string, MealPlan> = {};
      
      for (const mealType of selectedMealTypes) {
        const selection = mealSelections[mealType];
        let foundRecipes = [];

        if (selection?.category && selection?.ingredient && 
            selection.category !== "no-category" && selection.ingredient !== "no-ingredient") {
          foundRecipes = getRecipesByCategory(selection.category, selection.ingredient, mealType);
        } else if (selection?.category && selection.category !== "no-category") {
          foundRecipes = getRecipesByCategory(selection.category, undefined, mealType);
        } else {
          foundRecipes = getRecipesByMealType(mealType);
        }

        if (foundRecipes.length > 0) {
          const randomIndex = Math.floor(Math.random() * foundRecipes.length);
          const selectedSupabaseRecipe = foundRecipes[randomIndex];
          const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
          
          newMealPlan[mealType] = {
            mealType,
            category: selection?.category || "",
            ingredient: selection?.ingredient || "",
            recipe: standardRecipe
          };
        } else {
          newMealPlan[mealType] = {
            mealType,
            category: selection?.category || "",
            ingredient: selection?.ingredient || "",
            recipe: null
          };
        }
      }
      
      setGeneratedPlan(newMealPlan);
      
      const successCount = Object.values(newMealPlan).filter(plan => plan.recipe !== null).length;
      toast({
        title: "Napi étrend elkészült!",
        description: `${successCount}/${selectedMealTypes.length} recept sikeresen generálva.`,
      });
      
    } catch (error) {
      console.error('❌ Napi étrend generálási hiba:', error);
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
    setCurrentlyRegeneratingMeal(mealType);
    
    try {
      console.log(`🔄 ${mealType} újragenerálása:`, { category, ingredient });
      
      let foundRecipes = [];

      if (category && ingredient && category !== "no-category" && ingredient !== "no-ingredient") {
        foundRecipes = getRecipesByCategory(category, ingredient, mealType);
      } else if (category && category !== "no-category") {
        foundRecipes = getRecipesByCategory(category, undefined, mealType);
      } else {
        foundRecipes = getRecipesByMealType(mealType);
      }

      if (foundRecipes.length > 0) {
        const randomIndex = Math.floor(Math.random() * foundRecipes.length);
        const selectedSupabaseRecipe = foundRecipes[randomIndex];
        const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
        
        setGeneratedPlan(prev => ({
          ...prev,
          [mealType]: {
            mealType,
            category: category || "",
            ingredient: ingredient || "",
            recipe: standardRecipe
          }
        }));
        
        toast({
          title: "Recept újragenerálva!",
          description: `${standardRecipe.név} sikeresen betöltve.`,
        });
      } else {
        toast({
          title: "Nincs több recept",
          description: `Nincs több megfelelő recept ehhez az étkezéshez.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error(`❌ Hiba a ${mealType} újragenerálásakor:`, error);
      toast({
        title: "Hiba",
        description: "Nem sikerült újragenerálni a receptet.",
        variant: "destructive"
      });
    } finally {
      setCurrentlyRegeneratingMeal(null);
    }
  };

  const resetPlanner = () => {
    setSelectedMealTypes([]);
    setMealSelections({});
    setGeneratedPlan({});
  };

  if (dataLoading) {
    return <LoadingChef />;
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 sm:mb-4">📅 Napi Étrendtervező</h1>
          <p className="text-white/80 text-lg sm:text-xl px-4 leading-relaxed">
            Tervezz teljes napot egyszerre! Válaszd ki az étkezéseket és generálj egy komplett étrendet.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-8 sm:mb-10 px-4">
        <Button
          onClick={resetPlanner}
          className="bg-gradient-to-r from-red-500/80 to-pink-600/80 hover:from-red-600/90 hover:to-pink-700/90 backdrop-blur-sm border border-red-300/20 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          🔄 Új tervezés
        </Button>
        <Button
          onClick={onToggleSingleRecipe}
          className="bg-gradient-to-r from-blue-500/80 to-indigo-600/80 hover:from-blue-600/90 hover:to-indigo-700/90 backdrop-blur-sm border border-blue-300/20 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          🍽️ Egy recept mód
        </Button>
      </div>

      {/* Meal Type Selection */}
      <Card className="mb-8 bg-white/10 backdrop-blur-sm border border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-xl">Étkezések kiválasztása</CardTitle>
          <CardDescription className="text-white/70">
            Válaszd ki, mely étkezésekhez szeretnél receptet generálni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {mealTypes.map((mealType) => (
              <MealSelectionCard
                key={mealType.key}
                mealType={mealType.key}
                mealLabel={mealType.label}
                emoji={mealType.emoji}
                isSelected={selectedMealTypes.includes(mealType.key)}
                onToggle={handleMealTypeToggle}
                categories={Object.keys(categories)}
                getIngredientsByCategory={(category) => getFilteredIngredients(category)}
                getFavoriteForIngredient={getFavoriteForIngredient}
                onGetRecipe={regenerateSpecificMeal}
                onSelectionChange={handleSelectionChange}
                isGenerating={currentlyRegeneratingMeal === mealType.key}
                showRecipeButton={!!generatedPlan[mealType.key]}
              />
            ))}
          </div>

          {selectedMealTypes.length > 0 && (
            <div className="mt-6 text-center">
              <Button
                onClick={generateMealPlan}
                disabled={isGenerating}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Étrend generálása...
                  </>
                ) : (
                  "🎯 Napi étrend generálása"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Recipes */}
      {Object.keys(generatedPlan).length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            🍽️ A mai étrendjed
          </h2>
          {Object.entries(generatedPlan).map(([mealType, plan]) => {
            const mealTypeInfo = mealTypes.find(mt => mt.key === mealType);
            return (
              <div key={mealType} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{mealTypeInfo?.emoji}</span>
                  <h3 className="text-xl font-semibold text-white">{mealTypeInfo?.label}</h3>
                  {plan.category && (
                    <span className="text-sm text-white/70">
                      ({plan.category} {plan.ingredient && `- ${plan.ingredient}`})
                    </span>
                  )}
                </div>
                
                {plan.recipe ? (
                  <RecipeDisplay
                    recipe={plan.recipe}
                    isLoading={false}
                    onRegenerate={() => regenerateSpecificMeal(mealType, plan.category, plan.ingredient)}
                    onNewRecipe={resetPlanner}
                    user={user}
                  />
                ) : (
                  <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                    <p className="text-white/70 text-center">
                      Nem található recept ehhez az étkezéshez a megadott feltételekkel.
                    </p>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
