
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MealTypeCardSelectorProps {
  selectedMeals: string[];
  onMealToggle: (mealKey: string) => void;
  getRecipeCount: (mealType: string) => number;
}

const mealOptions = [
  { key: "reggeli", label: "Reggeli", emoji: "🌅" },
  { key: "tízórai", label: "Tízórai", emoji: "☕" },
  { key: "ebéd", label: "Ebéd", emoji: "🍛" },
  { key: "uzsonna", label: "Uzsonna", emoji: "🥨" },
  { key: "vacsora", label: "Vacsora", emoji: "🌙" }
];

export function MealTypeCardSelector({ selectedMeals, onMealToggle, getRecipeCount }: MealTypeCardSelectorProps) {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-white mb-6 text-center">
        🍽️ Válaszd ki az étkezéseket
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {mealOptions.map((meal) => {
          const isSelected = selectedMeals.includes(meal.key);
          const recipeCount = getRecipeCount(meal.key);
          
          return (
            <Button
              key={meal.key}
              onClick={() => onMealToggle(meal.key)}
              className={cn(
                "py-6 text-lg font-semibold rounded-xl transition-all duration-300 min-h-[100px] flex flex-col items-center justify-center border-2",
                isSelected
                  ? "bg-yellow-400 text-black hover:bg-yellow-300 shadow-lg scale-105 border-yellow-300"
                  : "bg-white/20 text-white hover:bg-white/30 hover:scale-102 border-white/30"
              )}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">
                  {meal.emoji}
                </div>
                <div className="text-sm font-medium">{meal.label}</div>
                <div className="text-xs opacity-75 mt-1">
                  {recipeCount} recept
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
