
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
    ? "text-base sm:text-2xl font-bold text-white mb-3 sm:mb-6"
    : "text-sm sm:text-xl font-bold text-white mb-2 sm:mb-4";

  const buttonClass = isFullScreen
    ? "px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-base"
    : "px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-base";

  return (
    <div className={`${isFullScreen ? 'text-center pt-4 sm:pt-6 border-t border-white/20' : 'mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-white/20'}`}>
      <div className="text-center mb-3 sm:mb-4">
        <h3 className={titleClass}>⭐ Értékeld a receptet:</h3>
        <StarRating 
          recipeName={recipe.név} 
          onRate={onRating}
        />
      </div>

      {!isFullScreen && (
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mt-3 sm:mt-6">
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
