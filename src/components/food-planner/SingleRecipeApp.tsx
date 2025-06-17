
import { useState, useEffect } from "react";
import { MealTypeSelector } from "./MealTypeSelector";
import { CategoryIngredientSelector } from "./CategoryIngredientSelector";
import { RecipeDisplay } from "./RecipeDisplay";
import { Button } from "@/components/ui/button";
import { Recipe, FoodData } from "@/types/recipe";
import { useToast } from "@/hooks/use-toast";

interface SingleRecipeAppProps {
  user: any;
  onToggleDailyPlanner: () => void;
}

export function SingleRecipeApp({ user, onToggleDailyPlanner }: SingleRecipeAppProps) {
  const [selectedMealType, setSelectedMealType] = useState("");
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [foodData, setFoodData] = useState<FoodData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFoodData();
  }, []);

  const loadFoodData = async () => {
    try {
      console.log('📊 Adatok betöltése...');
      
      // Mock data for demonstration - replace with actual API call
      const mockFoodData: FoodData = {
        mealTypes: {
          'reggeli': {
            categories: {
              'Péksütemények': ['kenyér', 'kifli', 'croissant'],
              'Tejtermékek': ['tej', 'joghurt', 'túró'],
              'Tojás': ['rántotta', 'főtt tojás', 'omlett']
            }
          },
          'tizórai': {
            categories: {
              'Gyümölcsök': ['alma', 'banán', 'narancs'],
              'Snackek': ['müzli', 'diófélék', 'smoothie']
            }
          },
          'ebéd': {
            categories: {
              'Húsételek': ['csirkemell', 'sertésszelet', 'marhahús'],
              'Tésztafélék': ['spagetti', 'penne', 'lasagne'],
              'Rizses ételek': ['risotto', 'paella', 'sushi']
            }
          },
          'uzsonna': {
            categories: {
              'Sütemények': ['muffin', 'süti', 'torta'],
              'Egészséges': ['gyümölcs', 'zöldség', 'magvak']
            }
          },
          'vacsora': {
            categories: {
              'Könnyű ételek': ['saláta', 'leves', 'zöldség'],
              'Húsételek': ['grillezett hús', 'hal', 'szárnyasok']
            }
          }
        }
      };

      setFoodData(mockFoodData);
      setDataLoaded(true);
      console.log('✅ Adatok sikeresen betöltve');
      
    } catch (error) {
      console.error('❌ Hiba az adatok betöltésekor:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni az adatokat.",
        variant: "destructive"
      });
    }
  };

  const getRecipe = async (category: string, ingredient: string) => {
    if (!selectedMealType) return;

    setIsLoading(true);
    setCurrentRecipe(null);

    try {
      console.log('🔍 Recept keresése:', { selectedMealType, category, ingredient });
      
      // Simulate API call with mock recipe
      const mockRecipe: Recipe = {
        név: ingredient ? `${ingredient} alapú ${selectedMealType}` : `Random ${selectedMealType}`,
        hozzávalók: [
          ingredient || 'Alapanyag 1',
          'Só, bors',
          'Olaj',
          'Víz'
        ],
        elkészítés: '1. Készítsd elő az alapanyagokat. 2. Keverd össze a hozzávalókat. 3. Főzd meg megfelelő hőmérsékleten. 4. Tálald és kóstold meg!',
        elkészítésiIdő: '30 perc',
        fehérje: '25',
        szénhidrát: '45',
        zsír: '12',
        képUrl: 'https://via.placeholder.com/400x300?text=Recept+Kép'
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCurrentRecipe(mockRecipe);
      
      toast({
        title: "Recept kész!",
        description: `${mockRecipe.név} sikeresen betöltve.`,
      });

    } catch (error) {
      console.error('❌ Hiba a recept kérésekor:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a receptet.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateRecipe = () => {
    if (selectedMealType) {
      getRecipe('', ''); // Get random recipe
    }
  };

  const resetForm = () => {
    setSelectedMealType("");
    setCurrentRecipe(null);
  };

  if (!dataLoaded) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
        <div className="text-white text-xl font-semibold">Adatok betöltése...</div>
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

      {selectedMealType && foodData && (
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
