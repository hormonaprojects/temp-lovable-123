
import { Button } from "@/components/ui/button";
import { RefreshCw, Star } from "lucide-react";

interface MealPlanGenerationButtonProps {
  selectedMeals: string[];
  selectedIngredients: any[];
  isGenerating: boolean;
  onGenerateMealPlan: () => Promise<void>;
}

export function MealPlanGenerationButton({
  selectedMeals,
  selectedIngredients,
  isGenerating,
  onGenerateMealPlan
}: MealPlanGenerationButtonProps) {
  if (selectedMeals.length === 0 || selectedIngredients.length > 0) {
    return null;
  }

  return (
    <div className="text-center">
      <Button
        onClick={onGenerateMealPlan}
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
  );
}
