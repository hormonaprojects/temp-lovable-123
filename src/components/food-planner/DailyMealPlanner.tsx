
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Star, Heart, Home } from "lucide-react";
import { RecipeDisplay } from "./RecipeDisplay";
import { MealSelectionCard } from "./MealSelectionCard";
import { MealTypeCardSelector } from "./MealTypeCardSelector";
import { MultiCategoryIngredientSelector } from "./MultiCategoryIngredientSelector";
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

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

export function DailyMealPlanner({ user, onToggleSingleRecipe }: DailyMealPlannerProps) {
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [mealSelections, setMealSelections] = useState<MealSelections>({});
  const [generatedRecipes, setGeneratedRecipes] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showIngredientSelection, setShowIngredientSelection] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
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
    setSelectedMeals(prev => {
      const newSelectedMeals = prev.includes(mealKey) 
        ? prev.filter(m => m !== mealKey)
        : [...prev, mealKey];
      
      // Ha van kiválasztott étkezés, mutassuk az alapanyag szűrőt
      setShowIngredientSelection(newSelectedMeals.length > 0);
      
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

  const handleGetMultipleCategoryRecipes = async (ingredients: SelectedIngredient[]) => {
    if (selectedMeals.length === 0) {
      toast({
        title: "Hiba",
        description: "Válasszon ki legalább egy étkezési típust!",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setSelectedIngredients(ingredients);
    
    try {
      console.log('🍽️ Napi étrend generálása alapanyagokkal:', { selectedMeals, ingredients });
      
      const newRecipes = [];
      
      for (const mealType of selectedMeals) {
        // Ha vannak kiválasztott alapanyagok, azokat használjuk szűrésre
        let foundRecipes = [];
        
        if (ingredients.length > 0) {
          // Olyan recepteket keresünk, amelyek tartalmazzák a kiválasztott alapanyagokat
          const mealTypeRecipes = getRecipesByMealType(mealType);
          
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

          foundRecipes = mealTypeRecipes.filter(recipe => {
            const recipeIngredients = getAllRecipeIngredients(recipe);
            
            // Ellenőrizzük, hogy legalább egy kiválasztott alapanyag szerepel-e a receptben
            return ingredients.some(selectedIng => 
              hasIngredient(recipeIngredients, selectedIng.ingredient)
            );
          });
        } else {
          // Ha nincs alapanyag kiválasztva, használjuk az alapértelmezett szűrést
          foundRecipes = getRecipesByMealType(mealType);
        }
        
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
            category: ingredients.length > 0 ? "alapanyag alapú" : "automatikus",
            ingredient: ingredients.length > 0 
              ? ingredients.map(ing => ing.ingredient).join(", ") 
              : mainIngredients[0] || "vegyes alapanyagok"
          });
        }
      }
      
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
          description: "Nem található elegendő recept a kiválasztott étkezésekhez és alapanyagokhoz.",
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

  const generateDailyMealPlan = async () => {
    await handleGetMultipleCategoryRecipes(selectedIngredients);
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
          Válassza ki az étkezési típusokat és opcionálisan alapanyagokat, majd generáljon egy teljes napi étrendet.
        </p>
      </div>

      {/* Meal Type Selection */}
      <MealTypeCardSelector
        selectedMeals={selectedMeals}
        onMealToggle={handleMealToggle}
        getRecipeCount={getRecipeCount}
      />

      {/* Compact Ingredient Selection */}
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
              selectedMealType={selectedMeals[0]} // Használjuk az első kiválasztott étkezést
              foodData={foodData}
              onGetMultipleCategoryRecipes={handleGetMultipleCategoryRecipes}
              getFavoriteForIngredient={getFavoriteForIngredient}
            />
          </CardContent>
        </Card>
      )}

      {/* Generate Meal Plan Button (when no ingredients selected) */}
      {selectedMeals.length > 0 && selectedIngredients.length === 0 && (
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
                Étrend generálása alapanyagok nélkül ({selectedMeals.length} étkezés)
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
