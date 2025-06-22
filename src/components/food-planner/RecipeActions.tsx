
import { Button } from "@/components/ui/button";
import { StarRating } from "./StarRating";
import { FavoriteButton } from "./FavoriteButton";
import { Recipe } from "@/types/recipe";

interface RecipeActionsProps {
  recipe: Recipe;
  user: any;
  onRegenerate: () => void;
  onNewRecipe: () => void;
  onRating: (rating: number) => void;
  isFullScreen?: boolean;
}

export function RecipeActions({ 
  recipe, 
  user, 
  onRegenerate, 
  onNewRecipe, 
  onRating, 
  isFullScreen = false 
}: RecipeActionsProps) {
  const titleClass = isFullScreen
    ? "text-base sm:text-xl font-bold text-white mb-3 sm:mb-4"
    : "text-sm sm:text-base font-bold text-white mb-2 sm:mb-3";

  const buttonClass = isFullScreen
    ? "px-3 sm:px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm"
    : "px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-xs";

  return (
    <div className={`${isFullScreen ? 'text-center pt-3 sm:pt-4 border-t border-white/20' : 'mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20'}`}>
      <div className="text-center mb-2 sm:mb-3">
        <h3 className={titleClass}>⭐ Értékeld a receptet:</h3>
        <StarRating 
          recipeName={recipe.név} 
          onRate={onRating}
        />
      </div>

      {!isFullScreen && (
        <div className="flex flex-col sm:flex-row justify-center gap-2 mt-2 sm:mt-3">
          <Button
            onClick={onRegenerate}
            className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white ${buttonClass}`}
          >
            🔄 Másik hasonló
          </Button>
          <Button
            onClick={onNewRecipe}
            className={`bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white ${buttonClass}`}
          >
            🎯 Új recept
          </Button>
          <FavoriteButton user={user} recipe={recipe} />
        </div>
      )}
    </div>
  );
}
