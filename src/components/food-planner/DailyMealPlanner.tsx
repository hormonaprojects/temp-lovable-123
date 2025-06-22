import { useState, useEffect } from "react";
import { useAuth } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Star, Heart, Home } from "lucide-react";
import { RecipeDisplay } from "./RecipeDisplay";
import { MealSelectionCard } from "./MealSelectionCard";
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
    handleFavoriteToggle
  } = useSupabaseData(user?.id);

  const mealTypes = [
    { key: 'reggeli', label: 'Reggeli', emoji: '🍳' },
    { key: 'tizórai', label: 'Tízórai', emoji: '🥪' },
    { key: 'ebéd', label: 'Ebéd', emoji: '🍽️' },
    { key: 'uzsonna', label: 'Uzsonna', emoji: '🧁' },
    { key: 'vacsora', label: 'Vacsora', emoji: '🌮' },
    { key: 'leves', label: 'Leves', emoji: '🍲' }
  ];

  const handleMealToggle = (mealKey: string) => {
    setSelectedMeals(prev => 
      prev.includes(mealKey) 
        ? prev.filter(m => m !== mealKey)
        : [...prev, mealKey]
    );
  };

  const handleSelectionChange = (mealType: string, category: string, ingredient: string) => {
    setMealSelections(prev => ({
      ...prev,
      [mealType]: { category, ingredient }
    }));
  };

  const handleGetRecipe = async (mealType: string, category: string, ingredient: string) => {
    setIsGenerating(true);
    
    try {
      console.log('🔄 Recept generálása:', { mealType, category, ingredient });
      
      let recipes;
      
      if (category === "no-category" || !category) {
        // Ha nincs kategória megadva, válasszunk véletlenszerűen
        const availableCategories = Object.keys(categories);
        const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        const categoryIngredients = getFilteredIngredients(randomCategory);
        const randomIngredient = categoryIngredients[Math.floor(Math.random() * categoryIngredients.length)];
        
        console.log('🎲 Véletlenszerű választás:', { randomCategory, randomIngredient });
        recipes = getRecipesByCategory(randomCategory, randomIngredient, mealType);
      } else if (ingredient === "no-ingredient" || !ingredient) {
        // Ha nincs alapanyag megadva, de van kategória
        const categoryIngredients = getFilteredIngredients(category);
        const randomIngredient = categoryIngredients[Math.floor(Math.random() * categoryIngredients.length)];
        
        console.log('🎲 Véletlenszerű alapanyag a kategóriában:', { category, randomIngredient });
        recipes = getRecipesByCategory(category, randomIngredient, mealType);
      } else {
        // Ha mindkettő meg van adva
        recipes = getRecipesByCategory(category, ingredient, mealType);
      }

      if (recipes && recipes.length > 0) {
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        const standardRecipe = convertToStandardRecipe(randomRecipe);
        
        console.log('✅ Recept generálva:', standardRecipe.név);
        
        setGeneratedRecipes([{
          ...standardRecipe,
          mealType,
          category: category === "no-category" ? "véletlenszerű" : category,
          ingredient: ingredient === "no-ingredient" ? "véletlenszerű" : ingredient
        }]);
        
        toast({
          title: "Recept elkészült!",
          description: `${mealType} recept sikeresen generálva.`,
        });
      } else {
        console.log('❌ Nincs recept találva');
        toast({
          title: "Nincs recept",
          description: "Nem található recept ezekkel a feltételekkel.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Recept generálási hiba:', error);
      toast({
        title: "Hiba",
        description: "Hiba történt a recept generálása közben.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
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
        const selection = mealSelections[mealType];
        
        let recipes;
        let finalCategory, finalIngredient;
        
        if (!selection || selection.category === "no-category" || !selection.category) {
          // Véletlenszerű kategória és alapanyag
          const availableCategories = Object.keys(categories);
          finalCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
          const categoryIngredients = getFilteredIngredients(finalCategory);
          finalIngredient = categoryIngredients[Math.floor(Math.random() * categoryIngredients.length)];
        } else if (selection.ingredient === "no-ingredient" || !selection.ingredient) {
          // Megadott kategória, véletlenszerű alapanyag
          finalCategory = selection.category;
          const categoryIngredients = getFilteredIngredients(finalCategory);
          finalIngredient = categoryIngredients[Math.floor(Math.random() * categoryIngredients.length)];
        } else {
          // Mindkettő megadva
          finalCategory = selection.category;
          finalIngredient = selection.ingredient;
        }
        
        recipes = getRecipesByCategory(finalCategory, finalIngredient, mealType);
        
        if (recipes && recipes.length > 0) {
          const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
          const standardRecipe = convertToStandardRecipe(randomRecipe);
          
          newRecipes.push({
            ...standardRecipe,
            mealType,
            category: finalCategory,
            ingredient: finalIngredient
          });
        }
      }
      
      setGeneratedRecipes(newRecipes);
      
      toast({
        title: "Étrend elkészült!",
        description: `${newRecipes.length} recept sikeresen generálva.`,
      });
      
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
          Válassza ki az étkezési típusokat és opcionálisan adjon meg kategóriákat és alapanyagokat az egyes étkezésekhez.
        </p>
      </div>

      {/* Meal Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mealTypes.map((mealType) => (
          <MealSelectionCard
            key={mealType.key}
            mealType={mealType.key}
            mealLabel={mealType.label}
            emoji={mealType.emoji}
            isSelected={selectedMeals.includes(mealType.key)}
            onToggle={handleMealToggle}
            categories={Object.keys(categories)}
            getIngredientsByCategory={getFilteredIngredients}
            getFavoriteForIngredient={(ingredient: string) => {
              // Megkeressük, hogy melyik kategóriához tartozik az alapanyag
              for (const [categoryName, ingredients] of Object.entries(categories)) {
                if (ingredients.includes(ingredient)) {
                  return getFavoriteForIngredient(ingredient, categoryName);
                }
              }
              return false;
            }}
            onGetRecipe={handleGetRecipe}
            onSelectionChange={handleSelectionChange}
            isGenerating={isGenerating}
            showRecipeButton={true}
          />
        ))}
      </div>

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
            Generált Receptek
          </h2>
          <div className="grid gap-6">
            {generatedRecipes.map((recipe, index) => (
              <Card key={index} className="overflow-hidden border-2 border-purple-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-purple-800 capitalize">
                        {recipe.mealType}
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
                    onRating={handleRating}
                    getFavoriteForIngredient={getFavoriteForIngredient}
                    onFavoriteToggle={handleFavoriteToggle}
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
