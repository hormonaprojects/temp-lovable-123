
import { useState, useEffect } from "react";
import { MealTypeSelector } from "./MealTypeSelector";
import { CategoryIngredientSelector } from "./CategoryIngredientSelector";
import { RecipeDisplay } from "./RecipeDisplay";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/types/recipe";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";

interface SingleRecipeAppProps {
  user: any;
  onToggleDailyPlanner: () => void;
}

export function SingleRecipeApp({ user, onToggleDailyPlanner }: SingleRecipeAppProps) {
  const [selectedMealType, setSelectedMealType] = useState("");
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    convertToStandardRecipe
  } = useSupabaseData();

  const getRecipe = async (category: string, ingredient: string) => {
    if (!selectedMealType) return;

    setIsLoading(true);
    setCurrentRecipe(null);
    
    // Eltároljuk a keresési paramétereket - BELEÉRTVE az étkezési típust is!
    setLastSearchParams({ category, ingredient, mealType: selectedMealType });

    try {
      console.log('🔍 SZIGORÚ recept keresése:', { selectedMealType, category, ingredient });
      
      let foundRecipes = [];

      if (category && ingredient) {
        // Specifikus kategória és hozzávaló alapján - ÉTKEZÉSI TÍPUSSAL SZŰRVE
        foundRecipes = getRecipesByCategory(category, ingredient, selectedMealType);
        console.log(`🎯 Specifikus keresés eredménye: ${foundRecipes.length} recept`);
      } else if (category) {
        // Csak kategória alapján - ÉTKEZÉSI TÍPUSSAL SZŰRVE
        foundRecipes = getRecipesByCategory(category, undefined, selectedMealType);
        console.log(`🎯 Kategória keresés eredménye: ${foundRecipes.length} recept`);
      } else {
        // Random recept az étkezés típus alapján
        foundRecipes = getRecipesByMealType(selectedMealType);
        console.log(`🎯 Étkezési típus keresés eredménye: ${foundRecipes.length} recept`);
      }

      // Ha nincs találat, NE próbáljunk random receptet - maradjunk szigorúak
      if (foundRecipes.length > 0) {
        // Random kiválasztás a találatok közül
        const randomIndex = Math.floor(Math.random() * foundRecipes.length);
        const selectedSupabaseRecipe = foundRecipes[randomIndex];
        const standardRecipe = convertToStandardRecipe(selectedSupabaseRecipe);
        
        setCurrentRecipe(standardRecipe);
        
        toast({
          title: "Recept betöltve!",
          description: `${standardRecipe.név} sikeresen betöltve az adatbázisból.`,
        });
      } else {
        toast({
          title: "Nincs találat",
          description: "Nem található recept a megadott feltételekkel ehhez az étkezési típushoz.",
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

  const regenerateRecipe = () => {
    if (selectedMealType) {
      // Ugyanazokkal a paraméterekkel keresünk újra - BELEÉRTVE az étkezési típust is!
      console.log('🔄 Újragenerálás ugyanazokkal a paraméterekkel:', lastSearchParams);
      getRecipe(lastSearchParams.category, lastSearchParams.ingredient);
    }
  };

  const resetForm = () => {
    setSelectedMealType("");
    setCurrentRecipe(null);
    setLastSearchParams({ category: "", ingredient: "", mealType: "" });
  };

  // Adatstruktúra előkészítése a komponensek számára
  const foodData = {
    mealTypes: mealTypes,
    categories: categories
  };

  console.log('🗂️ FoodData átadva komponenseknek:', foodData);

  if (dataLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
        <div className="text-white text-xl font-semibold">Adatok betöltése az adatbázisból...</div>
        <div className="text-white/70 mt-2">Kérjük várjon...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">🍽️ Ételtervező</h1>
        <p className="text-white/80 text-lg">Válassz étkezést és készíts finom ételeket!</p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <Button
          onClick={resetForm}
          className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          🔄 Új választás
        </Button>
        <Button
          onClick={onToggleDailyPlanner}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          📅 Napi étrendtervező
        </Button>
      </div>

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
        />
      )}

      <RecipeDisplay
        recipe={currentRecipe}
        isLoading={isLoading}
        onRegenerate={regenerateRecipe}
        onNewRecipe={resetForm}
      />
    </div>
  );
}
