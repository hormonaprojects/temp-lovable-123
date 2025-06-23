
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { RecipeDisplay } from "./RecipeDisplay";
import { LoadingChef } from "@/components/ui/LoadingChef";

interface GeneratedMealPlanProps {
  generatedRecipes: any[];
  user: any;
  onGenerateSimilar?: (recipe: any, mealType: string) => void;
}

export function GeneratedMealPlan({ generatedRecipes, user, onGenerateSimilar }: GeneratedMealPlanProps) {
  const [expandedRecipe, setExpandedRecipe] = useState<any>(null);
  const [fullScreenModalOpen, setFullScreenModalOpen] = useState(false);
  const { toast } = useToast();
  const { saveRating } = useSupabaseData(user?.id);

  // Automatikus scroll az új étrendhez
  useEffect(() => {
    if (generatedRecipes.length > 0) {
      setTimeout(() => {
        const mealPlanElement = document.querySelector('.generated-meal-plan');
        if (mealPlanElement) {
          mealPlanElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  }, [generatedRecipes]);

  const handleRating = async (recipeName: string, rating: number) => {
    if (!user?.id) {
      toast({
        title: "Hiba",
        description: "Be kell jelentkezni az értékeléshez.",
        variant: "destructive"
      });
      return;
    }

    const success = await saveRating(recipeName, rating);
    
    if (success) {
      toast({
        title: "Köszönjük az értékelést!",
        description: `${rating}/5 csillag mentve az adatbázisba.`,
      });
    } else {
      toast({
        title: "Hiba",
        description: "Nem sikerült menteni az értékelést.",
        variant: "destructive"
      });
    }
  };

  if (generatedRecipes.length === 0) {
    return null;
  }

  return (
    <div className="generated-meal-plan space-y-4 sm:space-y-6 mt-6 sm:mt-8">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          🍽️ Generált napi étrend ({generatedRecipes.length} étkezés)
        </h2>
        <p className="text-white/80 text-sm sm:text-base">
          Kattintson bármelyik receptre a részletek megtekintéséhez
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {generatedRecipes.map((recipe, index) => (
          <div
            key={`${recipe.mealType}-${index}`}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">
                {recipe.mealType === 'reggeli' && '🍳'}
                {recipe.mealType === 'tízórai' && '🥪'}
                {recipe.mealType === 'ebéd' && '🍽️'}
                {recipe.mealType === 'uzsonna' && '🧁'}
                {recipe.mealType === 'vacsora' && '🌮'}
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white capitalize">
                  {recipe.mealType}
                </h3>
                {recipe.ingredient && (
                  <p className="text-white/70 text-xs sm:text-sm">
                    Alapanyag: {recipe.ingredient}
                  </p>
                )}
              </div>
            </div>

            <RecipeDisplay
              recipe={recipe}
              isLoading={false}
              onRegenerate={() => {}}
              onNewRecipe={() => {}}
              onGenerateSimilar={() => onGenerateSimilar?.(recipe, recipe.mealType)}
              user={user}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
