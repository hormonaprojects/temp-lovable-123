
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { LoadingChef } from "@/components/ui/LoadingChef";
import { Recipe } from "@/types/recipe";
import { RecipeContent } from "./RecipeContent";
import { NutritionInfo } from "./NutritionInfo";
import { RecipeActions } from "./RecipeActions";
import { RecipeModal } from "./RecipeModal";

interface RecipeDisplayProps {
  recipe: Recipe | null;
  isLoading: boolean;
  onRegenerate: () => void;
  onNewRecipe: () => void;
  user: any;
}

export function RecipeDisplay({ recipe, isLoading, onRegenerate, onNewRecipe, user }: RecipeDisplayProps) {
  const [fullScreenModalOpen, setFullScreenModalOpen] = useState(false);
  const { toast } = useToast();
  const { saveRating } = useSupabaseData(user?.id);

  // Automatikus scroll az új recepthez
  useEffect(() => {
    if (recipe && !isLoading) {
      setTimeout(() => {
        const recipeElement = document.querySelector('.recipe-result');
        if (recipeElement) {
          recipeElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  }, [recipe, isLoading]);

  const handleRating = async (rating: number) => {
    if (!recipe || !user?.id) {
      toast({
        title: "Hiba",
        description: "Be kell jelentkezni az értékeléshez.",
        variant: "destructive"
      });
      return;
    }

    const success = await saveRating(recipe.név, rating);
    
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <LoadingChef />
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <>
      <div className="recipe-result bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-8 mb-4 sm:mb-8 mx-2 sm:mx-0">
        <div onClick={() => setFullScreenModalOpen(true)}>
          <RecipeContent recipe={recipe} />
        </div>

        <NutritionInfo recipe={recipe} />

        <RecipeActions
          recipe={recipe}
          user={user}
          onRegenerate={onRegenerate}
          onNewRecipe={onNewRecipe}
          onRating={handleRating}
        />
      </div>

      <RecipeModal
        recipe={recipe}
        user={user}
        isOpen={fullScreenModalOpen}
        onClose={() => setFullScreenModalOpen(false)}
        onRating={handleRating}
      />
    </>
  );
}
