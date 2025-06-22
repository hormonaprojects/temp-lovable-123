
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Shuffle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface FoodData {
  mealTypes: { [key: string]: { categories: { [key: string]: string[] } } };
  categories: { [key: string]: string[] };
  getFilteredIngredients: (category: string) => string[];
  getRecipesByMealType: (mealType: string) => any[];
}

interface MealType {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface MealTypeSelectorProps {
  selectedMealType: string;
  onSelectMealType: (mealType: string) => void;
  foodData: FoodData;
  onGetRandomRecipe?: () => void;
  onShowIngredientSelection?: () => void;
  onShowMultiCategorySelection?: () => void;
}

export function MealTypeSelector({ 
  selectedMealType, 
  onSelectMealType, 
  foodData, 
  onGetRandomRecipe,
  onShowIngredientSelection,
  onShowMultiCategorySelection
}: MealTypeSelectorProps) {
  const mealTypes: MealType[] = [
    { id: "reggeli", name: "Reggeli", icon: "🍳" },
    { id: "tízórai", name: "Tízórai", icon: "🍎" },
    { id: "ebéd", name: "Ebéd", icon: "🍲" },
    { id: "leves", name: "Leves", icon: "🥣" },
    { id: "uzsonna", name: "Uzsonna", icon: "🥪" },
    { id: "vacsora", name: "Vacsora", icon: "🥗" },
  ];

  const handleMealTypeSelect = (mealType: string) => {
    onSelectMealType(mealType);
  };

  return (
    <Card className="mb-8 bg-white/5 backdrop-blur-lg border-white/10 shadow-2xl">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
          <Clock className="h-6 w-6 text-purple-400" />
          Étkezés típusa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {mealTypes.map((mealType) => (
            <div
              key={mealType.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105",
                selectedMealType === mealType.id
                  ? "ring-4 ring-purple-400 shadow-2xl"
                  : "hover:shadow-xl"
              )}
              onClick={() => handleMealTypeSelect(mealType.id)}
            >
              <div className={cn(
                "p-6 h-32 flex flex-col items-center justify-center text-center transition-all duration-300",
                selectedMealType === mealType.id
                  ? "bg-gradient-to-br from-purple-500/40 to-pink-500/40 border-purple-400"
                  : "bg-white/10 hover:bg-white/20"
              )}>
                <div className="text-3xl mb-2">{mealType.icon}</div>
                <h3 className="text-white font-semibold text-sm">{mealType.name}</h3>
              </div>
            </div>
          ))}
        </div>

        {selectedMealType && (
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
            <Button
              onClick={onGetRandomRecipe}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Véletlenszerű recept
            </Button>

            <Button
              onClick={onShowMultiCategorySelection}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Layers className="mr-2 h-4 w-4" />
              Alapanyag szerint
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
