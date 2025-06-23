
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { RecipeDisplay } from "./RecipeDisplay";
import { LoadingChef } from "@/components/ui/LoadingChef";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GeneratedMealPlanProps {
  generatedRecipes: any[];
  user: any;
  onGenerateSimilar?: (recipe: any, mealType: string) => void;
}

export function GeneratedMealPlan({ generatedRecipes, user, onGenerateSimilar }: GeneratedMealPlanProps) {
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set());
  const [fullScreenModalOpen, setFullScreenModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const { toast } = useToast();
  const { saveRating } = useSupabaseData(user?.id);

  // Automatikus scroll az új étrendhez
  useEffect(() => {
    if (generatedRecipes.length > 0) {
      // Reset expanded recipes when new recipes are generated
      setExpandedRecipes(new Set());
      
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

  const toggleRecipeExpansion = (recipeKey: string) => {
    setExpandedRecipes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recipeKey)) {
        newSet.delete(recipeKey);
      } else {
        newSet.add(recipeKey);
      }
      return newSet;
    });
  };

  const openFullScreenModal = (recipe: any) => {
    setSelectedRecipe(recipe);
    setFullScreenModalOpen(true);
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
          Kattintson bármelyik étkezésre a recept megnyitásához
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {generatedRecipes.map((recipe, index) => {
          const recipeKey = `${recipe.mealType}-${index}`;
          const isExpanded = expandedRecipes.has(recipeKey);
          
          return (
            <div
              key={recipeKey}
              className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl overflow-hidden"
            >
              {/* Collapsed Header */}
              <div 
                className="p-3 sm:p-4 cursor-pointer hover:bg-white/5 transition-all duration-200"
                onClick={() => toggleRecipeExpansion(recipeKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl sm:text-3xl">
                      {recipe.mealType === 'reggeli' && '🍳'}
                      {recipe.mealType === 'tízórai' && '🥪'}
                      {recipe.mealType === 'ebéd' && '🍽️'}
                      {recipe.mealType === 'uzsonna' && '🧁'}
                      {recipe.mealType === 'vacsora' && '🌮'}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-white capitalize">
                        {recipe.mealType}
                      </h3>
                      <p className="text-white font-semibold text-sm sm:text-base">
                        {recipe.név}
                      </p>
                      {recipe.ingredient && (
                        <p className="text-white/70 text-xs sm:text-sm">
                          Alapanyag: {recipe.ingredient}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-white/10">
                  <RecipeDisplay
                    recipe={recipe}
                    isLoading={false}
                    onRegenerate={() => {}}
                    onNewRecipe={() => {}}
                    onGenerateSimilar={() => onGenerateSimilar?.(recipe, recipe.mealType)}
                    user={user}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
