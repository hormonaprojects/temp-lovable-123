
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Star } from "lucide-react";
import { MealTypeCardSelector } from "./MealTypeCardSelector";
import { MultiCategoryIngredientSelector } from "./MultiCategoryIngredientSelector";
import { DailyMealHeader } from "./DailyMealHeader";
import { GeneratedMealPlan } from "./GeneratedMealPlan";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { generateDailyMealPlan } from "@/services/dailyMealPlanGenerator";

interface DailyMealPlannerProps {
  user: any;
  onToggleSingleRecipe: () => void;
}

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

export function DailyMealPlanner({ user, onToggleSingleRecipe }: DailyMealPlannerProps) {
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [generatedRecipes, setGeneratedRecipes] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showIngredientSelection, setShowIngredientSelection] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const { toast } = useToast();

  const {
    categories,
    getRecipesByMealType,
    getFilteredIngredients,
    convertToStandardRecipe,
    saveRating,
    loading,
    getFavoriteForIngredient,
    refreshFavorites,
    recipes,
    mealTypes
  } = useSupabaseData(user?.id);

  // Kedvencek újratöltése amikor a komponens mountálódik
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Kedvencek újratöltése DailyMealPlanner-ben...');
      refreshFavorites();
    }
  }, [user?.id, refreshFavorites]);

  const handleMealToggle = (mealKey: string) => {
    setSelectedMeals(prev => {
      const newSelectedMeals = prev.includes(mealKey) 
        ? prev.filter(m => m !== mealKey)
        : [...prev, mealKey];
      
      // Ha van kiválasztott étkezés, mutassuk az alapanyag szűrőt
      setShowIngredientSelection(newSelectedMeals.length > 0);
      
      // Reset generated recipes when meal selection changes
      if (newSelectedMeals.length === 0) {
        setGeneratedRecipes([]);
        setSelectedIngredients([]);
      }
      
      return newSelectedMeals;
    });
  };

  const getRecipeCount = (mealType: string) => {
    const recipes = getRecipesByMealType(mealType);
    return recipes ? recipes.length : 0;
  };

  // Transform categories to match FoodData interface
  const transformedMealTypes = selectedMeals.reduce((acc, mealType) => {
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

  // EGYSÉGES recept generálási függvény
  const handleGenerateMealPlan = async (ingredients: SelectedIngredient[] = []) => {
    if (selectedMeals.length === 0) {
      toast({
        title: "Hiba",
        description: "Válasszon ki legalább egy étkezési típust!",
        variant: "destructive"
      });
      return;
    }

    console.log('🍽️ EGYSÉGES recept generálás indítása:', { selectedMeals, ingredients });
    setIsGenerating(true);
    setSelectedIngredients(ingredients);
    
    try {
      // Extract meal type recipes from mealTypes object
      const mealTypeRecipes: Record<string, string[]> = {};
      Object.keys(mealTypes).forEach(mealType => {
        mealTypeRecipes[mealType] = mealTypes[mealType] || [];
      });

      console.log('📋 Mealtype receptek:', mealTypeRecipes);

      const newRecipes = await generateDailyMealPlan(
        selectedMeals,
        ingredients,
        recipes,
        mealTypeRecipes,
        convertToStandardRecipe
      );
      
      setGeneratedRecipes(newRecipes);
      
      if (newRecipes.length > 0) {
        const ingredientText = ingredients.length > 0 
          ? ` a kiválasztott alapanyagokkal (${ingredients.map(ing => ing.ingredient).join(", ")})`
          : " a preferenciáid alapján";
          
        toast({
          title: "Étrend elkészült!",
          description: `${newRecipes.length} recept sikeresen generálva${ingredientText}.`,
        });
      } else {
        toast({
          title: "Nincs megfelelő recept",
          description: "Nem található elegendő recept a kiválasztott étkezésekhez és alapanyagokhoz. Próbáljon más alapanyagokat vagy étkezési típusokat!",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('❌ Étrend generálási hiba:', error);
      toast({
        title: "Hiba",
        description: "Hiba történt az étrend generálása közben.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGetMultipleCategoryRecipes = async (ingredients: SelectedIngredient[]) => {
    await handleGenerateMealPlan(ingredients);
  };

  const generateDailyMealPlanWithoutIngredients = async () => {
    await handleGenerateMealPlan([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-600">Adatok betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
      <DailyMealHeader onToggleSingleRecipe={onToggleSingleRecipe} />

      <MealTypeCardSelector
        selectedMeals={selectedMeals}
        onMealToggle={handleMealToggle}
        getRecipeCount={getRecipeCount}
      />

      {showIngredientSelection && selectedMeals.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-white">
              🧄 Opcionális alapanyag szűrő
            </CardTitle>
            <p className="text-white/80 text-sm">
              Válasszon alapanyagokat több kategóriából a pontosabb receptekért (opcionális)
            </p>
          </CardHeader>
          <CardContent>
            <MultiCategoryIngredientSelector
              selectedMealType={selectedMeals[0]}
              foodData={foodData}
              onGetMultipleCategoryRecipes={handleGetMultipleCategoryRecipes}
              getFavoriteForIngredient={getFavoriteForIngredient}
            />
          </CardContent>
        </Card>
      )}

      {selectedMeals.length > 0 && selectedIngredients.length === 0 && (
        <div className="text-center">
          <Button
            onClick={generateDailyMealPlanWithoutIngredients}
            disabled={isGenerating}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg transition-all duration-300"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Étrend generálása...
              </>
            ) : (
              <>
                <Star className="mr-2 h-5 w-5" />
                Étrend generálása alapanyagok nélkül ({selectedMeals.length} étkezés)
              </>
            )}
          </Button>
        </div>
      )}

      <GeneratedMealPlan generatedRecipes={generatedRecipes} user={user} />
    </div>
  );
}
