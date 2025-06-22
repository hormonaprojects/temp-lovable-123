
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Star, Heart, Home } from "lucide-react";
import { RecipeDisplay } from "./RecipeDisplay";
import { MealSelectionCard } from "./MealSelectionCard";
import { MealTypeCardSelector } from "./MealTypeCardSelector";
import { useSupabaseData } from "@/hooks/useSupabaseData";

interface DailyMealPlannerProps {
  user: any;
  onToggleSingleRecipe: () => void;
}

interface MealSelections {
  [key: string]: {
    category: string;
    ingredient: string;
  };
}

export function DailyMealPlanner({ user, onToggleSingleRecipe }: DailyMealPlannerProps) {
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [mealSelections, setMealSelections] = useState<MealSelections>({});
  const [generatedRecipes, setGeneratedRecipes] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const {
    categories,
    getRecipesByCategory,
    getFilteredIngredients,
    convertToStandardRecipe,
    saveRating,
    loading,
    getFavoriteForIngredient,
    handleFavoriteToggle,
    refreshFavorites,
    getRecipesByMealType
  } = useSupabaseData(user?.id);

  // Kedvencek újratöltése amikor a komponens mountálódik
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Kedvencek újratöltése DailyMealPlanner-ben...');
      refreshFavorites();
    }
  }, [user?.id, refreshFavorites]);

  const mealTypes = [
    { key: 'reggeli', label: 'Reggeli', emoji: '🍳' },
    { key: 'tízórai', label: 'Tízórai', emoji: '🥪' },
    { key: 'ebéd', label: 'Ebéd', emoji: '🍽️' },
    { key: 'uzsonna', label: 'Uzsonna', emoji: '🧁' },
    { key: 'vacsora', label: 'Vacsora', emoji: '🌮' }
  ];

  const handleMealToggle = (mealKey: string) => {
    setSelectedMeals(prev => 
      prev.includes(mealKey) 
        ? prev.filter(m => m !== mealKey)
        : [...prev, mealKey]
    );
  };

  const getRecipeCount = (mealType: string) => {
    const recipes = getRecipesByMealType(mealType);
    return recipes ? recipes.length : 0;
  };

  const generateDailyMealPlan = async () => {
    if (selectedMeals.length === 0) {
      toast({
        title: "Hiba",
        description: "Válasszon ki legalább egy étkezési típust!",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('🍽️ Napi étrend generálása:', selectedMeals);
      
      const newRecipes = [];
      
      for (const mealType of selectedMeals) {
        // Javított receptkeresés a felhasználó preferenciái alapján
        const foundRecipes = getRecipesByMealType(mealType);
        
        if (foundRecipes && foundRecipes.length > 0) {
          const randomIndex = Math.floor(Math.random() * foundRecipes.length);
          const selectedSupabaseRecipe = foundRecipes[randomIndex];
          const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
          
          // Meghatározzuk az alapanyagokat a receptből
          const mainIngredients = [
            selectedSupabaseRecipe['Hozzavalo_1'],
            selectedSupabaseRecipe['Hozzavalo_2'],
            selectedSupabaseRecipe['Hozzavalo_3']
          ].filter(Boolean);
          
          newRecipes.push({
            ...standardRecipe,
            mealType,
            category: "automatikus",
            ingredient: mainIngredients[0] || "vegyes alapanyagok"
          });
        }
      }
      
      setGeneratedRecipes(newRecipes);
      
      if (newRecipes.length > 0) {
        toast({
          title: "Étrend elkészült!",
          description: `${newRecipes.length} recept sikeresen generálva a preferenciáid alapján.`,
        });
      } else {
        toast({
          title: "Nincs megfelelő recept",
          description: "Nem található elegendő recept a kiválasztott étkezésekhez.",
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

  const handleRating = async (recipeName: string, rating: number) => {
    const success = await saveRating(recipeName, rating);
    if (success) {
      toast({
        title: "Értékelés mentve!",
        description: `${recipeName} értékelése: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`,
      });
    } else {
      toast({
        title: "Hiba",
        description: "Nem sikerült menteni az értékelést.",
        variant: "destructive"
      });
    }
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
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={onToggleSingleRecipe}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Vissza a főmenübe
          </Button>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Napi Étrend Tervező
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Válassza ki az étkezési típusokat és generáljon egy teljes napi étrendet a preferenciái alapján.
        </p>
      </div>

      {/* Meal Type Selection */}
      <MealTypeCardSelector
        selectedMeals={selectedMeals}
        onMealToggle={handleMealToggle}
        getRecipeCount={getRecipeCount}
      />

      {/* Generate Full Meal Plan Button */}
      {selectedMeals.length > 0 && (
        <div className="text-center">
          <Button
            onClick={generateDailyMealPlan}
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
                Teljes napi étrend generálása ({selectedMeals.length} étkezés)
              </>
            )}
          </Button>
        </div>
      )}

      {/* Generated Recipes */}
      {generatedRecipes.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-800">
            🍽️ Generált Napi Étrend
          </h2>
          <div className="grid gap-6">
            {generatedRecipes.map((recipe, index) => (
              <Card key={index} className="overflow-hidden border-2 border-purple-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-purple-800 capitalize flex items-center gap-2">
                        {mealTypes.find(m => m.key === recipe.mealType)?.emoji} {recipe.mealType}
                      </CardTitle>
                      <CardDescription className="flex gap-2 mt-2">
                        <Badge variant="secondary">{recipe.category}</Badge>
                        <Badge variant="outline">{recipe.ingredient}</Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <RecipeDisplay
                    recipe={recipe}
                    isLoading={false}
                    onRegenerate={() => {}}
                    onNewRecipe={() => {}}
                    user={user}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
